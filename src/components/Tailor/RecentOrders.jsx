import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const RecentOrders = ({ tailorId }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingOrder, setUpdatingOrder] = useState(null);
    const [showingUpcoming, setShowingUpcoming] = useState(false);

    const fetchOrders = async () => {
        if (!tailorId) return;

        try {
            setLoading(true);
            const { data } = await axios.get(`http://localhost:5000/api/orders/${tailorId}`);
            const allOrders = data.orders || [];

            // Get today's date (ignore time component)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // PRIORITY 1 & 2: Orders due today OR overdue
            const urgentOrders = allOrders.filter(order => {
                // Exclude completed orders
                if (order.status === 'Order Completed') return false;

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
                    // Exclude completed orders
                    if (order.status === 'Order Completed') return false;

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

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            setUpdatingOrder(orderId);

            await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, {
                status: newStatus
            });

            // Refresh orders
            await fetchOrders();
        } catch (err) {
            console.error('Error updating status:', err);
            alert(err.response?.data?.message || 'Failed to update order status');
        } finally {
            setUpdatingOrder(null);
        }
    };

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
                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 orders-grid-mobile">
                    {orders.map((order, index) => {
                        const dueDateInfo = getDueDateDisplay(order.dueDate);
                        return (
                            <div
                                key={order._id}
                                className={`bg-white md:bg-white/60 ${index >= 2 ? 'hidden md:block' : ''} border border-gray-200 shadow-sm rounded-xl md:rounded-2xl p-4 md:p-5 hover:shadow-lg hover:border-[#6b4423] transition-all order-card-mobile`}
                            >
                                {/* Card Header - Order ID and Status - Clickable */}
                                <div
                                    onClick={() => handleCardClick(order)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg md:text-xl font-bold text-slate-800 order-id">
                                                #{order._id.slice(-6).toUpperCase()}
                                            </h4>
                                            <p className="text-sm text-slate-500 mt-0.5">{order.orderType}</p>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusBadge(order.status)}`}>
                                            {order.status === 'Cutting Completed' ? 'Stitching' : order.status}
                                        </span>
                                    </div>

                                    {/* Card Body - Customer & Details - Stacked on mobile */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 order-details-mobile">
                                        <div className="order-section overflow-hidden">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Customer</p>
                                            <p className="text-sm font-semibold text-slate-800 truncate">{order.customerName}</p>
                                        </div>
                                        <div className="order-section">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Next Action</p>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {getNextAction(order.status)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Due Date - Highlighted */}
                                    <div className="mb-4 pb-4 border-b border-gray-200 order-section">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Due Date</p>
                                        <p className={`text-sm font-bold ${dueDateInfo.className}`}>
                                            {dueDateInfo.text}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons - Outside clickable area - Full width on mobile */}
                                <div className="flex flex-col md:flex-row gap-2 md:gap-3 order-actions-mobile"
                                    onClick={(e) => e.stopPropagation()}>
                                    {order.status === 'Order Created' && (
                                        <button
                                            onClick={() => handleStatusUpdate(order._id, 'Cutting Completed')}
                                            disabled={updatingOrder === order._id}
                                            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {updatingOrder === order._id ? (
                                                <span>Updating...</span>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>
                                                    <span>Mark Cutting Done</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {order.status === 'Cutting Completed' && (
                                        <button
                                            onClick={() => handleStatusUpdate(order._id, 'Order Completed')}
                                            disabled={updatingOrder === order._id}
                                            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {updatingOrder === order._id ? (
                                                <span>Updating...</span>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    <span>Mark Complete</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {order.status === 'Order Completed' && (
                                        <div className="flex-1 px-4 py-2.5 bg-green-50 border border-green-300 text-green-700 text-sm font-semibold rounded-lg flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            <span>Ready for Pickup</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )
            }
        </div>
    )
}

export default RecentOrders
