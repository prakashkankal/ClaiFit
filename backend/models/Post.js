import mongoose from 'mongoose';

const postSchema = mongoose.Schema({
    tailor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String, // Caption
    },
    category: {
        type: String,
        required: true,
        enum: ['Menswear', 'Womenswear', 'Kidswear', 'Others'] // Aligning with dropdown
    },
    price: {
        type: Number,
        required: true
    },
    images: [{
        type: String,
        required: true
    }]
}, {
    timestamps: true
});

const Post = mongoose.model('Post', postSchema);

export default Post;
