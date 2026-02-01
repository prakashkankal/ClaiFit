import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema({
    tailorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Tailor'
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    customerName: {
        type: String,
        required: true // Storing name to avoid complex populations if user deleted
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Prevent duplicate reviews from same customer for same tailor
reviewSchema.index({ tailorId: 1, customerId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
