import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        console.log('User registration attempt:', { name, email, phone, passwordLength: password?.length });

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        console.log('Creating user...');

        // Create user (password will be hashed by the pre-save hook)
        // Create user (password will be hashed by the pre-save hook)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Create user (password will be hashed by the pre-save hook)
        const user = await User.create({
            name,
            email,
            password,
            phone,
            isVerified: false,
            verificationToken: otp,
            verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        console.log('User created successfully:', user.email);

        if (user) {
            // Send Verification Email
            const message = `
                <h1>Email Verification</h1>
                <p>Your verification code is:</p>
                <h2 style="color: #6b4423; letter-spacing: 5px;">${otp}</h2>
                <p>Please enter this code to verify your email address.</p>
                <p>This code will expire in 24 hours.</p>
            `;

            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Email Verification',
                    message,
                    html: message
                });

                res.status(201).json({
                    success: true,
                    message: "Registration successful! Please check your email to verify your account."
                });

            } catch (error) {
                console.error('Email send error:', error);
                res.status(201).json({
                    success: true,
                    message: "Registration successful, but we could not send the verification email. Please contact support."
                });
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Server error during registration',
            error: error.message
        });
    }
});

// @route   POST /api/users/google
// @desc    Google Auth (Login/Register)
// @access  Public
router.post('/google', async (req, res) => {
    const { token } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const { name, email, picture, sub: googleId } = ticket.getPayload();

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            // If user exists but doesn't have googleId, link it
            if (!user.googleId) {
                user.googleId = googleId;
                // Optional: Update avatar if missing
                if (!user.profilePhoto) user.profilePhoto = picture;
                await user.save();
            }
        } else {
            // Create new user
            user = await User.create({
                name,
                email,
                googleId,
                profilePhoto: picture,
                // password is not required per schema change
            });
        }

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            profilePhoto: user.profilePhoto,
            bio: user.bio,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            city: user.city,
            country: user.country,
            alternatePhone: user.alternatePhone,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ message: 'Google authentication failed', error: error.message });
    }
});

// @route   POST /api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profilePhoto: user.profilePhoto,
                bio: user.bio,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                city: user.city,
                country: user.country,
                alternatePhone: user.alternatePhone,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Authentication Middleware
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;
            user.profilePhoto = req.body.profilePhoto !== undefined ? req.body.profilePhoto : user.profilePhoto;
            user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
            user.dateOfBirth = req.body.dateOfBirth !== undefined ? req.body.dateOfBirth : user.dateOfBirth;
            user.gender = req.body.gender !== undefined ? req.body.gender : user.gender;
            user.city = req.body.city !== undefined ? req.body.city : user.city;
            user.country = req.body.country !== undefined ? req.body.country : user.country;
            user.alternatePhone = req.body.alternatePhone !== undefined ? req.body.alternatePhone : user.alternatePhone;

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                profilePhoto: updatedUser.profilePhoto,
                bio: updatedUser.bio,
                dateOfBirth: updatedUser.dateOfBirth,
                gender: updatedUser.gender,
                city: updatedUser.city,
                country: updatedUser.country,
                alternatePhone: updatedUser.alternatePhone,
                token: generateToken(updatedUser._id)
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error during profile update' });
    }
});

export default router;
