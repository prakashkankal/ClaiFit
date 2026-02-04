import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_URL from '../../config/api'

const RecentOrders = ({ tailorId }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showingUpcoming, setShowingUpcoming] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);

    const fetchOrders = async () => {
        if (!tailorId) return;

        try {
            setLoading(true);
            const { data } = await axios.get(`${API_URL}/api/orders/${tailorId}`);
            const allOrders = data.orders || [];

            // Get today's date (ignore time component)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // PRIORITY 1 & 2: Orders due today OR overdue
            const urgentOrders = allOrders.filter(order => {
                // Exclude finished/cancelled orders
                if (order.status === 'Delivered' || order.status === 'Cancelled') return false;

                // Include if no due date (needs attention)
                if (!order.dueDate) return true;

                const dueDate = new Date(order.dueDate);
                dueDate.setHours(0, 0, 0, 0);

                // Include if due today or overdue
                return dueDate.getTime() <= today.getTime();
            });

            // Sort urgent orders: overdue first, then due today
            urgentOrders.sort((a, b) => {
                const aDate = a.dueDate ? new Date(a.dueDate) : new Date();
                const bDate = b.dueDate ? new Date(b.dueDate) : new Date();

                aDate.setHours(0, 0, 0, 0);
                bDate.setHours(0, 0, 0, 0);

                return aDate.getTime() - bDate.getTime();
            });

            // Check if we have urgent orders
            if (urgentOrders.length > 0) {
                // Show urgent orders (today + overdue)
                setOrders(urgentOrders.slice(0, 10));
                setShowingUpcoming(false);
            } else {
                // PRIORITY 3: No urgent orders - show next upcoming orders
                const upcomingOrders = allOrders.filter(order => {
                    // Exclude finished/cancelled orders
                    if (order.status === 'Delivered' || order.status === 'Cancelled') return false;

                    // Only include orders with future due dates
                    if (!order.dueDate) return false;

                    const dueDate = new Date(order.dueDate);
                    dueDate.setHours(0, 0, 0, 0);

                    // Include only future dates
                    return dueDate.getTime() > today.getTime();
                });

                // Sort by nearest due date first
                upcomingOrders.sort((a, b) => {
                    const aDate = new Date(a.dueDate);
                    const bDate = new Date(b.dueDate);

                    aDate.setHours(0, 0, 0, 0);
                    bDate.setHours(0, 0, 0, 0);

                    return aDate.getTime() - bDate.getTime();
                });

                // Show next 5 upcoming orders
                setOrders(upcomingOrders.slice(0, 5));
                setShowingUpcoming(upcomingOrders.length > 0);
            }

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
            'Completed': 'bg-emerald-100 text-emerald-700 border border-emerald-300'
        };

        return badges[status] || 'bg-slate-100 text-slate-700 border border-slate-300';
    };

    const handleCardClick = (order) => {
        navigate(`/orders/${order._id}`);
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

    if (error) {
        return (
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg shadow-violet-500/5 p-6">
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg shadow-violet-500/5 overflow-hidden flex flex-col flex-1">
            <div className="p-6 border-b border-white/40 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">
                        <span className="md:hidden">Orders needing attention</span>
                        <span className="hidden md:inline">Today's Work</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {showingUpcoming ? 'Upcoming Orders' : 'Orders needing attention'}
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
                                                <button
                                                    onClick={() => {
                                                        navigate(`/orders/${order._id}`);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50"
                                                >
                                                    More Options
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile View: Compact List Layout */}
                    <div className="md:hidden flex flex-col divide-y divide-gray-100 bg-white">
                        {orders.map((order) => {
                            const dueDateInfo = getDueDateDisplay(order.dueDate);
                            return (
                                <div
                                    key={order._id}
                                    onClick={() => handleCardClick(order)}
                                    className="flex items-center justify-between p-3 active:bg-slate-50 transition-colors cursor-pointer min-h-[72px]"
                                >
                                    {/* Left: ID & Customer */}
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
                                                    <button
                                                        onClick={() => {
                                                            navigate(`/orders/${order._id}`);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50"
                                                    >
                                                        More Options
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )
            }
        </div>
    )
}

export default RecentOrders
