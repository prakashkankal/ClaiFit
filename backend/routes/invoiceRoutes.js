import express from 'express';
import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import Tailor from '../models/Tailor.js';
import { buildInvoiceMessage } from '../utils/invoiceService.js';

const router = express.Router();


// @desc    Get invoice by ID
// @route   GET /api/invoices/:invoiceId
// @access  Public (read-only)
router.get('/:invoiceId', async (req, res) => {
    try {
        const { invoiceId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
            return res.status(400).json({ message: 'Invalid invoice ID format' });
        }

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        res.json({ invoice });
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ message: 'Error fetching invoice', error: error.message });
    }
});

// @desc    PDF Invoice link (redirects to order invoice PDF)
// @route   GET /api/invoices/:invoiceId/pdf
// @access  Public (shareable)
router.get('/:invoiceId/pdf', async (req, res) => {
    try {
        const { invoiceId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
            return res.status(400).json({ message: 'Invalid invoice ID format' });
        }

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(404).send('Invoice not found');

        res.redirect(302, `/api/orders/${invoice.orderId}/invoice`);
    } catch (error) {
        console.error('Invoice PDF redirect error:', error);
        res.status(500).send('Error generating invoice');
    }
});

// @desc    Build WhatsApp message for invoice
// @route   POST /api/invoices/:invoiceId/message
// @access  Public (read-only)
router.post('/:invoiceId/message', async (req, res) => {
    try {
        const { invoiceId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
            return res.status(400).json({ message: 'Invalid invoice ID format' });
        }

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const order = await Order.findById(invoice.orderId);
        const tailor = await Tailor.findById(invoice.tailorId);

        const baseUrl = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`;
        const invoiceLink = `${baseUrl}/api/invoices/${invoice._id}/pdf`;
        const whatsappMessage = buildInvoiceMessage({ invoice, order, tailor, invoiceLink });
        const whatsappLink = invoice.customerMobile
            ? `https://wa.me/${invoice.customerMobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
            : '';

        res.json({ invoiceLink, whatsappMessage, whatsappLink });
    } catch (error) {
        console.error('Invoice message error:', error);
        res.status(500).json({ message: 'Error building invoice message', error: error.message });
    }
});

export default router;
