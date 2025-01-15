const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const Classroom = require('../models/classroom.model');
const School = require('../models/school.model');
const tokenManager = require('../token/Token.manager');
const config = require('../../config/index.config');
const { authorize } = require('../../middleware/authorization'); // Import the middleware
const rateLimit = require('express-rate-limit'); // Import express-rate-limit


class ClassroomManager {
    constructor() {
        this.config = config;

        const classRoomRateLimit = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // Limit each IP to 5 requests per window
            message: 'Too many attempts, please try again after 15 minutes.',
        });
        
        router.post('/', classRoomRateLimit, authorize(['admin', 'superadmin']), this.createClassroom.bind(this));
        router.get('/', classRoomRateLimit, authorize(['admin', 'superadmin']), this.getClassroom.bind(this)); // Endpoint for fetching classrooms
        router.put('/', classRoomRateLimit,  authorize(['admin', 'superadmin']), this.updateClassroom.bind(this));
        router.delete('/', classRoomRateLimit, authorize(['admin', 'superadmin']),this.deleteByID.bind(this))
    }

    async createClassroom(req, res) {
        const { name, schoolId, capacity, resources, managedBy } = req.body;

        // Validate required fields
        if (!name || !schoolId || !capacity || !managedBy) {
            return res.status(400).json({
                status: 'failure',
                message: 'Name, schoolId, capacity, and managedBy are required fields.',
            });
        }

        try {
            // Check if the referenced school exists
            const schoolExists = await School.findOne({ id: schoolId });
            const classroomExists = await Classroom.findOne({ name, schoolId });
            
            if (!schoolExists) {
                return res.status(404).json({
                    status: 'failure',
                    message: 'The specified schoolId does not exist.',
                });
            }
            if (classroomExists) {
                return res.status(400).json({
                    status: 'failure',
                    message: 'The specified classroom in this school already exists.',
                });
            }

            // Create a new classroom
            const newClassroom = new Classroom({
                name,
                schoolId,
                capacity,
                resources: resources || [], // Default to an empty array if not provided
                managedBy,
            });

            // Save the classroom to the database
            await newClassroom.save();

            return res.status(201).json({
                status: 'success',
                message: 'Classroom created successfully.',
                data: newClassroom,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: 'failure',
                message: 'Error creating classroom.',
                data: error.message,
            });
        }
    }

    async getClassroom(req, res) {
        const { id, schoolId, page = 1, limit = 10 } = req.query;  // Extract `id`, `schoolId`, `page`, and `limit` from query parameters

        // Set default values for pagination if not provided
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        // Build query based on provided parameters
        let query = {};

        if (id) {
            query.id = id; // If `id` is provided, include it in the query
        }

        if (schoolId) {
            query.schoolId = schoolId;  // If `schoolId` is provided, include it in the query
        }

        try {
            // Fetch classrooms with pagination
            const classrooms = await Classroom.find(query)
                .skip((pageNumber - 1) * limitNumber) // Skip documents based on page number
                .limit(limitNumber); // Limit the number of records per page

            // Count total classrooms for pagination info
            const totalCount = await Classroom.countDocuments(query);

            if (!classrooms || classrooms.length === 0) {
                return res.status(404).json({
                    status: 'failure',
                    message: 'Classroom(s) not found.',
                });
            }

            return res.status(200).json({
                status: 'success',
                message: 'Classroom(s) found.',
                data: classrooms,
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
                message: 'Error retrieving classroom(s).',
                data: error.message,
            });
        }
    }

    async updateClassroom(req, res) {
        const { id } = req.query; // Get the classroom id from the URL parameter
        const { name, schoolId, capacity, resources, managedBy } = req.body; // Get the fields to be updated from the request body
    
        // Validate if id exists in the request body, this is crucial for updating
        console.log(id)
        if (!id) {
            return res.status(400).json({
                status: 'failure',
                message: 'Classroom ID is required to perform update.',
            });
        }
    
        try {
            // Find the classroom by id
            const classroom = await Classroom.findOne({ id });
    
            if (!classroom) {
                return res.status(404).json({
                    status: 'failure',
                    message: 'Classroom not found.',
                });
            }
    
            // If schoolId is provided, validate if the school exists
            if (schoolId) {
                const school = await School.findOne({ id: schoolId });
    
                if (!school) {
                    return res.status(404).json({
                        status: 'failure',
                        message: 'The specified schoolId does not exist.',
                    });
                }
            }
    
            // Update fields if provided
            if (name) classroom.name = name;
            if (schoolId) classroom.schoolId = schoolId;
            if (capacity) classroom.capacity = capacity;
            if (resources) classroom.resources = resources; // Assuming resources can be an array
            if (managedBy) classroom.managedBy = managedBy;
    
            // Save the updated classroom
            await classroom.save();
    
            return res.status(200).json({
                status: 'success',
                message: 'Classroom updated successfully.',
                data: classroom,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: 'failure',
                message: 'Error updating classroom.',
                data: error.message,
            });
        }
    }    

    async deleteByID(req, res) {
        const { id } = req.query; // Get the classroom ID from the URL parameter
        
        try {
            // Check if the classroom exists
            const classroom = await Classroom.findOne({ id });
    
            if (!classroom) {
                return res.status(404).json({
                    status: 'failure',
                    message: 'Classroom not found.',
                });
            }
    
            // Delete the classroom
            await Classroom.deleteOne({ id });
    
            return res.status(200).json({
                status: 'success',
                message: 'Classroom deleted successfully.',
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: 'failure',
                message: 'Error deleting classroom.',
                data: error.message,
            });
        }
    }
    

    router() {
        return router;
    }
}

module.exports = ClassroomManager;
