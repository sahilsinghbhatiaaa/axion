const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/user.model');
const tokenManager = require('../token/Token.manager');
const config = require('../../config/index.config');

class UserManager {
    constructor() {
        this.config = config;
        router.post('/login', this.loginUser.bind(this));
        router.post('/', this.createUser.bind(this));
        router.get('/', this.testView.bind(this))
    }

    async testView(req,res) {
    }

    async loginUser(req, res) {
        const { username, email, password } = req.body;

        if ((!username && !email) || !password) {
            return res.status(400).json({
                status: 'failure',
                message: 'Username or email and password are required.',
            });
        }

        try {
            // Search for the user by username or email in the database
            const user = await User.findOne({
                $or: [{ username: username || null }, { email: email || null }]
            });

            if (!user) {
                return res.status(404).json({
                    status: 'failure',
                    message: 'User not found.',
                });
            }

            // Check the hashed password
            const isPasswordValid = await user.isValidPassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    status: 'failure',
                    message: 'Invalid password.',
                });
            }

            // Generate a token upon successful login
            const token = new tokenManager({ config: this.config });
            const longToken = token.genLongToken({ userId: user.id, userKey: user.username, userRole: user.role });
            const shortToken = token.v1_createShortToken({ __longToken: longToken, __device: navigator.userAgent });

            return res.status(200).json({
                status: 'success',
                message: 'Login successful.',
                data: {
                    username: user.username,
                    longToken,
                    shortToken: shortToken.shortToken,
                },
            });
        } catch (error) {
            return res.status(500).json({
                status: 'failure',
                message: 'Error during login.',
                data: error.message,
            });
        }
    }

    async createUser(req, res) {
        const { username, email, password, firstName, lastName } = req.body;

        if (!username || !email || !password || !firstName) {
            return res.status(400).json({
                status: 'failure',
                message: 'Username, email, firstName, and password are required.',
            });
        }

        try {
            // No need to hash the password here as it is hashed in the model middleware
            const newUser = new User({ username, email, password, firstName, lastName });
            await newUser.save();

            return res.status(201).json({
                status: 'success',
                message: 'User created successfully.',
                data: newUser,
            });
        } catch (error) {
            return res.status(400).json({
                status: 'failure',
                message: 'Error creating user.',
                data: error.message,
            });
        }
    }

    router() {
        return router;
    }
}

module.exports = UserManager;
