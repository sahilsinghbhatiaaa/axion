const express = require('express');
const router = express.Router();
const Student = require('../models/student.model');
const School = require('../models/school.model');
const Classroom = require('../models/classroom.model');
const tokenManager = require('../token/Token.manager');
const config = require('../../config/index.config');

class StudentManager {
    constructor() {
        this.config = config;
        router.post('/', this.createStudent.bind(this));
        router.get('/', this.getStudent.bind(this));  // Endpoint for fetching students
        router.put('/', this.updateStudent.bind(this));
        router.delete('/', this.deleteByID.bind(this));
    }

    async createStudent(req, res) {
        const { firstName, lastName, dob, schoolId, classroomId, enrollmentDate, transferHistory, profile } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !dob || !schoolId || !classroomId || !enrollmentDate) {
            return res.status(400).json({
                status: 'failure',
                message: 'FirstName, lastName, dob, schoolId, classroomId, and enrollmentDate are required fields.',
            });
        }

        try {
            // Check if the referenced school and classroom exist
            const schoolExists = await School.findOne({ id: schoolId });
            const classroomExists = await Classroom.findOne({ id: classroomId });

            if (!schoolExists) {
                return res.status(404).json({
                    status: 'failure',
                    message: 'The specified schoolId does not exist.',
                });
            }

            if (!classroomExists) {
                return res.status(404).json({
                    status: 'failure',
                    message: 'The specified classroomId does not exist.',
                });
            }

            // Create a new student
            const newStudent = new Student({
                firstName,
                lastName,
                dob,
                schoolId,
                classroomId,
                enrollmentDate,
                transferHistory: transferHistory || [],  // Default to an empty array if not provided
                profile,
            });

            // Save the student to the database
            await newStudent.save();

            return res.status(201).json({
                status: 'success',
                message: 'Student created successfully.',
                data: newStudent,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: 'failure',
                message: 'Error creating student.',
                data: error.message,
            });
        }
    }

    async getStudent(req, res) {
        const { id, schoolId, classroomId, page = 1, limit = 10 } = req.query;

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        let query = {};

        if (id) {
            query.id = id;
        }

        if (schoolId) {
            query.schoolId = schoolId;
        }

        if (classroomId) {
            query.classroomId = classroomId;
        }

        try {
            // Fetch students with pagination
            const students = await Student.find(query)
                .skip((pageNumber - 1) * limitNumber)
                .limit(limitNumber);

            const totalCount = await Student.countDocuments(query);

            if (!students || students.length === 0) {
                return res.status(404).json({
                    status: 'failure',
                    message: 'Student(s) not found.',
                });
            }

            return res.status(200).json({
                status: 'success',
                message: 'Student(s) found.',
                data: students,
                pagination: {
                    currentPage: pageNumber,
                    totalPages: Math.ceil(totalCount / limitNumber),
                    totalCount: totalCount,
                    pageSize: limitNumber,
                }
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: 'failure',
                message: 'Error retrieving student(s).',
                data: error.message,
            });
        }
    }

    async updateStudent(req, res) {
        const { id } = req.query;
        const { firstName, lastName, dob, schoolId, classroomId, enrollmentDate, profile } = req.body;
    
        if (!id) {
            return res.status(400).json({
                status: 'failure',
                message: 'Student ID is required to perform update.',
            });
        }
    
        try {
            // Find the student by id
            const student = await Student.findOne({ id });
    
            if (!student) {
                return res.status(404).json({
                    status: 'failure',
                    message: 'Student not found.',
                });
            }
    
            // If schoolId or classroomId is provided, validate if they exist
            if (schoolId) {
                const school = await School.findOne({ id: schoolId });
                if (!school) {
                    return res.status(404).json({
                        status: 'failure',
                        message: 'The specified schoolId does not exist.',
                    });
                }
            }
    
            if (classroomId) {
                const classroom = await Classroom.findOne({ id: classroomId });
                if (!classroom) {
                    return res.status(404).json({
                        status: 'failure',
                        message: 'The specified classroomId does not exist.',
                    });
                }
            }

            if (!classroomId){
                return res.status(400).json({
                    status: 'failure',
                    message: 'Classroom ID is required',
                });
            }
    
            // If the classroom has changed, create a new transfer record
            let transferHistory = null;
            if (student.classroomId !== classroomId) {
                transferHistory = {
                    fromClassroomId: student.classroomId,
                    toClassroomId: classroomId,
                    transferDate: new Date().toISOString(), // Set transfer date to the current date
                };
            }
    
            // Update fields if provided
            if (firstName) student.firstName = firstName;
            if (lastName) student.lastName = lastName;
            if (dob) student.dob = dob;
            if (schoolId) student.schoolId = schoolId;
            if (classroomId) student.classroomId = classroomId;
            if (enrollmentDate) student.enrollmentDate = enrollmentDate;
            if (transferHistory) {
                // Only update transfer history if there is a transfer
                student.transferHistory.push(transferHistory);
            }
            if (profile) student.profile = profile;
    
            // Save the updated student
            await student.save();
    
            return res.status(200).json({
                status: 'success',
                message: 'Student updated successfully.',
                data: student,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: 'failure',
                message: 'Error updating student.',
                data: error.message,
            });
        }
    }
    

    async deleteByID(req, res) {
        const { id } = req.query;

        try {
            const student = await Student.findOne({ id });

            if (!student) {
                return res.status(404).json({
                    status: 'failure',
                    message: 'Student not found.',
                });
            }

            await Student.deleteOne({ id });

            return res.status(200).json({
                status: 'success',
                message: 'Student deleted successfully.',
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: 'failure',
                message: 'Error deleting student.',
                data: error.message,
            });
        }
    }

    router() {
        return router;
    }
}

module.exports = StudentManager;
