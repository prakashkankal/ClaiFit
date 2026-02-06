import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
    description: {
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
    stitchingType: {
        type: String,
        required: false
    }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true
    },
    tailorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tailor',
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerMobile: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: false
    },
    items: {
        type: [invoiceItemSchema],
        default: []
    },
    totalAmount: {
        type: Number,
        required: true
    },
    advanceAmount: {
        type: Number,
        required: true,
        default: 0
    },
    discount: {
        type: Number,
        required: false,
        default: 0
    },
    dueAmount: {
        type: Number,
        required: true
    },
    dueDate: {
        type: Date,
        required: false
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['Advance Paid', 'Pending'],
        default: 'Pending'
    },
    note: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

invoiceSchema.index({ tailorId: 1, createdAt: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
