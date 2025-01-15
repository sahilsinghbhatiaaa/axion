const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/user.model');
const tokenManager = require('../token/Token.manager');
const config = require('../../config/index.config');
const jwt = require('jsonwebtoken'); // Import jwt for token verification
const rateLimit = require('express-rate-limit'); // Import express-rate-limit


class UserManager {
    constructor() {
        this.config = config;

        // Apply rate limiting to login and refreshToken routes
        const loginRateLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // Limit each IP to 5 requests per window
            message: 'Too many login attempts, please try again after 15 minutes.',
        });

        const refreshTokenRateLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // Limit each IP to 5 requests per window
            message: 'Too many refresh token requests, please try again after 15 minutes.',
        });

        router.post('/login',loginRateLimiter, this.loginUser.bind(this));
        router.post('/refreshtoken',refreshTokenRateLimiter, this.refreshToken.bind(this));
        router.post('/', this.createUser.bind(this));
    }

    async refreshToken(req,res) {
        const { longToken } = req.body;

        if (!longToken) {
            return res.status(403).json({ error: 'Refresh token is required' });
        }

        try {
            // 1. Verify the refresh token using the refresh token secret
            const decoded = jwt.verify(longToken, config.dotEnv.LONG_TOKEN_SECRET);
            
            const token = new tokenManager({ config: this.config });
            // 2. Generate a new short-lived access token (e.g., 15 minutes)
            const newAccessToken=  token.v1_createShortToken({ __longToken: longToken, __device: navigator.userAgent });

            // 3. Return the new access token to the client
            return res.status(200).json({
                shortToken: newAccessToken.shortToken,
            });
        } catch (error) {
            return res.status(403).json({ error: 'Invalid or expired refresh token', details: error.message });
        }
        
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
                    role: user.role,
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
