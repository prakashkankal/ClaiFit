import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_URL from '../../config/api'
import SwipeToRemoveOrderCard from './SwipeToRemoveOrderCard'

// LocalStorage key for hidden orders
const HIDDEN_ORDERS_KEY = 'recent_hidden_order_ids';

const RecentOrders = ({ tailorId }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    // Hidden orders state with localStorage persistence
    const [hiddenOrderIds, setHiddenOrderIds] = useState(() => {
        try {
            const stored = localStorage.getItem(HIDDEN_ORDERS_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (e) {
            console.error('Error loading hidden orders:', e);
            return new Set();
        }
    });

    // Undo functionality
    const [undoItem, setUndoItem] = useState(null);
    const [showUndo, setShowUndo] = useState(false);
    const undoTimeoutRef = React.useRef(null);

    const fetchOrders = async () => {
        if (!tailorId) return;

        try {
            setLoading(true);
            // Fetch recent orders, excluding only Cancelled
            // Include Delivered to check payment status
            const { data } = await axios.get(`${API_URL}/api/orders/${tailorId}?limit=20&excludeStatus=Cancelled`);
            const allOrders = data.orders || [];

            // Filter logic: Keep orders with pending payment OR not delivered yet
            const filteredOrders = allOrders.filter(order => {
                // Manual bills should not appear in Recent tab
                if (order.isManualBill) return false;

                // Always show drafts
                if (order.status === 'Draft') return true;

                // Show if not delivered yet
                if (order.status !== 'Delivered') return true;

                // For delivered orders, check payment status
                const paymentStatus = order.paymentStatus || 'unpaid';
                const remainingAmount = order.remainingAmount || 0;

                // Keep if payment is not complete
                // Payment is complete only when status is 'paid' and remainingAmount is 0
                if (paymentStatus !== 'paid' || remainingAmount > 0) {
                    return true;
                }

                // Hide fully paid delivered orders
                return false;
            });

            // Separate drafts and put them at top
            const draftOrders = filteredOrders.filter(o => o.status === 'Draft');
            const otherOrders = filteredOrders.filter(o => o.status !== 'Draft');

            // Combine: Drafts at top, then others (already sorted by createdAt desc from backend)
            setOrders([...draftOrders, ...otherOrders]);

            setError(null);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    // Handle removing order from Recent tab
    const handleRemoveFromRecent = (orderId) => {
        // Find the order for undo
        const removedOrder = orders.find(o => o._id === orderId);
        if (!removedOrder) return;

        // Clear any existing undo timeout
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
        }

        // Update hidden orders
        const newHiddenIds = new Set(hiddenOrderIds);
        newHiddenIds.add(orderId);
        setHiddenOrderIds(newHiddenIds);

        // Persist to localStorage
        try {
            localStorage.setItem(HIDDEN_ORDERS_KEY, JSON.stringify(Array.from(newHiddenIds)));
        } catch (e) {
            console.error('Error saving hidden orders:', e);
        }

        // Show undo toast
        setUndoItem(removedOrder);
        setShowUndo(true);

        // Auto-hide undo toast after 5 seconds
        undoTimeoutRef.current = setTimeout(() => {
            setShowUndo(false);
            setUndoItem(null);
        }, 5000);
    };

    // Handle undo action
    const handleUndo = () => {
        if (!undoItem) return;

        // Clear timeout
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
        }

        // Restore order
        const newHiddenIds = new Set(hiddenOrderIds);
        newHiddenIds.delete(undoItem._id);
        setHiddenOrderIds(newHiddenIds);

        // Persist to localStorage
        try {
            localStorage.setItem(HIDDEN_ORDERS_KEY, JSON.stringify(Array.from(newHiddenIds)));
        } catch (e) {
            console.error('Error saving hidden orders:', e);
        }

        // Hide undo toast
        setShowUndo(false);
        setUndoItem(null);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [tailorId]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (openMenuId) {
                setOpenMenuId(null);
            }
        };

        if (openMenuId) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [openMenuId]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'short' };
        return date.toLocaleDateString('en-US', options);
    };

    const getDueDateDisplay = (dueDate) => {
        if (!dueDate) return { text: 'No due date', className: 'text-slate-400' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);

        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                text: `${formatDate(dueDate)} (${Math.abs(diffDays)}d overdue)`,
                className: 'text-red-600 font-bold'
            };
        } else if (diffDays === 0) {
            return {
                text: `${formatDate(dueDate)} (Today!)`,
                className: 'text-orange-600 font-bold'
            };
        } else if (diffDays <= 3) {
            return {
                text: `${formatDate(dueDate)} (${diffDays}d left)`,
                className: 'text-amber-600 font-medium'
            };
        } else {
            return {
                text: formatDate(dueDate),
                className: 'text-slate-600'
            };
        }
    };

    const getPaymentStatusInfo = (order) => {
        const paymentStatus = order.paymentStatus || 'unpaid';
        const remainingAmount = order.remainingAmount || 0;
        const payLaterDate = order.payLaterDate;

        // Fully paid - no display needed
        if (paymentStatus === 'paid' && remainingAmount === 0) {
            return null;
        }

        // Has pending payment
        if (remainingAmount > 0) {
            let statusText = '';
            let badgeClass = '';

            if (paymentStatus === 'unpaid') {
                statusText = 'Payment Due';
                badgeClass = 'bg-red-100 text-red-700 border-red-300';
            } else if (paymentStatus === 'partial') {
                statusText = 'Partial Payment';
                badgeClass = 'bg-amber-100 text-amber-700 border-amber-300';
            } else if (paymentStatus === 'scheduled') {
                statusText = 'Payment Scheduled';
                badgeClass = 'bg-blue-100 text-blue-700 border-blue-300';
            } else {
                statusText = 'Payment Pending';
                badgeClass = 'bg-orange-100 text-orange-700 border-orange-300';
            }

            return {
                hasPaymentDue: true,
                statusText,
                badgeClass,
                remainingAmount,
                payLaterDate,
                formattedAmount: `₹${remainingAmount.toFixed(2)}`
            };
        }

        return null;
    };

    const getNextAction = (status, order) => {
        // Check if payment is due first
        const paymentInfo = getPaymentStatusInfo(order);
        if (paymentInfo && paymentInfo.hasPaymentDue) {
            return 'Collect Payment';
        }

        switch (status) {
            case 'Order Created':
                return 'Cut Cloth';
            case 'Cutting Completed':
                return 'Stitch & Complete';
            case 'Order Completed':
                return 'Process Payment';
            case 'Payment Completed':
                return 'Ready for Delivery';
            default:
                return '-';
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Order Created': 'bg-yellow-100 text-yellow-700 border border-yellow-300',
            'Cutting Completed': 'bg-blue-100 text-blue-700 border border-blue-300',
            'Order Completed': 'bg-green-100 text-green-700 border border-green-300',
            'Payment Completed': 'bg-emerald-100 text-emerald-700 border border-emerald-300',
            'Pending': 'bg-amber-100 text-amber-700 border border-amber-300',
            'In Progress': 'bg-blue-100 text-blue-700 border border-blue-300',
            'Completed': 'bg-emerald-100 text-emerald-700 border border-emerald-300',
            'Draft': 'bg-purple-100 text-purple-700 border border-purple-300',
            'Delivered': 'bg-slate-100 text-slate-700 border border-slate-300',
            'Cancelled': 'bg-red-100 text-red-700 border border-red-300'
        };

        return badges[status] || 'bg-slate-100 text-slate-700 border border-slate-300';
    };

    const getRecentStatusMeta = (order) => {
        const paymentInfo = getPaymentStatusInfo(order);

        // Highest priority: if any payment is pending, show this as badge status.
        if (paymentInfo && paymentInfo.hasPaymentDue) {
            return {
                label: 'Payment Remaining',
                className: 'bg-red-100 text-red-700 border border-red-300'
            };
        }

        switch (order.status) {
            case 'Order Created':
                return { label: 'Cutting', className: getStatusBadge(order.status) };
            case 'Cutting Completed':
                return { label: 'Cutting Done', className: getStatusBadge(order.status) };
            case 'Order Completed':
                return { label: 'Order Complete', className: getStatusBadge(order.status) };
            case 'Payment Completed':
                return { label: 'Payment Completed', className: getStatusBadge(order.status) };
            case 'Delivered':
                return { label: 'Order Delivered', className: getStatusBadge(order.status) };
            default:
                return { label: order.status, className: getStatusBadge(order.status) };
        }
    };

    const handleCardClick = (order) => {
        if (order.status === 'Draft') {
            navigate(`/orders/new?draftId=${order._id}`);
        } else {
            navigate(`/orders/${order._id}`);
        }
    };

    const getInvoiceImageLink = (orderId) => `${API_URL}/api/orders/${orderId}/invoice-jpg`;

    const isImageInvoiceStatus = (status) => ['Order Completed', 'Delivered', 'Completed'].includes(status);

    const buildTextInvoiceMessage = (order) => {
        return `Hello ${order.customerName},\n\n` +
            `Your invoice for Order #${order._id.slice(-6).toUpperCase()} is ready.\n\n` +
            `Total Amount: ₹${order.price}\n` +
            `Advance Paid: ₹${order.advancePayment || 0}\n` +
            `Balance Due: ₹${(order.price || 0) - (order.advancePayment || 0)}\n\n` +
            `Thank you,\nKStitch`;
    };

    const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        // Remove any spaces, dashes, or special characters
        let cleaned = phone.replace(/[\s\-\(\)]/g, '');

        // Add +91 country code if not present
        if (!cleaned.startsWith('+')) {
            if (cleaned.startsWith('91')) {
                cleaned = '+' + cleaned;
            } else {
                cleaned = '+91' + cleaned;
            }
        }
        return cleaned;
    };

    const handleSendInvoice = async (order) => {
        if (!order?.customerPhone) return;
        const phone = formatPhoneNumber(order.customerPhone);

        // Copy phone number to clipboard for easy pasting in WhatsApp
        try {
            await navigator.clipboard.writeText(phone);
            // Show brief notification
            const toast = document.createElement('div');
            toast.textContent = `📋 Phone copied: ${phone}`;
            toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-[9999] animate-fade-in';
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('opacity-0', 'transition-opacity');
                setTimeout(() => document.body.removeChild(toast), 300);
            }, 2000);
        } catch (err) {
            console.log('Clipboard copy failed:', err);
        }

        if (isImageInvoiceStatus(order.status)) {
            try {
                // Fetch the invoice image as a blob
                const invoiceImageUrl = `${API_URL}/api/orders/${order._id}/invoice-jpg`;
                const response = await fetch(invoiceImageUrl);
                const blob = await response.blob();

                // Create a file from the blob
                const fileName = `Invoice_${order._id.slice(-6).toUpperCase()}_${order.customerName.replace(/\s+/g, '_')}.jpg`;
                const file = new File([blob], fileName, { type: 'image/jpeg' });

                // Check if Web Share API is available (mobile devices)
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    // Try Web Share API first for automatic attachment
                    try {
                        await navigator.share({
                            files: [file]
                        });
                        // If user successfully shares, we're done!
                        return;
                    } catch (shareError) {
                        // If user cancels share sheet, fall through to direct WhatsApp opening
                        if (shareError.name === 'AbortError') {
                            console.log('User cancelled share, opening WhatsApp directly...');
                        } else {
                            throw shareError;
                        }
                    }
                }

                // Fallback OR after share cancellation: Download and open WhatsApp directly with customer contact
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Short delay to ensure download starts
                await new Promise(resolve => setTimeout(resolve, 500));

                // Open WhatsApp directly with customer contact (no pre-filled message)
                const whatsappUrl = `https://wa.me/${phone}`;
                window.open(whatsappUrl, '_blank');

            } catch (error) {
                console.error('Error sharing invoice:', error);
                alert('Failed to share invoice. Please try again.');
            }
            return;
        }

        const message = buildTextInvoiceMessage(order);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleViewInvoice = (order) => {
        if (isImageInvoiceStatus(order.status)) {
            window.open(getInvoiceImageLink(order._id), '_blank');
            return;
        }

        const message = buildTextInvoiceMessage(order);
        alert(message);
    };

    const handleCancelOrder = async (orderId) => {
        if (window.confirm('Are you sure you want to cancel this order?')) {
            try {
                await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status: 'Cancelled' });
                // Optimistically update local state
                setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'Cancelled' } : o));
            } catch (err) {
                console.error('Error cancelling order:', err);
                alert('Failed to cancel order');
            }
        }
    };

    const handleDeleteDraft = async (e, orderId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this draft?')) {
            try {
                await axios.delete(`${API_URL}/api/orders/${orderId}`);
                // Remove from local state immediately
                setOrders(prev => prev.filter(o => o._id !== orderId));
            } catch (err) {
                console.error('Error deleting draft:', err);
                alert('Failed to delete draft');
            }
        }
    };

    if (error) {
        return (
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg shadow-violet-500/5 p-6">
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg shadow-violet-500/5 flex flex-col flex-1">
            <div className="p-6 border-b border-white/40 flex justify-between items-center rounded-t-3xl">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">
                        Recent Orders
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Latest orders and drafts
                    </p>
                </div>
                <button
                    onClick={() => navigate('/orders')}
                    className="text-sm font-semibold text-[#6b4423] hover:text-[#573619] transition-colors"
                >
                    View All →
                </button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-slate-500">
                    <div className="animate-pulse">Loading orders...</div>
                </div>
            ) : orders.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-4">
                        <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <p className="text-lg font-medium">No orders yet</p>
                    <p className="text-sm mt-2">Create a new order to get started</p>
                </div>
            ) : (
                <>
                    {/* Desktop View: Grid Layout */}
                    <div className="hidden md:grid md:p-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {orders.map((order) => {
                            const dueDateInfo = getDueDateDisplay(order.dueDate);
                            const paymentInfo = getPaymentStatusInfo(order);
                            const statusMeta = getRecentStatusMeta(order);

                            return (
                                <div
                                    key={order._id}
                                    className="bg-white/60 border border-gray-200 shadow-sm rounded-2xl p-5 hover:shadow-lg hover:border-[#6b4423] transition-all"
                                >
                                    {/* Card Header - Order ID and Status - Clickable */}
                                    <div
                                        onClick={() => handleCardClick(order)}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-800">
                                                    #{order._id.slice(-6).toUpperCase()}
                                                </h4>
                                                <p className="text-sm text-slate-500 mt-0.5">{order.orderType}</p>
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusMeta.className}`}>
                                                {statusMeta.label}
                                            </span>
                                        </div>

                                        {/* Payment Due Alert - Prominent Position */}
                                        {paymentInfo && paymentInfo.hasPaymentDue && (
                                            <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-xl p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${paymentInfo.badgeClass}`}>
                                                        {paymentInfo.statusText}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-600 font-medium">Remaining:</span>
                                                    <span className="text-lg font-bold text-red-700">{paymentInfo.formattedAmount}</span>
                                                </div>
                                                {paymentInfo.payLaterDate && (
                                                    <div className="mt-2 pt-2 border-t border-red-200">
                                                        <span className="text-xs text-slate-600">Due: </span>
                                                        <span className="text-xs font-semibold text-red-600">
                                                            {formatDate(paymentInfo.payLaterDate)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Card Body - Customer & Details */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="overflow-hidden">
                                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Customer</p>
                                                <p className="text-sm font-semibold text-slate-800 truncate">{order.customerName}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Next Action</p>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {getNextAction(order.status, order)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Due Date - Highlighted */}
                                        <div className="mb-4 pb-4 border-b border-gray-200">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Due Date</p>
                                            <p className={`text-sm font-bold ${dueDateInfo.className}`}>
                                                {dueDateInfo.text}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions Menu */}
                                    <div className="relative flex justify-end" onClick={(e) => e.stopPropagation()}>
                                        {order.status === 'Draft' ? (
                                            <button
                                                onClick={(e) => handleDeleteDraft(e, order._id)}
                                                className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 flex items-center justify-center transition-colors"
                                                aria-label="Delete Draft"
                                                title="Delete Draft"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === order._id ? null : order._id);
                                                    }}
                                                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                                                    aria-label="Order actions"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
                                                    </svg>
                                                </button>
                                                {openMenuId === order._id && (
                                                    <div
                                                        className="absolute right-0 top-12 z-60 w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                handleSendInvoice(order);
                                                                setOpenMenuId(null);
                                                            }}
                                                            disabled={!order.customerPhone}
                                                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 disabled:text-slate-300"
                                                        >
                                                            Send Invoice
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleViewInvoice(order);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50"
                                                        >
                                                            View Invoice
                                                        </button>
                                                        {['Delivered', 'Cancelled', 'Completed', 'Order Completed'].includes(order.status) ? (
                                                            <button
                                                                onClick={() => {
                                                                    navigate(`/orders/${order._id}`);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50"
                                                            >
                                                                More Options
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    handleCancelOrder(order._id);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-50 text-red-600"
                                                            >
                                                                Cancel Order
                                                            </button>
                                                        )}
                                                        <div className="my-1 border-t border-slate-100"></div>
                                                        <button
                                                            onClick={() => {
                                                                handleRemoveFromRecent(order._id);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-50 text-red-600"
                                                        >
                                                            Remove from Recent
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile View: Compact List Layout with Swipe-to-Remove */}
                    <div className="md:hidden flex flex-col divide-y divide-gray-100 bg-white rounded-b-3xl relative">
                        {orders.filter(order => !hiddenOrderIds.has(order._id)).map((order) => {
                            const dueDateInfo = getDueDateDisplay(order.dueDate);
                            const paymentInfo = getPaymentStatusInfo(order);
                            const statusMeta = getRecentStatusMeta(order);

                            return (
                                <SwipeToRemoveOrderCard
                                    key={order._id}
                                    order={order}
                                    onRemove={handleRemoveFromRecent}
                                    onUndo={handleUndo}
                                >
                                    <div
                                        onClick={() => handleCardClick(order)}
                                        className={`flex items-center justify-between p-2 active:bg-slate-50 transition-colors cursor-pointer min-h-[60px] ${openMenuId === order._id ? 'z-[80] relative' : ''}`}
                                    >
                                        {/* Left: Customer & ID */}
                                        <div className="flex flex-col min-w-0 flex-1 pr-2">
                                            <p className="text-sm font-bold text-slate-800 truncate mb-0.5">
                                                {order.customerName}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-medium text-slate-500">
                                                    #{order._id.slice(-6).toUpperCase()}
                                                </span>
                                                {/* Payment Due Badge - Mobile */}
                                                {paymentInfo && paymentInfo.hasPaymentDue && (
                                                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${paymentInfo.badgeClass}`}>
                                                        {paymentInfo.formattedAmount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Center: Status & Due Date */}
                                        <div className="flex flex-col items-center px-1.5 shrink-0">
                                            <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold mb-0.5 whitespace-nowrap ${statusMeta.className}`}>
                                                {statusMeta.label}
                                            </span>
                                            <span className={`text-[10px] font-semibold ${dueDateInfo.className} text-center leading-tight`}>
                                                {dueDateInfo.text.replace(/ \\(.*\\)/, '')}
                                                {dueDateInfo.text.includes('overdue') && <span className="block text-[9px] font-extrabold text-red-600">Overdue</span>}
                                                {dueDateInfo.text.includes('Today') && <span className="block text-[9px] font-extrabold text-orange-600">Today</span>}
                                                {dueDateInfo.text.includes('left') && <span className="block text-[9px] font-semibold text-amber-600">{dueDateInfo.text.match(/\\d+d left/)?.[0]}</span>}
                                            </span>
                                        </div>

                                        {/* Right: Actions Menu */}
                                        <div
                                            className="pl-1.5 shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Only stop prop for action clicks, not the container
                                            }}
                                        >
                                            <div className="relative flex items-center gap-1.5">
                                                {order.customerPhone && (
                                                    <a
                                                        href={`tel:${order.customerPhone}`}
                                                        className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center hover:bg-green-200 active:scale-95 transition-all outline-none"
                                                        aria-label="Call Customer"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                    </a>
                                                )}
                                                {order.status === 'Draft' ? (
                                                    <button
                                                        onClick={(e) => handleDeleteDraft(e, order._id)}
                                                        className="w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all outline-none"
                                                        aria-label="Delete Draft"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(openMenuId === order._id ? null : order._id);
                                                            }}
                                                            className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all outline-none"
                                                            aria-label="Order actions"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
                                                            </svg>
                                                        </button>
                                                        {openMenuId === order._id && (
                                                            <div
                                                                className="absolute right-0 top-10 z-[120] w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        handleSendInvoice(order);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    disabled={!order.customerPhone}
                                                                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 disabled:text-slate-300"
                                                                >
                                                                    Send Invoice
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleViewInvoice(order);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50"
                                                                >
                                                                    View Invoice
                                                                </button>
                                                                {['Delivered', 'Cancelled', 'Completed', 'Order Completed'].includes(order.status) ? (
                                                                    <button
                                                                        onClick={() => {
                                                                            navigate(`/orders/${order._id}`);
                                                                            setOpenMenuId(null);
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50"
                                                                    >
                                                                        More Options
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            handleCancelOrder(order._id);
                                                                            setOpenMenuId(null);
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-50 text-red-600"
                                                                    >
                                                                        Cancel Order
                                                                    </button>
                                                                )}
                                                                <div className="my-1 border-t border-slate-100"></div>
                                                                <button
                                                                    onClick={() => {
                                                                        handleRemoveFromRecent(order._id);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-50 text-red-600"
                                                                >
                                                                    Remove from Recent
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </SwipeToRemoveOrderCard>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Undo Toast - Fixed to viewport bottom-left */}
            {showUndo && undoItem && ReactDOM.createPortal(
                <div className="fixed bottom-[74px] left-2 z-[9999] md:bottom-6 md:left-6 bg-slate-800/95 text-white px-3 py-2 rounded-2xl shadow-lg flex items-center gap-2 max-w-[240px] animate-slide-up">
                    <span className="text-[11px] leading-tight font-medium">
                        Removed {undoItem.customerName}'s order from Recent
                    </span>
                    <button
                        onClick={handleUndo}
                        className="px-2 py-0.5 h-6 min-w-[46px] rounded-full text-[10px] font-semibold bg-white text-slate-800 hover:bg-slate-100"
                    >
                        UNDO
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};

export default RecentOrders;
