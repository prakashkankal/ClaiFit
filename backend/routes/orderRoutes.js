import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Tailor from '../models/Tailor.js';

const router = express.Router();

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
        const { status, page = 1, limit = 10 } = req.query;

        const query = { tailorId };
        if (status) {
            query.status = status;
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

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
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
            price
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
            status: 'Order Created'
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

        const order = await Order.create(orderData);

        res.status(201).json(order);
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
        const { status } = req.body;

        // Get current order
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Validate status transitions
        const validTransitions = {
            'Order Created': ['Cutting Completed'],
            'Cutting Completed': ['Order Completed'],
            'Order Completed': [], // Final status, no transitions allowed
            // Legacy statuses for backward compatibility
            'Pending': ['In Progress', 'Cancelled'],
            'In Progress': ['Completed', 'Cancelled'],
            'Completed': ['Delivered'],
            'Delivered': [],
            'Cancelled': []
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
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true, runValidators: true }
        );

        res.json(updatedOrder);
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Error updating order status', error: error.message });
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

export default router;
