import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional: for customers who register as users
    },
    tailorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tailor',
        required: true // Which tailor this customer belongs to
    },
    measurements: {
        type: Map,
        of: String,
        required: false
    },
    notes: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

// Index for faster queries
customerSchema.index({ tailorId: 1, phone: 1 }, { unique: true });
customerSchema.index({ tailorId: 1, createdAt: -1 });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
