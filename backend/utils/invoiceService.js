import Counter from '../models/Counter.js';
import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';

export const getNextInvoiceNumber = async () => {
    const counter = await Counter.findOneAndUpdate(
        { key: 'invoice' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    const seq = String(counter.seq).padStart(4, '0');
    return `KST-INV-${seq}`;
};

export const buildInvoiceMessage = ({ invoice, order, tailor, invoiceLink }) => {
    const dueDate = order?.dueDate
        ? new Date(order.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'N/A';

    const linkLine = invoiceLink ? `View Invoice: ${invoiceLink}\n\n` : '';

    return `Hello ${invoice.customerName},\n\n` +
        `Your order has been successfully created.\n\n` +
        `Order ID: ${order._id.toString().slice(-6).toUpperCase()}\n` +
        `Due Date: ${dueDate}\n` +
        `Total Amount: ₹${invoice.totalAmount}\n` +
        `Advance Paid: ₹${invoice.advanceAmount}\n` +
        `Balance Due: ₹${invoice.dueAmount}\n\n` +
        linkLine +
        `Thank you,\n` +
        `${tailor?.shopName || 'KStitch'}\n` +
        `${tailor?.phone || ''}`.trim();
};

export const createInvoiceForOrder = async ({ order }) => {
    const existing = await Invoice.findOne({ orderId: order._id });
    if (existing) return existing;

    const invoiceNumber = await getNextInvoiceNumber();
    const totalAmount = Number(order.price || 0);
    const advanceAmount = Number(order.advancePayment || 0);
    const dueAmount = Math.max(totalAmount - advanceAmount, 0);

    const items = (order.orderItems && order.orderItems.length > 0)
        ? order.orderItems.map((item) => ({
            description: item.garmentType,
            quantity: item.quantity || 1,
            pricePerItem: Number(item.pricePerItem || 0),
            totalPrice: Number(item.totalPrice || 0),
            stitchingType: item.notes || ''
        }))
        : [{
            description: order.orderType || 'Order',
            quantity: 1,
            pricePerItem: Number(order.price || 0),
            totalPrice: Number(order.price || 0),
            stitchingType: order.description || ''
        }];

    const invoice = await Invoice.create({
        invoiceNumber,
        orderId: order._id,
        tailorId: order.tailorId,
        customerName: order.customerName,
        customerMobile: order.customerPhone,
        customerEmail: order.customerEmail,
        items,
        totalAmount,
        advanceAmount,
        dueAmount,
        dueDate: order.dueDate,
        paymentStatus: advanceAmount > 0 ? 'Advance Paid' : 'Pending',
        note: order.notes || ''
    });

    await Order.findByIdAndUpdate(order._id, { invoiceId: invoice._id });

    return invoice;
};
