import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import Tailor from '../models/Tailor.js';
import { generateInvoiceImage } from '../utils/generateInvoiceImage.js';
import { buildInvoiceMessage, createInvoiceForOrder } from '../utils/invoiceService.js';

const router = express.Router();

// Normalize legacy records that were delivered but kept as "Order Completed".
const normalizeDeliveredOrdersStatus = async (query = {}) => {
    await Order.updateMany(
        {
            ...query,
            status: 'Order Completed',
            deliveredAt: { $ne: null }
        },
        {
            $set: { status: 'Delivered' }
        }
    );
};

// @desc    Get dashboard statistics for a tailor
// @route   GET /api/orders/dashboard-stats/:tailorId
// @access  Private (should add auth middleware)
router.get('/dashboard-stats/:tailorId', async (req, res) => {
    try {
        const { tailorId } = req.params;

        // Get total orders count
        const totalOrders = await Order.countDocuments({ tailorId });

        // Get active orders count (Pending + In Progress)
        const activeOrders = await Order.countDocuments({
            tailorId,
            status: { $in: ['Pending', 'In Progress'] }
        });

        // Get completed orders count
        const completedOrders = await Order.countDocuments({
            tailorId,
            status: 'Completed'
        });

        // Calculate total revenue (sum of all completed orders)
        const revenueResult = await Order.aggregate([
            {
                $match: {
                    tailorId: new mongoose.Types.ObjectId(tailorId),
                    status: 'Completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$price' }
                }
            }
        ]);

        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Get tailor's rating (placeholder - you can implement a reviews system later)
        const tailor = await Tailor.findById(tailorId);
        const rating = tailor?.rating || 0;

        res.json({
            totalOrders,
            activeOrders,
            completedOrders,
            totalRevenue,
            rating
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Error fetching dashboard statistics', error: error.message });
    }
});

// @desc    Get recent orders for a tailor
// @route   GET /api/orders/recent/:tailorId
// @access  Private
router.get('/recent/:tailorId', async (req, res) => {
    try {
        const { tailorId } = req.params;
        const limit = parseInt(req.query.limit) || 5;

        await normalizeDeliveredOrdersStatus({ tailorId });

        const orders = await Order.find({ tailorId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('customerName orderType price status createdAt');

        res.json(orders);
    } catch (error) {
        console.error('Recent orders error:', error);
        res.status(500).json({ message: 'Error fetching recent orders', error: error.message });
    }
});

// @desc    Get all orders for a customer
// @route   GET /api/orders/my-orders/:customerId
// @access  Private
router.get('/my-orders/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        await normalizeDeliveredOrdersStatus();

        // Search by customerId OR customerEmail (fallback)
        const orders = await Order.find({
            $or: [
                { customerId: customerId },
                { customerId: new mongoose.Types.ObjectId(customerId) }
            ]
        })
            .populate('tailorId', 'shopName phone address')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error('Get customer orders error:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// @desc    Get all orders for a tailor
// @route   GET /api/orders/:tailorId
// @access  Private
router.get('/:tailorId', async (req, res) => {
    try {
        const { tailorId } = req.params;
        const { status, page = 1, limit = 10, customerPhone, excludeStatus } = req.query;

        await normalizeDeliveredOrdersStatus({ tailorId });

        const query = { tailorId };
        if (status) {
            query.status = status;
        }
        if (excludeStatus) {
            const statusesToExclude = excludeStatus.split(',');
            query.status = { $nin: statusesToExclude };
        }
        if (customerPhone) {
            query.customerPhone = customerPhone;
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Order.countDocuments(query);

        res.json({
            orders,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// @desc    Get order details by ID
// @route   GET /api/orders/details/:orderId
// @access  Private
router.get('/details/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        // Validate order ID format
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format' });
        }

        let order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status === 'Order Completed' && order.deliveredAt) {
            order.status = 'Delivered';
            order = await order.save();
        }

        res.json({ order });
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({ message: 'Error fetching order details', error: error.message });
    }
});

// @desc    Update order notes
// @route   PUT /api/orders/:orderId/notes
// @access  Private
router.put('/:orderId/notes', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { notes } = req.body;

        // Validate order ID format
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format' });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update notes
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { notes },
            { new: true, runValidators: true }
        );

        res.json({ message: 'Notes updated successfully', order: updatedOrder });
    } catch (error) {
        console.error('Update order notes error:', error);
        res.status(500).json({ message: 'Error updating order notes', error: error.message });
    }
});

// @desc    Update order measurements
// @route   PUT /api/orders/:orderId/measurements
// @access  Private
router.put('/:orderId/measurements', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { measurements, orderItems } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (orderItems && orderItems.length > 0) {
            order.orderItems = orderItems;
        }

        if (measurements) {
            order.measurements = measurements;
        }

        // We use save() to ensure validations run properly on subdocuments if any
        const updatedOrder = await order.save();
        res.json({ message: 'Measurements updated successfully', order: updatedOrder });

    } catch (error) {
        console.error('Update measurements error:', error);
        res.status(500).json({ message: 'Error updating measurements', error: error.message });
    }
});

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
router.post('/', async (req, res) => {
    try {
        const {
            tailorId,
            customerId,
            customerName,
            customerEmail,
            customerPhone,
            dueDate,
            notes,
            advancePayment,
            // Multi-item order fields
            orderItems,
            // Legacy single-item order fields
            orderType,
            description,
            measurements,
            price,
            status, // Destructure status
            paymentMode,
            paymentStatus,
            discountAmount,
            currentPaymentAmount,
            remainingAmount,
            payLaterEnabled,
            payLaterAmount,
            payLaterDate,
            isManualBill
        } = req.body;

        // Determine if this is a multi-item or legacy single-item order
        const isMultiItem = orderItems && orderItems.length > 0;

        let orderData = {
            tailorId,
            customerId,
            customerName,
            customerEmail,
            customerPhone,
            dueDate,
            notes: notes || '',
            advancePayment: advancePayment || 0,
            status: status || 'Order Created',
            paymentMode: paymentMode || 'Cash',
            paymentStatus: paymentStatus || 'unpaid',
            discountAmount: Number(discountAmount || 0),
            discount: Number(discountAmount || 0),
            currentPaymentAmount: Number(currentPaymentAmount || 0),
            remainingAmount: remainingAmount !== undefined
                ? Math.max(0, Number(remainingAmount))
                : Math.max(0, Number((isMultiItem ? orderItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0) : price) || 0) - Number(advancePayment || 0) - Number(discountAmount || 0)),
            payLaterEnabled: Boolean(payLaterEnabled),
            payLaterAmount: Number(payLaterAmount || 0),
            payLaterDate: payLaterDate || undefined,
            isManualBill: Boolean(isManualBill)
        };

        if (isMultiItem) {
            // Multi-item order
            // Calculate total price from all items
            const totalPrice = orderItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

            orderData = {
                ...orderData,
                orderItems,
                price: totalPrice
            };
        } else {
            // Legacy single-item order
            orderData = {
                ...orderData,
                orderType,
                description,
                measurements,
                price
            };
        }

        // Validate advance payment
        const expectedTotal = isMultiItem
            ? orderItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
            : price;
        if (advancePayment && Number(advancePayment) > Number(expectedTotal || 0)) {
            return res.status(400).json({ message: 'Advance payment cannot be greater than total amount.' });
        }

        const order = await Order.create(orderData);

        let invoice = null;
        let whatsappMessage = '';
        let whatsappLink = '';

        try {
            invoice = await createInvoiceForOrder({ order });
            const tailor = await Tailor.findById(order.tailorId);
            // Build text-only invoice message (no PDF/JPG link)
            whatsappMessage = buildInvoiceMessage({ invoice, order, tailor, invoiceLink: '' });
            whatsappLink = order.customerPhone
                ? `https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
                : '';
        } catch (invoiceErr) {
            console.error('Invoice creation error:', invoiceErr);
        }

        res.status(201).json({
            ...order.toObject(),
            invoice: invoice ? {
                id: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                invoiceDate: invoice.createdAt,
                totalAmount: invoice.totalAmount,
                advanceAmount: invoice.advanceAmount,
                dueAmount: invoice.dueAmount,
                paymentStatus: invoice.paymentStatus,
                link: ''
            } : null,
            invoiceLink: '',
            whatsappMessage,
            whatsappLink
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
});

// @desc    Update order status
// @route   PUT /api/orders/:orderId/status
// @access  Private
router.put('/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const {
            status,
            paymentMode,
            finalPaymentAmount,
            // New payment flow fields
            paymentStatus,
            discountAmount,
            currentPaymentAmount,
            remainingAmount,
            payLaterEnabled,
            payLaterAmount,
            payLaterDate
        } = req.body;

        // Get current order
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Validate status transitions
        const validTransitions = {
            'Draft': ['Order Created', 'Cancelled'],
            'Order Created': ['Cutting Completed', 'Cancelled'],
            'Cutting Completed': ['Order Completed', 'Order Created', 'Cancelled'],
            'Order Completed': ['Payment Completed', 'Cutting Completed', 'Cancelled'],
            'Payment Completed': ['Delivered', 'Payment Completed'],
            // Legacy statuses for backward compatibility
            'Pending': ['In Progress', 'Cancelled'],
            'In Progress': ['Completed', 'Pending', 'Cancelled'],
            'Completed': ['Delivered', 'In Progress'],
            'Delivered': ['Payment Completed', 'Delivered'],
            'Cancelled': ['Order Created']
        };

        const currentStatus = order.status;
        const allowedStatuses = validTransitions[currentStatus] || [];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status transition from "${currentStatus}" to "${status}". Allowed transitions: ${allowedStatuses.join(', ') || 'None'}`
            });
        }

        // Update status and timestamps
        const updateData = { status };

        if (status === 'Cutting Completed') {
            updateData.cuttingCompletedAt = new Date();
        } else if (status === 'Order Completed') {
            updateData.completedAt = new Date();
        } else if (status === 'Payment Completed') {
            // New payment step
            updateData.paymentCompletedAt = new Date();

            // Update payment fields
            if (paymentStatus) updateData.paymentStatus = paymentStatus;
            if (discountAmount !== undefined) {
                updateData.discountAmount = discountAmount;
                updateData.discount = discountAmount; // Keep legacy field in sync
            }
            if (currentPaymentAmount !== undefined) {
                const existingPaid = Number(order.currentPaymentAmount || 0);
                const incomingPaid = Number(currentPaymentAmount || 0);
                updateData.currentPaymentAmount = existingPaid + incomingPaid;
            }
            if (remainingAmount !== undefined) {
                const safeRemaining = Math.max(0, Number(remainingAmount));
                updateData.remainingAmount = safeRemaining;
                updateData.isPaid = safeRemaining === 0;
                if (!paymentStatus) {
                    updateData.paymentStatus = safeRemaining === 0 ? 'paid' : 'partial';
                }
            }
            if (paymentMode) updateData.paymentMode = paymentMode;

            // Pay later fields
            if (payLaterEnabled !== undefined) updateData.payLaterEnabled = payLaterEnabled;
            if (payLaterAmount !== undefined) updateData.payLaterAmount = payLaterAmount;
            if (payLaterDate) updateData.payLaterDate = payLaterDate;

            // Mark as paid if no remaining amount
            if (remainingAmount === 0) {
                updateData.isPaid = true;
            }
        } else if (status === 'Delivered') {
            updateData.deliveredAt = order.deliveredAt || new Date();
            // If payment details provided, save them (backward compatibility)
            if (paymentMode) updateData.paymentMode = paymentMode;
            if (finalPaymentAmount !== undefined) updateData.finalPaymentAmount = finalPaymentAmount;
            if (req.body.discount !== undefined) {
                updateData.discount = req.body.discount;
                updateData.discountAmount = req.body.discount;
            }
            // Support post-delivery payment collection updates.
            if (paymentStatus) updateData.paymentStatus = paymentStatus;
            if (currentPaymentAmount !== undefined) {
                const existingPaid = Number(order.currentPaymentAmount || 0);
                const incomingPaid = Number(currentPaymentAmount || 0);
                updateData.currentPaymentAmount = existingPaid + incomingPaid;
            }
            if (remainingAmount !== undefined) {
                const safeRemaining = Math.max(0, Number(remainingAmount));
                updateData.remainingAmount = safeRemaining;
                updateData.isPaid = safeRemaining === 0;
                if (!paymentStatus) {
                    updateData.paymentStatus = safeRemaining === 0 ? 'paid' : 'partial';
                }
            } else {
                const existingRemaining = Number(order.remainingAmount || 0);
                updateData.isPaid = existingRemaining === 0;
            }
            if (payLaterEnabled !== undefined) updateData.payLaterEnabled = payLaterEnabled;
            if (payLaterAmount !== undefined) updateData.payLaterAmount = payLaterAmount;
            if (payLaterDate) updateData.payLaterDate = payLaterDate;
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true, runValidators: true }
        );

        // Update Invoice if it exists
        if (status === 'Payment Completed' || status === 'Delivered') {
            try {
                const discount = Number(updatedOrder.discountAmount || updatedOrder.discount || 0);
                const totalAmount = Number(updatedOrder.price);
                const advance = Number(updatedOrder.advancePayment || 0);
                const due = Math.max(0, totalAmount - advance - discount);

                const invoiceStatus = updatedOrder.remainingAmount === 0 ? 'Paid' :
                    updatedOrder.payLaterEnabled ? 'Pending' : 'Partial';

                await Invoice.findOneAndUpdate(
                    { orderId: updatedOrder._id },
                    {
                        discount: discount,
                        dueAmount: due,
                        paymentStatus: invoiceStatus
                    }
                );
            } catch (invErr) {
                console.error('Error updating invoice:', invErr);
            }
        }

        // Generate Invoice Image Link if Delivered
        let whatsappMessage = '';
        let invoiceImageLink = '';
        if (status === 'Delivered') {
            try {
                const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
                invoiceImageLink = `${baseUrl}/api/orders/${updatedOrder._id}/invoice-jpg`;
                console.log('Generating Delivery Invoice Image for Order:', updatedOrder._id);
            } catch (err) {
                console.error('Error generating invoice image link:', err);
            }
        }

        res.json({
            order: updatedOrder,
            whatsappMessage,
            customerPhone: updatedOrder.customerPhone,
            invoiceImageLink
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
});

// @desc    Update an order (Full update for Draft conversion or editing)
// @route   PUT /api/orders/:orderId
// @access  Private
router.put('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const {
            customerName,
            customerEmail,
            customerPhone,
            dueDate,
            notes,
            advancePayment,
            orderItems,
            status,
            orderType,       // Legacy
            description,     // Legacy
            measurements,    // Legacy
            price,
            isManualBill
        } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Determine if this is a multi-item or legacy single-item update
        const isMultiItem = orderItems && orderItems.length > 0;

        // Update fields
        order.customerName = customerName;
        order.customerEmail = customerEmail;
        order.customerPhone = customerPhone;
        order.dueDate = dueDate;
        order.notes = notes || '';
        order.advancePayment = advancePayment || 0;
        if (isManualBill !== undefined) {
            order.isManualBill = Boolean(isManualBill);
        }

        if (status) {
            // Validate transition if changing from Draft
            if (order.status === 'Draft' && status !== 'Draft' && status !== 'Order Created' && status !== 'Cancelled') {
                return res.status(400).json({ message: 'Invalid status transition from Draft' });
            }
            order.status = status;
        }

        if (isMultiItem) {
            order.orderItems = orderItems;
            // Recalculate or use provided price
            const totalPrice = orderItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            order.price = totalPrice;
            // Clear legacy fields if switching
            order.orderType = undefined;
            order.measurements = undefined;
        } else {
            // Legacy update
            if (orderType) order.orderType = orderType;
            if (description !== undefined) order.description = description;
            if (measurements) order.measurements = measurements;
            if (price) order.price = price;
        }

        // Validate Advance
        if (Number(order.advancePayment) > Number(order.price)) {
            return res.status(400).json({ message: 'Advance payment cannot be greater than total amount.' });
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);

    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ message: 'Error updating order', error: error.message });
    }
});

// @desc    Delete an order
// @route   DELETE /api/orders/:orderId
// @access  Private
router.delete('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findByIdAndDelete(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ message: 'Error deleting order', error: error.message });
    }
});

// @desc    Get customers for a tailor (aggregated from orders)
// @route   GET /api/orders/customers/:tailorId
// @access  Private
router.get('/customers/:tailorId', async (req, res) => {
    try {
        const { tailorId } = req.params;

        // Aggregate customers from orders
        const customers = await Order.aggregate([
            {
                $match: {
                    tailorId: new mongoose.Types.ObjectId(tailorId)
                }
            },
            {
                $group: {
                    _id: {
                        name: '$customerName',
                        email: '$customerEmail',
                        phone: '$customerPhone'
                    },
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: '$price' },
                    lastVisit: { $max: '$createdAt' },
                    firstVisit: { $min: '$createdAt' }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: '$_id.name',
                    email: '$_id.email',
                    phone: '$_id.phone',
                    orders: '$orderCount',
                    totalSpent: '$totalSpent',
                    lastVisit: '$lastVisit',
                    firstVisit: '$firstVisit'
                }
            },
            {
                $sort: { lastVisit: -1 }
            }
        ]);

        res.json(customers);
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ message: 'Error fetching customers', error: error.message });
    }
});

// @desc    Generate PDF Invoice
// @route   GET /api/orders/:orderId/invoice
// @access  Public (Shareable Link)
router.get('/:orderId/invoice', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).send('Order not found');

        const tailor = await Tailor.findById(order.tailorId);

        // Create PDF
        const PDFDocument = (await import('pdfkit')).default;
        const doc = new PDFDocument({ margin: 50 });

        // Set Headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Invoice-${order._id.toString().slice(-6)}.pdf`);

        doc.pipe(res);

        // --- Design ---
        doc.font('Helvetica');

        // 1. Header (Company Info) - Top Left
        // Shop Name
        doc.fillColor('#333333').fontSize(20).text(tailor?.shopName || 'Tailor Shop', 50, 50);

        // Address & Phone
        doc.fontSize(10);
        const street = tailor?.address?.street || '';
        if (street) doc.text(street, 50, 75);

        let cityLine = tailor?.address?.city || '';
        if (tailor?.address?.zipCode) cityLine += `, ${tailor.address.zipCode}`;
        doc.text(cityLine, 50, street ? 90 : 75);

        doc.text(`Phone: ${tailor?.phone || ''}`, 50, street ? 105 : 90);

        // 2. Invoice Title Box - Top Right
        doc.fillColor('#4472C4').fontSize(28).text('INVOICE', 350, 50, { align: 'right' });

        // Invoice # & Date Grid
        const gridY = 90;
        // Headers
        doc.rect(350, gridY, 100, 20).fill('#cfdbe6'); // Invoice # Header Bg
        doc.rect(450, gridY, 100, 20).fill('#cfdbe6'); // Date Header Bg
        doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold');
        doc.text('INVOICE #', 350, gridY + 6, { width: 100, align: 'center' });
        doc.text('DATE', 450, gridY + 6, { width: 100, align: 'center' });

        const invoiceDoc = await Invoice.findOne({ orderId });
        const invoiceNum = invoiceDoc?.invoiceNumber || order._id.toString().slice(-6).toUpperCase();
        const invoiceDate = (invoiceDoc?.createdAt ? new Date(invoiceDoc.createdAt) : new Date()).toLocaleDateString();
        doc.rect(350, gridY + 20, 100, 20).stroke('#cccccc');
        doc.rect(450, gridY + 20, 100, 20).stroke('#cccccc');
        doc.font('Helvetica').fontSize(10).fillColor('#000000');
        doc.text(invoiceNum, 350, gridY + 26, { width: 100, align: 'center' });
        doc.text(invoiceDate, 450, gridY + 26, { width: 100, align: 'center' });

        // 3. Bill To Section
        const billToY = 160;
        doc.fillColor('#4472C4').fontSize(12).font('Helvetica-Bold').text('BILL TO', 50, billToY);
        doc.rect(50, billToY + 18, 200, 15).fill('#cfdbe6'); // Header Bg
        doc.fillColor('#000000').fontSize(10).text('Name', 55, billToY + 21);

        doc.font('Helvetica');
        doc.text(order.customerName, 50, billToY + 40);
        doc.text(order.customerPhone, 50, billToY + 55);
        if (order.customerEmail) doc.text(order.customerEmail, 50, billToY + 70);

        // 4. Table Header
        const tableY = 240;
        doc.rect(50, tableY, 400, 25).fill('#cfdbe6'); // Description Header Bg
        doc.rect(450, tableY, 100, 25).fill('#cfdbe6'); // Amount Header Bg

        doc.fillColor('#4472C4').font('Helvetica-Bold').fontSize(10);
        doc.text('DESCRIPTION', 60, tableY + 8);
        doc.text('AMOUNT', 450, tableY + 8, { width: 100, align: 'center' });

        // 5. Table Rows
        let y = tableY + 35;
        doc.font('Helvetica').fontSize(10).fillColor('#000000');

        const addRow = (desc, amount) => {
            doc.text(desc, 60, y);
            doc.text(amount, 450, y, { width: 100, align: 'center' });
            y += 20;
        };

        if (order.orderItems && order.orderItems.length > 0) {
            order.orderItems.forEach(item => {
                addRow(`${item.garmentType} (Qty: ${item.quantity})`, item.totalPrice.toFixed(2));
            });
        } else {
            addRow(order.orderType, order.price.toFixed(2));
        }

        // Draw line below items if needed, or sidebar line
        doc.moveTo(450, tableY).lineTo(450, y).stroke('#cccccc'); // Vertical divider

        // 6. Totals Section
        y += 20;
        const totalXLabel = 300;
        const totalXValue = 450;

        // Subtotal
        doc.font('Helvetica').text('Subtotal', totalXLabel, y, { align: 'right', width: 140 });
        doc.text(order.price.toFixed(2), totalXValue, y, { width: 100, align: 'center' });
        y += 15;

        // Advance Paid
        if (order.advancePayment > 0) {
            doc.text('Advance Paid', totalXLabel, y, { align: 'right', width: 140 });
            doc.text(`(${order.advancePayment.toFixed(2)})`, totalXValue, y, { width: 100, align: 'center' });
            y += 15;
        }

        // Divider
        doc.rect(totalXLabel, y, 250, 1).fill('#4472C4');
        y += 10;

        // Total
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');

        // Add Discount if any
        if (order.discount > 0) {
            doc.font('Helvetica').fontSize(10);
            doc.text('Discount', totalXLabel, y, { align: 'right', width: 140 });
            doc.text(`- ${order.discount.toFixed(2)}`, totalXValue, y, { width: 100, align: 'center' });
            y += 15;
            // Add Divider again
            doc.rect(totalXLabel, y, 250, 1).fill('#4472C4');
            y += 10;
        }

        const finalTotal = Math.max(0, order.price - order.advancePayment - (order.discount || 0));

        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
        doc.text('TOTAL', totalXLabel, y, { align: 'right', width: 140 });
        doc.text('Rs. ' + finalTotal.toFixed(2), totalXValue, y, { width: 100, align: 'center' });

        // Paid Stamp if delivered
        doc.moveDown(4);
        if (order.status === 'Delivered') {
            const stampY = 600;
            doc.rotate(-10, { origin: [280, stampY] });
            doc.fontSize(30).fillColor('green').opacity(0.3).text('PAID & DELIVERED', 130, stampY, { align: 'center' });
            doc.rotate(0); // Reset rotation
            doc.opacity(1);
        }

        // 7. Footer
        doc.fontSize(10).fillColor('#000000').font('Helvetica-Oblique');
        doc.text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });
        doc.fontSize(8).text('If you have any questions about this invoice, please contact', 50, 720, { align: 'center' });
        doc.text(`${tailor?.shopName || 'Us'} at ${tailor?.phone || ''}`, 50, 735, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('PDF Gen Error:', error);
        res.status(500).send('Error generating invoice');
    }
});


// @desc    Generate JPEG Invoice (Ryapar Style)
// @route   GET /api/orders/:orderId/invoice-jpg
// @access  Public (Shareable Link)
router.get('/:orderId/invoice-jpg', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).send('Order not found');

        const tailor = await Tailor.findById(order.tailorId);

        const imageBuffer = await generateInvoiceImage(order, tailor);

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `inline; filename=Invoice-${order._id.toString().slice(-6)}.png`);
        res.send(imageBuffer);

    } catch (error) {
        console.error('Image Gen Error:', error);
        res.status(500).send('Error generating invoice image');
    }
});

export default router;
