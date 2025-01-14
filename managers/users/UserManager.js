const express = require('express');
const router = express.Router();
// const schema = require('../_common/schema.models'); // Assuming this is the schema file
// const validateInput = require('../../libs/validateInput'); // Import the reusable validator

class UserManager {
    constructor() {
        // Define your routes here
        router.get('/', this.getAllUsers.bind(this));
        router.post('/', this.createUser.bind(this));
    }

    getAllUsers(req, res) {
        res.status(200).json({ message: 'Fetching all users' });
    }

    createUser(req, res) {
        const userData = req.body;

        const requiredKeys = ['username', 'email', 'password'];
        // Get the keys of the userData object
        const existingKeys = Object.keys(userData);

        const missingKeys = [];

        // Check if all required keys are present in the request body
        for (const key of requiredKeys) {
            if (!existingKeys.includes(key)) {
                missingKeys.push(key);
            }
        }

        if (missingKeys.length > 0) {
            return res.status(400).json({ errors: `${missingKeys.join(', ')} are missing` });
        }
        // TODO: Validate use Input

        // Create user logic here
        res.status(201).json({ message: 'User created successfully', data: userData });
    }

    router() {
        return router;
    }
}

module.exports = UserManager;
