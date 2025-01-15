const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const School = require('../models/school.model');
const tokenManager = require('../token/Token.manager');
const config = require('../../config/index.config');
const { authorize } = require('../../middleware/authorization'); // Import the middleware
const rateLimit = require('express-rate-limit'); // Import express-rate-limit


class SchoolManager {
    constructor() {
        this.config = config;

        const schoolRateLimit = rateLimit({
                    windowMs: 15 * 60 * 1000, // 15 minutes
                    max: 5, // Limit each IP to 5 requests per window
                    message: 'Too many attempts, please try again after 15 minutes.',
                });
        
        router.post('/',schoolRateLimit,authorize(['superadmin']), this.createSchool.bind(this));
        router.get('/',schoolRateLimit, authorize(['superadmin']),this.getAllSchool.bind(this));
        router.put('/',schoolRateLimit,authorize([ 'superadmin']), this.updateSchool.bind(this))
        router.delete('/',schoolRateLimit,authorize([ 'superadmin']), this.deleteSchool.bind(this))
    }

    async createSchool(req, res) {
        const { name, address, phone, email, establishedYear, website } = req.body;
    
        // Validate required fields
        if (!name || !address || !phone || !email || !establishedYear) {
            return res.status(400).json({
                status: 'failure',
                message: 'Name, address, phone, email, and establishedYear are required.',
            });
        }
    
        try {
            // Check if a school with the same name or email already exists
            const existingSchool = await School.findOne({
                $or: [{ name: name }, { 'contact.email': email }],
            });
    
            if (existingSchool) {
                return res.status(409).json({
                    status: 'failure',
                    message: 'A school with the same name or email already exists.',
                });
            }
    
            // Create a new school
            const newSchool = new School({
                name,
                address,
                contact: {
                    phone,
                    email,
                },
                profile: {
                    establishedYear,
                    website,
                },
            });
    
            // Save the school to the database
            await newSchool.save();
    
            return res.status(201).json({
                status: 'success',
                message: 'School created successfully.',
                data: newSchool,
            });
        } catch (error) {
            return res.status(500).json({
                status: 'failure',
                message: 'Error creating school.',
                data: error.message,
            });
        }
    }

    async getAllSchool(req, res) {
        const { page = 1, limit = 10, id } = req.query; // Pagination and optional ID search
    
        try {
            // Handle fetching by specific ID
            if (id) {
                const projection = {
                    id: 1,
                    name: 1,
                    address: 1,
                    'contact.phone': 1,
                    'contact.email': 1,
                    'profile.establishedYear': 1,
                    'profile.website': 1,
                    _id: 0, // Exclude MongoDB's default _id field
                };
    
                const school = await School.findOne({ id }).select(projection);
    
                if (!school) {
                    return res.status(404).json({
                        status: 'failure',
                        message: `No school found with id: ${id}`,
                    });
                }
    
                return res.status(200).json({
                    status: 'success',
                    message: 'School retrieved successfully.',
                    data: school,
                });
            }
    
            // If no specific ID is provided, fetch paginated list of schools
            const query = {}; // No filters for now, fetch all schools
    
            const totalSchools = await School.countDocuments(query);
    
            const projection = {
                id: 1,
                name: 1,
                address: 1,
                'contact.phone': 1,
                'contact.email': 1,
                'profile.establishedYear': 1,
                'profile.website': 1,
                _id: 0,
            };
    
            const schools = await School.find(query)
                .select(projection)
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ createdAt: -1 });
    
            return res.status(200).json({
                status: 'success',
                message: 'Schools retrieved successfully.',
                data: {
                    schools,
                    totalSchools,
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalSchools / limit),
                },
            });
        } catch (error) {
            return res.status(500).json({
                status: 'failure',
                message: 'Error retrieving schools.',
                data: error.message,
            });
        }
    }

    async updateSchool(req, res) {
        const { id } = req.query; // Retrieve the school ID from query parameters
        const updates = req.body; // Incoming fields to update
    
        if (!id) {
            return res.status(400).json({
                status: 'failure',
                message: 'School ID is required to update a record.',
            });
        }
    
        try {
            // Validate the incoming fields against the schema keys
            const allowedFields = [
                'name',
                'address',
                'contact.phone',
                'contact.email',
                'profile.establishedYear',
                'profile.website',
                'profile.additionalInfo',
            ];
    
            const filteredUpdates = {};
            for (const key in updates) {
                if (allowedFields.includes(key)) {
                    filteredUpdates[key] = updates[key];
                }
            }
    
            // Ensure there are valid fields to update
            if (Object.keys(filteredUpdates).length === 0) {
                return res.status(400).json({
                    status: 'failure',
                    message: 'No valid fields provided for update.',
                });
            }
    
            // Update the `updatedAt` field manually
            filteredUpdates.updatedAt = Date.now();
    
            // Update the school record in the database
            const updatedSchool = await School.findOneAndUpdate(
                { id }, // Match the school by its unique ID
                { $set: filteredUpdates }, // Apply the updates
                { new: true, runValidators: true } // Return the updated document and validate updates
            );
    
            if (!updatedSchool) {
                return res.status(404).json({
                    status: 'failure',
                    message: 'School not found with the given ID.',
                });
            }
    
            return res.status(200).json({
                status: 'success',
                message: 'School updated successfully.',
                data: updatedSchool,
            });
        } catch (error) {
            return res.status(500).json({
                status: 'failure',
                message: 'Error updating school.',
                data: error.message,
            });
        }
    }

    async deleteSchool(req, res) {
        const { id } = req.query; // Retrieve the school ID from query parameters
    
        if (!id) {
            return res.status(400).json({
                status: 'failure',
                message: 'School ID is required to delete a record.',
            });
        }
    
        try {
            // Find and delete the school by its unique ID
            const deletedSchool = await School.findOneAndDelete({ id });
    
            if (!deletedSchool) {
                return res.status(404).json({
                    status: 'failure',
                    message: 'School not found with the given ID.',
                });
            }
    
            return res.status(200).json({
                status: 'success',
                message: 'School deleted successfully.',
                data: deletedSchool, // Optionally return the deleted school details
            });
        } catch (error) {
            return res.status(500).json({
                status: 'failure',
                message: 'Error deleting school.',
                data: error.message,
            });
        }
    }    

    router() {
        return router;
    }
}

module.exports = SchoolManager;
