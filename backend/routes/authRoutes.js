import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Tailor from '../models/Tailor.js';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @route   POST /api/auth/login
// @desc    Unified Login for Users and Tailors
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Check Tailor
        const tailor = await Tailor.findOne({ email });
        if (tailor && (await tailor.matchPassword(password))) {
            return res.json({
                _id: tailor._id,
                name: tailor.name,
                email: tailor.email,
                phone: tailor.phone,
                shopName: tailor.shopName,
                shopImage: tailor.shopImage,
                specialization: tailor.specialization,
                experience: tailor.experience,
                address: tailor.address,
                businessHours: tailor.businessHours,
                role: 'tailor',
                token: generateToken(tailor._id)
            });
        }

        // Check User
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            return res.json({
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
                role: 'customer',
                token: generateToken(user._id)
            });
        }

        res.status(401).json({ message: 'Invalid email or password' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   POST /api/auth/google
// @desc    Unified Google Auth (Login & Register)
router.post('/google', async (req, res) => {
    const { token, role } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const { name, email, picture, sub: googleId } = ticket.getPayload();

        // 1. Check Tailor Collection
        const tailor = await Tailor.findOne({ email });
        if (tailor) {
            // Link googleId if not present
            if (!tailor.googleId) {
                tailor.googleId = googleId;
                await tailor.save();
            }
            return res.json({
                _id: tailor._id,
                name: tailor.name,
                email: tailor.email,
                role: 'tailor',
                // Add other fields as needed
                token: generateToken(tailor._id)
            });
        }

        // 2. Check User Collection
        let user = await User.findOne({ email });
        if (user) {
            // Link googleId if not present
            if (!user.googleId) {
                user.googleId = googleId;
                if (!user.profilePhoto) user.profilePhoto = picture;
                await user.save();
            }
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: 'customer',
                token: generateToken(user._id)
            });
        }

        // 3. New User Handling
        if (role === 'tailor') {
            // For Tailors, we necessitate a full registration.
            // Return a 202 Accepted status with data to pre-fill the form.
            return res.status(202).json({
                requiresRegistration: true,
                role: 'tailor',
                email,
                name,
                googleId,
                picture
            });
        } else {
            // Default: Create Customer Account
            // Ensure no conflict with "role choice" rule - if role not specified, we might default to customer?
            // User requested "User must choose role first".
            // If role is missing, we shouldn't create. But standard Google Login (Login page) doesn't pass role.
            // If they are logging in on Login page and don't exist -> they need to Register.
            if (!role) {
                return res.status(404).json({ message: 'User not found. Please register.' });
            }

            // Create Customer
            user = await User.create({
                name,
                email,
                googleId,
                profilePhoto: picture,
                role: 'customer'
            });

            return res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: 'customer',
                token: generateToken(user._id)
            });
        }

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ message: 'Google authentication failed', error: error.message });
    }
});

export default router;
