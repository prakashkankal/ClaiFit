import { createCanvas } from 'canvas';

export const generateInvoiceImage = async (order, tailor) => {
    const width = 800;
    const padding = 40;

    // Calculate height dynamically
    // Header (150) + Card (60) + BillTo (100) + Items (N * 100) + Totals (200) + Footer (100)
    const items = order.orderItems && order.orderItems.length > 0
        ? order.orderItems
        : [{ garmentType: order.orderType || 'Custom Order', quantity: 1, totalPrice: order.price }];

    const itemsHeight = items.length * 110;
    const height = 650 + itemsHeight;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // --- Background ---
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // --- Header ---
    // Tailor Info
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(tailor?.shopName || 'Tailor Shop', padding, 50);

    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.fillText(tailor?.phone || '', padding, 75);
    const address = `${tailor?.address?.street || ''} ${tailor?.address?.city || ''}`;
    // Wrap address if too long
    if (address.length > 40) {
        ctx.fillText(address.substring(0, 40), padding, 95);
        ctx.fillText(address.substring(40), padding, 115);
    } else {
        ctx.fillText(address, padding, 95);
    }

    // KStitch Logo Branding
    ctx.textAlign = 'right';
    ctx.fillStyle = '#999999';
    ctx.font = '10px Arial';
    ctx.fillText('GENERATED ON', width - padding, 40);

    // Draw "KStitch" logo text mock
    // Draw "KStitch" logo branding professionally
    const logoX = width - padding - 85;
    const logoY = 65;

    // Draw a stylish "K" icon (simulating SVG)
    ctx.beginPath();
    ctx.moveTo(logoX, logoY - 20);
    ctx.lineTo(logoX, logoY + 10);
    ctx.lineTo(logoX + 8, logoY + 10);
    ctx.lineTo(logoX + 8, logoY + 2);
    ctx.lineTo(logoX + 22, logoY + 10);
    ctx.lineTo(logoX + 32, logoY + 10);
    ctx.lineTo(logoX + 15, logoY);
    ctx.lineTo(logoX + 32, logoY - 20);
    ctx.lineTo(logoX + 22, logoY - 20);
    ctx.lineTo(logoX + 8, logoY - 5);
    ctx.lineTo(logoX + 8, logoY - 20);
    ctx.closePath();
    ctx.fillStyle = '#4F46E5'; // Indigo/Purple
    ctx.fill();

    // Draw "KStitch" text
    ctx.textAlign = 'right';
    ctx.font = 'bold 24px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = '#333333';
    ctx.fillText('KStitch', width - padding, 70);

    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#333333';
    ctx.fillText('Tax Invoice', width / 2, 160);

    // --- Bill To Selection ---
    const billY = 200;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#999999';
    ctx.font = '14px Arial';
    ctx.fillText('Bill To:', padding, billY);

    ctx.fillStyle = '#333333';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(order.customerName, padding, billY + 25);
    // Optional Phone
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(order.customerPhone || '', padding, billY + 45);

    // Invoice No / Date
    ctx.textAlign = 'right';
    ctx.fillStyle = '#999999';
    ctx.font = '14px Arial';
    ctx.fillText('Invoice No.', width - padding, billY);

    ctx.fillStyle = '#333333';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(order._id.toString().slice(-6).toUpperCase(), width - padding, billY + 25);

    ctx.fillStyle = '#999999';
    ctx.font = '14px Arial';
    ctx.fillText('Date: ' + new Date().toLocaleDateString('en-IN'), width - padding, billY + 55);

    // --- Items Loop ---
    let currentY = 280;

    items.forEach(item => {
        // Card Background/Border
        ctx.strokeStyle = '#dddddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(padding, currentY, width - 2 * padding, 90);
        // Rounded fix: just define a path and stroke

        // Item Name
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0066CC'; // Blue
        ctx.font = 'bold 16px Arial';
        ctx.fillText(item.garmentType || 'Item', padding + 20, currentY + 30);

        // Grid Headers (Implicit in cards) - Logic from image
        // Qty
        ctx.fillStyle = '#999999';
        ctx.font = '12px Arial';
        ctx.fillText('Quantity', padding + 20, currentY + 60);
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${item.quantity || 1} Unit`, padding + 20, currentY + 75);

        // Price
        ctx.fillStyle = '#999999';
        ctx.font = '12px Arial';
        ctx.fillText('Price/Unit', padding + 200, currentY + 60);
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 14px Arial';
        const uPrice = (item.totalPrice / (item.quantity || 1));
        ctx.fillText(`₹ ${uPrice.toFixed(2)}`, padding + 200, currentY + 75);

        // GST (Skip or empty)
        ctx.fillStyle = '#999999';
        ctx.font = '12px Arial';
        ctx.fillText('GST', padding + 400, currentY + 60);
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`--`, padding + 400, currentY + 75);

        // Amount
        ctx.textAlign = 'right';
        ctx.fillStyle = '#999999';
        ctx.font = '12px Arial';
        ctx.fillText('Amount', width - padding - 20, currentY + 60);
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`₹ ${item.totalPrice.toFixed(2)}`, width - padding - 20, currentY + 75);

        currentY += 100; // Spacing
    });

    // --- Pricing Breakup ---
    currentY += 20;
    ctx.strokeStyle = '#dddddd';
    ctx.strokeRect(padding, currentY, width - 2 * padding, 160);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Pricing / Breakup', padding + 20, currentY + 30);

    // Rows
    const drawRow = (label, value, y, bold = false, blue = false) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = bold ? '#333333' : '#999999';
        if (blue) ctx.fillStyle = '#0066CC';
        ctx.font = bold ? 'bold 14px Arial' : '14px Arial';
        ctx.fillText(label, padding + 20, y);

        ctx.textAlign = 'right';
        ctx.fillText(value, width - padding - 20, y);
    };

    let rowY = currentY + 60;

    drawRow('Sub Total', `₹ ${order.price.toFixed(2)}`, rowY, true);
    rowY += 30;

    const discount = order.discount || 0;
    if (discount > 0) {
        drawRow('Discount', `- ₹ ${discount.toFixed(2)}`, rowY, false);
        rowY += 20;
    }

    const totalAmount = order.price - discount;
    drawRow('Total Amount', `₹ ${totalAmount.toFixed(2)}`, rowY, true, true);
    rowY += 30;

    const received = order.advancePayment || 0;
    const balance = Math.max(0, totalAmount - received);
    drawRow('Received Amount', `₹ ${received.toFixed(2)}`, rowY, false);
    rowY += 20;
    drawRow('Transaction Balance', `₹ ${balance.toFixed(2)}`, rowY, false);

    // --- Footer ---
    currentY += 190;

    // Terms
    ctx.textAlign = 'left';
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Terms & Conditions :', padding, currentY);
    ctx.font = '12px Arial';
    ctx.fillText('Thank you for doing business with us.', padding + 130, currentY);

    // Signature Area
    const sigX = width - padding - 200;
    const sigY = currentY - 30;
    ctx.strokeStyle = '#eeeeee';
    ctx.strokeRect(sigX, sigY, 200, 80);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#dddddd'; // Placeholder sig
    ctx.font = 'italic 20px Arial';
    ctx.fillText('Signature', sigX + 100, sigY + 40);

    ctx.fillStyle = '#999999';
    ctx.font = '12px Arial';
    ctx.fillText(tailor?.shopName || 'Authorized', sigX + 100, sigY + 70);

    return canvas.toBuffer('image/png');
};
