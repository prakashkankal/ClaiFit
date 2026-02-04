import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Tailor from '../models/Tailor.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

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
            if (!tailor.isVerified) {
                return res.status(401).json({ message: 'Please verify your email address to log in.' });
            }

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
            if (!user.isVerified) {
                return res.status(401).json({ message: 'Please verify your email address to log in.' });
            }

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

// @route   POST /api/auth/forgot-password
// @desc    Forgot Password - Send Reset Email
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        let user = await Tailor.findOne({ email });
        let userType = 'tailor';

        if (!user) {
            user = await User.findOne({ email });
            userType = 'customer';
        }

        if (!user) {
            return res.status(404).json({ message: 'No account with that email found' });
        }

        // Generate Reset Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordExpire = resetPasswordExpire;
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const message = `
            <h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password:</p>
            <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
            <p>This link will expire in 10 minutes.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request',
                message,
                html: message
            });

            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: 'Email could not be sent' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/auth/reset-password/:resetToken
// @desc    Reset Password
router.put('/reset-password/:resetToken', async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

        let user = await Tailor.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            user = await User.findOne({
                resetPasswordToken,
                resetPasswordExpire: { $gt: Date.now() }
            });
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, data: 'Password reset success' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/auth/verify-email/:verificationToken
// @desc    Verify Email Address
router.put('/verify-email/:verificationToken', async (req, res) => {
    try {
        const { verificationToken } = req.params;

        let user = await Tailor.findOne({
            verificationToken,
            verificationTokenExpire: { $gt: Date.now() }
        });

        let userType = 'tailor';

        if (!user) {
            user = await User.findOne({
                verificationToken,
                verificationTokenExpire: { $gt: Date.now() }
            });
            userType = 'customer';
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;

        await user.save();

        // Return user data with token for auto-login
        if (userType === 'tailor') {
            res.status(200).json({
                success: true,
                message: 'Email verified. Logging you in...',
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                shopName: user.shopName,
                shopImage: user.shopImage,
                specialization: user.specialization,
                experience: user.experience,
                address: user.address,
                businessHours: user.businessHours,
                role: 'tailor',
                token: generateToken(user._id)
            });
        } else {
            res.status(200).json({
                success: true,
                message: 'Email verified. Logging you in...',
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

    } catch (error) {
        console.error("Email Verification Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for Email
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        let user = await Tailor.findOne({
            email,
            verificationToken: otp,
            verificationTokenExpire: { $gt: Date.now() }
        });

        let userType = 'tailor';

        if (!user) {
            user = await User.findOne({
                email,
                verificationToken: otp,
                verificationTokenExpire: { $gt: Date.now() }
            });
            userType = 'customer';
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;

        await user.save();

        const token = generateToken(user._id);

        if (userType === 'tailor') {
            res.json({
                success: true,
                message: 'Email verified. Logging you in...',
                _id: user._id,
                name: user.name,
                email: user.email,
                role: 'tailor',
                token
            });
        } else {
            res.json({
                success: true,
                message: 'Email verified. Logging you in...',
                _id: user._id,
                name: user.name,
                email: user.email,
                role: 'customer',
                token
            });
        }

    } catch (error) {
        console.error("OTP Verification Error: ", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
