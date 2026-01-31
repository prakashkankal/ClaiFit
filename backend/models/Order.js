import mongoose from 'mongoose';

// Order Item sub-schema for multi-item orders
const orderItemSchema = new mongoose.Schema({
    garmentType: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },
    pricePerItem: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    measurementPresetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MeasurementPreset',
        required: false
    },
    presetName: {
        type: String,
        required: false
    },
    measurements: {
        type: Map,
        of: String,
        required: false
    },
    extraMeasurements: {
        type: Map,
        of: String,
        required: false
    },
    notes: {
        type: String,
        required: false
    }
}, { _id: true });

const orderSchema = new mongoose.Schema({
    tailorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tailor',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Can be null for walk-in customers
    },
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: false
    },
    customerPhone: {
        type: String,
        required: true
    },

    // NEW: Multi-item support
    orderItems: [orderItemSchema],

    // LEGACY: Keep for backward compatibility
    orderType: {
        type: String,
        required: false, // Changed to false for multi-item orders
        enum: ['Suit Alteration', 'Custom Dress', 'Shirt Stitching', 'Blouse Design', 'Wedding Suit', 'Saree Blouse', 'Lehenga', 'Kurta', 'Other']
    },
    description: {
        type: String,
        required: false
    },
    measurements: {
        type: Map,
        of: String,
        required: false
    },

    price: {
        type: Number,
        required: true
    },
    advancePayment: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        required: true,
        enum: ['Order Created', 'Cutting Completed', 'Order Completed', 'Pending', 'In Progress', 'Completed', 'Cancelled', 'Delivered'],
        default: 'Order Created'
    },
    dueDate: {
        type: Date,
        required: false
    },
    notes: {
        type: String,
        required: false
    },
    cuttingCompletedAt: {
        type: Date,
        required: false
    },
    completedAt: {
        type: Date,
        required: false
    }
}, {
    timestamps: true
});

// Index for faster queries
orderSchema.index({ tailorId: 1, status: 1 });
orderSchema.index({ tailorId: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
