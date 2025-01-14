const express = require('express');
const router = express.Router();

class SchoolManager {
    constructor() {
        // Define your routes here
        router.get('/', this.getAllSchools.bind(this));
        router.post('/', this.createSchool.bind(this));
    }

    getAllSchools(req, res) {
        res.status(200).json({ message: 'Fetching all schools' });
    }

    createSchool(req, res) {
        res.status(201).json({ message: 'School created successfully' });
    }

    router() {
        return router;
    }
}

module.exports = SchoolManager;
