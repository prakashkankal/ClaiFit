import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Post from '../models/Post.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer Config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

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
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// @desc    Upload Post Image
// @route   POST /api/posts/upload
// @access  Private
router.post('/upload', protect, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // Return full URL
        const protocol = req.protocol;
        const host = req.get('host');
        const fullUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

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

import fs from 'fs';

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
