import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_URL from '../../config/api'

const RecentOrders = ({ tailorId }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    const fetchOrders = async () => {
        if (!tailorId) return;

        try {
            setLoading(true);
            // Fetch recent 20 orders
            const { data } = await axios.get(`${API_URL}/api/orders/${tailorId}?limit=20`);
            const allOrders = data.orders || [];

            // Filter Drafts
            const draftOrders = allOrders.filter(o => o.status === 'Draft');
            const otherOrders = allOrders.filter(o => o.status !== 'Draft');

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

    useEffect(() => {
        fetchOrders();
    }, [tailorId]);

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

    const getNextAction = (status) => {
        switch (status) {
            case 'Order Created':
                return 'Cut Cloth';
            case 'Cutting Completed':
                return 'Stitch & Complete';
            case 'Order Completed':
                return 'Ready for Pickup';
            default:
                return '-';
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Order Created': 'bg-yellow-100 text-yellow-700 border border-yellow-300',
            'Cutting Completed': 'bg-blue-100 text-blue-700 border border-blue-300',
            'Order Completed': 'bg-green-100 text-green-700 border border-green-300',
            'Pending': 'bg-amber-100 text-amber-700 border border-amber-300',
            'In Progress': 'bg-blue-100 text-blue-700 border border-blue-300',
            'Completed': 'bg-emerald-100 text-emerald-700 border border-emerald-300',
            'Draft': 'bg-purple-100 text-purple-700 border border-purple-300',
            'Delivered': 'bg-slate-100 text-slate-700 border border-slate-300',
            'Cancelled': 'bg-red-100 text-red-700 border border-red-300'
        };

        return badges[status] || 'bg-slate-100 text-slate-700 border border-slate-300';
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

    const handleSendInvoice = (order) => {
        if (!order?.customerPhone) return;
        const phone = order.customerPhone.replace(/[^0-9]/g, '');

        if (isImageInvoiceStatus(order.status)) {
            const invoiceLink = getInvoiceImageLink(order._id);
            const message = `Hello ${order.customerName},\n\n` +
                `Your invoice image is ready.\n` +
                `View invoice: ${invoiceLink}\n\n` +
                `Thank you,\nKStitch`;
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
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

        if (!order?.customerPhone) return;
        const phone = order.customerPhone.replace(/[^0-9]/g, '');
        const message = buildTextInvoiceMessage(order);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
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
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusBadge(order.status)}`}>
                                                {order.status === 'Cutting Completed' ? 'Stitching' : order.status}
                                            </span>
                                        </div>

                                        {/* Card Body - Customer & Details */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="overflow-hidden">
                                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Customer</p>
                                                <p className="text-sm font-semibold text-slate-800 truncate">{order.customerName}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Next Action</p>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {getNextAction(order.status)}
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
                                                    onClick={() => setOpenMenuId(openMenuId === order._id ? null : order._id)}
                                                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                                                    aria-label="Order actions"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
                                                    </svg>
                                                </button>
                                                {openMenuId === order._id && (
                                                    <div className="absolute right-0 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1">
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
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile View: Compact List Layout */}
                    <div className="md:hidden flex flex-col divide-y divide-gray-100 bg-white rounded-b-3xl">
                        {orders.map((order) => {
                            const dueDateInfo = getDueDateDisplay(order.dueDate);
                            return (
                                <div
                                    key={order._id}
                                    onClick={() => handleCardClick(order)}
                                    className="flex items-center justify-between p-3 active:bg-slate-50 transition-colors cursor-pointer min-h-[72px]"
                                >
                                    {/* Left: Customer & ID */}
                                    <div className="flex flex-col min-w-0 flex-1 pr-3">
                                        <p className="text-base font-bold text-slate-800 truncate mb-0.5">
                                            {order.customerName}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-slate-500">
                                                #{order._id.slice(-6).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Center: Status & Due Date */}
                                    <div className="flex flex-col items-center min-w-[100px] px-2">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1 whitespace-nowrap ${getStatusBadge(order.status)}`}>
                                            {order.status === 'Cutting Completed' ? 'Stitching' : order.status}
                                        </span>
                                        <span className={`text-xs font-bold ${dueDateInfo.className} text-center`}>
                                            {dueDateInfo.text.replace(/ \(.*\)/, '')}
                                            {dueDateInfo.text.includes('overdue') && <span className="block text-[10px] font-extrabold text-red-600">Overdue</span>}
                                            {dueDateInfo.text.includes('Today') && <span className="block text-[10px] font-extrabold text-orange-600">Today</span>}
                                            {dueDateInfo.text.includes('left') && <span className="block text-[10px] font-bold text-amber-600">{dueDateInfo.text.match(/\d+d left/)?.[0]}</span>}
                                        </span>
                                    </div>

                                    {/* Right: Actions Menu */}
                                    <div
                                        className="pl-3 shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Only stop prop for action clicks, not the container
                                        }}
                                    >
                                        <div className="relative">
                                            {order.status === 'Draft' ? (
                                                <button
                                                    onClick={(e) => handleDeleteDraft(e, order._id)}
                                                    className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all outline-none"
                                                    aria-label="Delete Draft"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === order._id ? null : order._id)}
                                                        className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all outline-none"
                                                        aria-label="Order actions"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
                                                        </svg>
                                                    </button>
                                                    {openMenuId === order._id && (
                                                        <div className="absolute right-0 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1">
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
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default RecentOrders;
