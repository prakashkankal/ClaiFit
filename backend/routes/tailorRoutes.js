import express from 'express';
import jwt from 'jsonwebtoken';
import Tailor from '../models/Tailor.js';
import User from '../models/User.js';
import Review from '../models/Review.js';

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
            googleId
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

            res.status(201).json({
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
                userType: 'tailor',
                token: generateToken(tailor._id)
            });
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

        // Find tailor and update shop image
        const tailor = await Tailor.findOneAndUpdate(
            { email },
            { shopImage },
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

// @desc    Update tailor profile
// @route   PUT /api/tailors/update-profile
// @access  Private
router.put('/update-profile', async (req, res) => {
    try {
        const { email, name, shopName, phone, specialization, address, businessHours } = req.body;

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
        if (req.body.bio) updateData.bio = req.body.bio;

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

        const total = await Tailor.countDocuments();
        const tailors = await Tailor.find()
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

        // Convert to object and add reviews data
        const tailorData = tailor.toObject();
        tailorData.reviews = reviews;
        tailorData.totalReviews = reviews.length;

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

export default router;
