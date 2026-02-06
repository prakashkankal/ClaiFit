import express from 'express';
import jwt from 'jsonwebtoken';
import Tailor from '../models/Tailor.js';
import User from '../models/User.js';
import Review from '../models/Review.js';

import Post from '../models/Post.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import { compressBase64 } from '../utils/imageCompressor.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};



// @desc    Register a new tailor
// @route   POST /api/tailors/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, shopName, specialization, experience, address, googleId } = req.body;

        // Validation
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const tailorExists = await Tailor.findOne({ email });

        if (tailorExists) {
            return res.status(400).json({ message: 'Tailor already exists' });
        }

        // Check if user exists in the users collection
        const userExists = await User.findOne({ email });

        // If user exists, delete them from users collection (upgrading to tailor)
        if (userExists) {
            console.log(`User upgrading to tailor - email: ${email}`);
            await User.deleteOne({ email });
            console.log(`User with email ${email} has been upgraded to tailor and removed from users collection`);
        }

        console.log('Creating tailor - password length:', password?.length);

        const tailor = await Tailor.create({
            name,
            email,
            password,
            phone,
            shopName,
            specialization,
            experience,
            address,
            googleId: googleId || undefined, // Ensure it is not empty string, which violates unique index
            isVerified: false,
            verificationToken: Math.floor(100000 + Math.random() * 900000).toString(),
            verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        console.log('Tailor created successfully:', tailor.email);
        console.log('Password hash length:', tailor.password?.length);
        console.log('Password starts with $2b$:', tailor.password?.startsWith('$2b$'));

        if (tailor) {
            // Create default measurement presets for the new tailor
            try {
                const MeasurementPreset = (await import('../models/MeasurementPreset.js')).default;
                const defaultPresets = MeasurementPreset.getDefaultPresets();
                const presetsToCreate = defaultPresets.map(preset => ({
                    ...preset,
                    tailorId: tailor._id
                }));
                await MeasurementPreset.insertMany(presetsToCreate);
                console.log('Default measurement presets created for tailor:', tailor._id);
            } catch (presetError) {
                console.error('Error creating default presets:', presetError);
                // Don't fail registration if preset creation fails
            }

            // Send Verification Email
            const message = `
                <h1>Email Verification</h1>
                <p>Your verification code is:</p>
                <h2 style="color: #6b4423; letter-spacing: 5px;">${tailor.verificationToken}</h2>
                <p>Please enter this code to verify your email address.</p>
                <p>This code will expire in 24 hours.</p>
            `;

            try {
                await sendEmail({
                    email: tailor.email,
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
        } else {
            res.status(400).json({ message: 'Invalid tailor data' });
        }
    } catch (error) {
        console.error('Tailor registration error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Server error during registration',
            error: error.message
        });
    }
});

// @desc    Authenticate tailor & get token
// @route   POST /api/tailors/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Tailor login attempt:', { email, passwordLength: password?.length });

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find tailor by email
        const tailor = await Tailor.findOne({ email });
        console.log('Tailor found:', tailor ? 'Yes' : 'No');

        if (!tailor) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log('Stored password hash length:', tailor.password?.length);
        console.log('Stored password starts with $2b$:', tailor.password?.startsWith('$2b$'));
        console.log('Plain password for comparison:', password);

        // Check password
        const isPasswordMatch = await tailor.matchPassword(password);
        console.log('Password match:', isPasswordMatch ? 'Yes' : 'No');

        if (isPasswordMatch) {
            res.json({
                _id: tailor._id,
                name: tailor.name,
                email: tailor.email,
                phone: tailor.phone,
                shopName: tailor.shopName,
                shopImage: tailor.shopImage,
                specialization: tailor.specialization,
                experience: tailor.experience,
                address: tailor.address,
                location: tailor.location,
                businessHours: tailor.businessHours,
                userType: 'tailor',
                token: generateToken(tailor._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Tailor login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @desc    Upload shop image
// @route   PUT /api/tailors/upload-image
// @access  Private
router.put('/upload-image', async (req, res) => {
    try {
        const { email, shopImage } = req.body;

        if (!email || !shopImage) {
            return res.status(400).json({ message: 'Email and image are required' });
        }

        // Compress image
        const compressedImage = await compressBase64(shopImage, 600); // 600px width for profile is sufficient

        // Find tailor and update shop image
        const tailor = await Tailor.findOneAndUpdate(
            { email },
            { shopImage: compressedImage },
            { new: true }
        ).select('-password');

        if (!tailor) {
            return res.status(404).json({ message: 'Tailor not found' });
        }

        res.json({
            _id: tailor._id,
            name: tailor.name,
            email: tailor.email,
            shopName: tailor.shopName,
            shopImage: tailor.shopImage,
            userType: 'tailor',
            message: 'Shop image updated successfully'
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ message: 'Server error during image upload' });
    }
});

// @desc    Upload banner image
// @route   PUT /api/tailors/upload-banner-image
// @access  Private
router.put('/upload-banner-image', async (req, res) => {
    try {
        const { email, bannerImage } = req.body;

        if (!email || !bannerImage) {
            return res.status(400).json({ message: 'Email and banner image are required' });
        }

        // Compress banner image
        const compressedBanner = await compressBase64(bannerImage, 1200); // 1200px width for banner

        // Find tailor and update banner image
        const tailor = await Tailor.findOneAndUpdate(
            { email },
            { bannerImage: compressedBanner },
            { new: true }
        ).select('-password');

        if (!tailor) {
            return res.status(404).json({ message: 'Tailor not found' });
        }

        res.json({
            _id: tailor._id,
            name: tailor.name,
            email: tailor.email,
            shopName: tailor.shopName,
            shopImage: tailor.shopImage,
            bannerImage: tailor.bannerImage,
            userType: 'tailor',
            message: 'Banner image updated successfully'
        });
    } catch (error) {
        console.error('Banner image upload error:', error);
        res.status(500).json({ message: 'Server error during banner image upload' });
    }
});

// @desc    Update tailor profile
// @route   PUT /api/tailors/update-profile
// @access  Private
router.put('/update-profile', async (req, res) => {
    try {
        const { email, name, shopName, phone, specialization, address, businessHours, location, bio } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Build update object
        const updateData = {};
        if (name) updateData.name = name;
        if (shopName) updateData.shopName = shopName;
        if (phone) updateData.phone = phone;
        if (specialization) updateData.specialization = specialization;
        if (address) updateData.address = address;
        if (businessHours) updateData.businessHours = businessHours;
        if (location) updateData.location = location;

        // Handle bio explicitly (allow empty string)
        if (bio !== undefined) {
            updateData.bio = bio;
        }

        // Find tailor and update profile
        const tailor = await Tailor.findOneAndUpdate(
            { email },
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!tailor) {
            return res.status(404).json({ message: 'Tailor not found' });
        }

        res.json({
            _id: tailor._id,
            name: tailor.name,
            email: tailor.email,
            phone: tailor.phone,
            shopName: tailor.shopName,
            shopImage: tailor.shopImage,
            specialization: tailor.specialization,
            experience: tailor.experience,
            bio: tailor.bio,
            address: tailor.address,
            location: tailor.location,
            businessHours: tailor.businessHours,
            userType: 'tailor',
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error during profile update' });
    }
});

// @desc    Get all tailors
// @route   GET /api/tailors
// @access  Public
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 12;
        const skip = parseInt(req.query.skip) || 0;

        // Search & Filter Parameters
        const { service, locationText, lat, lng, radius } = req.query;

        const query = {};

        // 1. Service Filter
        if (service) {
            // Mapping frontend service values to backend specialization/services
            // Values: 'men-tailoring', 'women-tailoring', 'alterations', 'custom-stitching', 'repairs'
            if (service === 'men-tailoring') {
                query.specialization = { $in: ['men', 'all'] };
            } else if (service === 'women-tailoring') {
                query.specialization = { $in: ['women', 'all'] };
            } else if (service === 'alterations') {
                // If services field is populated, search in it. Use regex for flexibility.
                query.$or = [
                    { services: { $regex: 'alteration', $options: 'i' } },
                    { services: { $regex: 'repair', $options: 'i' } },
                    { specialization: 'all' } // Fallback for general tailors
                ];
            } else if (service === 'custom-stitching') {
                query.$or = [
                    { services: { $regex: 'custom', $options: 'i' } },
                    { services: { $regex: 'stitch', $options: 'i' } },
                    { specialization: { $exists: true } } // Almost all tailors do this
                ];
            } else if (service === 'repairs') {
                query.$or = [
                    { services: { $regex: 'repair', $options: 'i' } },
                    { services: { $regex: 'alteration', $options: 'i' } }
                ];
            }
        }

        // 2. Location Filter (Text or Geo)
        if (lat && lng) {
            // Geospatial Query
            // Note: This requires a 2dsphere index on 'location'. 
            // If index is missing, this might error. For safety/prototyping without migration scripts, 
            // we can fallback to simple bounds check or accept that it might fail if not indexed.
            // Let's use a basic box approximation if we can't trust the index, or just standard $near if we assume it exists.

            // Assuming we might NOT have the index, let's filter after fetch if dataset is small, 
            // OR use basic range matching on lat/lng fields directly.

            const radiusInKm = parseFloat(radius) || 10;
            const latNum = parseFloat(lat);
            const lngNum = parseFloat(lng);

            // Approx 1 degree lat = 111km
            const latDelta = radiusInKm / 111;
            const lngDelta = radiusInKm / (111 * Math.cos(latNum * (Math.PI / 180)));

            query['location.latitude'] = { $gte: latNum - latDelta, $lte: latNum + latDelta };
            query['location.longitude'] = { $gte: lngNum - lngDelta, $lte: lngNum + lngDelta };

        } else if (locationText && locationText.trim() !== '' && locationText !== 'Nearby') {
            // Text Search on City/State/Address
            const regex = new RegExp(locationText, 'i');
            query.$or = [
                { 'address.city': regex },
                { 'address.state': regex },
                { 'address.street': regex },
                { 'location.address': regex },
                { city: regex }, // Legacy fields check
                { state: regex }
            ];
        }

        // 3. Active Check (if applicable)
        // query.isActive = true; // Uncomment if field exists

        const total = await Tailor.countDocuments(query);
        const tailors = await Tailor.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        res.json({
            tailors,
            total,
            limit,
            skip,
            hasMore: skip + tailors.length < total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// @desc    Get single tailor by ID
// @route   GET /api/tailors/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const tailor = await Tailor.findById(req.params.id).select('-password');

        if (!tailor) {
            return res.status(404).json({ message: 'Tailor not found' });
        }

        // Fetch reviews
        const reviews = await Review.find({ tailorId: tailor._id }).sort({ createdAt: -1 });

        // Fetch portfolio (posts)
        const posts = await Post.find({ tailor: tailor._id }).sort({ createdAt: -1 });

        // Convert to object and add reviews data
        const tailorData = tailor.toObject();
        tailorData.reviews = reviews;
        tailorData.totalReviews = reviews.length;
        tailorData.portfolio = posts; // Add posts as portfolio

        res.json(tailorData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a new review
// @route   POST /api/tailors/:id/reviews
// @access  Private (Public for now logic, but frontend should check auth)
router.post('/:id/reviews', async (req, res) => {
    try {
        const { customerId, customerName, rating, comment } = req.body;
        const tailorId = req.params.id;

        const tailor = await Tailor.findById(tailorId);
        if (!tailor) {
            return res.status(404).json({ message: 'Tailor not found' });
        }

        const reviewExists = await Review.findOne({ tailorId, customerId });
        if (reviewExists) {
            return res.status(400).json({ message: 'You have already reviewed this tailor' });
        }

        const review = await Review.create({
            tailorId,
            customerId,
            customerName,
            rating: Number(rating),
            comment
        });

        // Recalculate average rating
        const reviews = await Review.find({ tailorId });
        const avg = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

        tailor.rating = avg;
        await tailor.save();

        res.status(201).json(review);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update a review
// @route   PUT /api/tailors/:id/reviews/:reviewId
// @access  Private
router.put('/:id/reviews/:reviewId', async (req, res) => {
    try {
        const { rating, comment, userId } = req.body;
        const { id: tailorId, reviewId } = req.params;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check ownership
        if (review.customerId.toString() !== userId) {
            return res.status(401).json({ message: 'Not authorized to update this review' });
        }

        review.rating = Number(rating);
        review.comment = comment;
        await review.save();

        // Recalculate average rating
        const reviews = await Review.find({ tailorId });
        const avg = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

        await Tailor.findByIdAndUpdate(tailorId, { rating: avg });

        res.json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a review
// @route   DELETE /api/tailors/:id/reviews/:reviewId
// @access  Private
router.delete('/:id/reviews/:reviewId', async (req, res) => {
    try {
        const { reviewId, id: tailorId } = req.params;
        const { userId } = req.body;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check ownership
        if (userId && review.customerId.toString() !== userId) {
            return res.status(401).json({ message: 'Not authorized to delete this review' });
        }

        await Review.deleteOne({ _id: reviewId });

        // Recalculate average rating
        const reviews = await Review.find({ tailorId });
        let avg = 0;
        if (reviews.length > 0) {
            avg = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
        }

        await Tailor.findByIdAndUpdate(tailorId, { rating: avg });

        res.json({ message: 'Review removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
