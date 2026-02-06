import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Post from '../models/Post.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

import { compressImage } from '../utils/imageCompressor.js';
import fs from 'fs';

// Multer Config (Memory Storage for processing)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.memoryStorage();

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images only!');
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit before compression
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// @desc    Upload Post Image
// @route   POST /api/posts/upload
// @access  Private
router.post('/upload', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Generate filename
        const filename = `post-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        const uploadDir = path.join(process.cwd(), 'uploads'); // Use process.cwd() for reliability
        const filepath = path.join(uploadDir, filename);

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Compress and save
        const compressedBuffer = await compressImage(req.file.buffer, 1000); // 1000px width max
        fs.writeFileSync(filepath, compressedBuffer);

        // Return full URL
        const protocol = req.protocol;
        const host = req.get('host');
        const fullUrl = `${protocol}://${host}/uploads/${filename}`;

        res.send(fullUrl);
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Image upload failed' });
    }

});

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, async (req, res) => {
    const { title, description, category, price, images } = req.body;

    if (!title || !category || !price || !images) { // Basic validation
        return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    try {
        const post = new Post({
            tailor: req.user._id,
            title,
            description,
            category,
            price,
            images
        });

        const createdPost = await post.save();
        res.status(201).json(createdPost);
    } catch (error) {
        console.error('Create Post Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get logged-in tailor's posts
// @route   GET /api/posts/my-posts
// @access  Private
router.get('/my-posts', protect, async (req, res) => {
    try {
        const posts = await Post.find({ tailor: req.user._id }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});



// ... (existing imports and multer config)

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (post) {
            if (post.tailor.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            // Remove images from storage
            if (post.images && post.images.length > 0) {
                post.images.forEach(imageUrl => {
                    try {
                        const filename = imageUrl.split('/uploads/')[1];
                        if (filename) {
                            const filePath = path.join('uploads', filename);
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                            }
                        }
                    } catch (err) {
                        console.error('Error deleting file:', err);
                    }
                });
            }

            await post.deleteOne();
            res.json({ message: 'Post removed' });
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const { title, description, category, price, images } = req.body;
        const post = await Post.findById(req.params.id);

        if (post) {
            if (post.tailor.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            post.title = title || post.title;
            post.description = description || post.description;
            post.category = category || post.category;
            post.price = price || post.price;
            post.images = images || post.images;

            const updatedPost = await post.save();
            res.json(updatedPost);
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
