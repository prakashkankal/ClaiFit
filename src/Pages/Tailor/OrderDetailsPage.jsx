import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardSidebar from '../../components/Tailor/DashboardSidebar';

const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [editingNotes, setEditingNotes] = useState(false);
    const [notes, setNotes] = useState('');
    const [tailorData, setTailorData] = useState(null);

    // Get logged-in tailor data
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            navigate('/login');
            return;
        }

        try {
            const user = JSON.parse(userInfo);
            if (user.userType !== 'tailor') {
                navigate('/');
                return;
            }
            setTailorData(user);
        } catch (error) {
            console.error('Error parsing user data:', error);
            navigate('/login');
        }
    }, [navigate]);

    // Fetch order details
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`http://localhost:5000/api/orders/details/${orderId}`);
                setOrder(data.order);
                setNotes(data.order.notes || '');
                setError(null);
            } catch (err) {
                console.error('Error fetching order details:', err);
                setError(err.response?.data?.message || 'Failed to load order details');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    const handleStatusUpdate = async (newStatus) => {
        if (!order) return;

        try {
            setUpdatingStatus(true);
            await axios.put(`http://localhost:5000/api/orders/${order._id}/status`, {
                status: newStatus
            });

            // Refresh order data
            const { data } = await axios.get(`http://localhost:5000/api/orders/details/${orderId}`);
            setOrder(data.order);
        } catch (err) {
            console.error('Error updating status:', err);
            alert(err.response?.data?.message || 'Failed to update order status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleNotesUpdate = async () => {
        if (!order) return;

        try {
            await axios.put(`http://localhost:5000/api/orders/${order._id}/notes`, {
                notes: notes
            });

            // Refresh order data
            const { data } = await axios.get(`http://localhost:5000/api/orders/details/${orderId}`);
            setOrder(data.order);
            setEditingNotes(false);
        } catch (err) {
            console.error('Error updating notes:', err);
            alert(err.response?.data?.message || 'Failed to update notes');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const handleUpdateTailorData = (updatedData) => {
        setTailorData(updatedData);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    // Convert measurements Map to array for display
    const measurementsArray = order?.measurements
        ? Object.entries(order.measurements)
        : [];

    // Wait for tailor data to load first
    if (!tailorData) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[#f5f5f0]">
                <div className="text-slate-600 text-lg">Loading...</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-screen">
                <DashboardSidebar
                    tailorData={tailorData}
                    onLogout={handleLogout}
                    onUpdateTailorData={handleUpdateTailorData}
                />
                <div className="flex-1 lg:ml-72 p-8 bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50">
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg p-8">
                            <div className="animate-pulse text-center text-slate-500">
                                Loading order details...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex h-screen">
                <DashboardSidebar
                    tailorData={tailorData}
                    onLogout={handleLogout}
                    onUpdateTailorData={handleUpdateTailorData}
                />
                <div className="flex-1 lg:ml-72 p-8 bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50">
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg p-8">
                            <div className="text-center">
                                <div className="text-6xl mb-4">⚠️</div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Not Found</h2>
                                <p className="text-slate-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-6 py-3 bg-[#6b4423] hover:bg-[#573619] text-white font-semibold rounded-lg transition-colors"
                                >
                                    ← Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <DashboardSidebar
                tailorData={tailorData}
                onLogout={handleLogout}
                onUpdateTailorData={handleUpdateTailorData}
            />
            <div className="flex-1 lg:ml-72 overflow-y-auto bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50">
                <div className="max-w-6xl mx-auto p-8">
                    {/* Header with Back Button */}
                    <div className="mb-6 flex items-center justify-between">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white/80 border border-white/60 rounded-lg transition-all text-slate-700 hover:text-slate-900 font-medium"
                        >
                            <span>←</span>
                            <span>Back to Dashboard</span>
                        </button>
                        <div className="text-right">
                            <h1 className="text-3xl font-bold text-slate-800">Order Details</h1>
                            <p className="text-sm text-slate-500 mt-1">#{order._id.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>

                    {/* SECTION 1: ORDER SUMMARY */}
                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span>📋</span>
                            Order Summary
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Order ID</p>
                                <p className="text-base font-semibold text-slate-800">#{order._id.slice(-8).toUpperCase()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                                <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${getStatusBadge(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Garment Type</p>
                                <p className="text-base font-semibold text-slate-800">{order.orderType}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Due Date</p>
                                <p className="text-base font-semibold text-slate-800">{formatDate(order.dueDate)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Order Created</p>
                                <p className="text-base font-semibold text-slate-800">{formatDate(order.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Amount</p>
                                <p className="text-base font-semibold text-green-600">₹{order.price.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Advance Payment</p>
                                <p className="text-base font-semibold text-slate-800">₹{order.advancePayment.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Balance Due</p>
                                <p className="text-base font-semibold text-red-600">₹{(order.price - order.advancePayment).toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: CUSTOMER DETAILS */}
                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span>👤</span>
                            Customer Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Customer Name</p>
                                <p className="text-base font-semibold text-slate-800">{order.customerName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Mobile Number</p>
                                <p className="text-base font-semibold text-slate-800">{order.customerPhone}</p>
                            </div>
                            {order.customerEmail && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Email</p>
                                    <p className="text-base font-semibold text-slate-800">{order.customerEmail}</p>
                                </div>
                            )}
                            {order.customerId && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Customer Username</p>
                                    <p className="text-base font-semibold text-slate-800">Linked Account</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: MEASUREMENTS (VERY IMPORTANT) */}
                    <div className="bg-amber-50/80 backdrop-blur-xl border-2 border-dashed border-amber-300 rounded-3xl shadow-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <span>📏</span>
                                Customer Measurements
                            </h2>
                            {measurementsArray.length > 0 && (
                                <button
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    onClick={() => alert('Edit measurements feature coming soon!')}
                                >
                                    ✏️ Edit Measurements
                                </button>
                            )}
                        </div>
                        {measurementsArray.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {measurementsArray.map(([key, value]) => (
                                    <div key={key} className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm">
                                        <p className="text-xs text-amber-700 uppercase tracking-wide mb-1 font-medium">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </p>
                                        <p className="text-xl font-bold text-slate-800">{value}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <p className="text-6xl mb-3">📏</p>
                                <p className="text-lg font-medium">No measurements recorded</p>
                                <p className="text-sm mt-2">Measurements were not captured for this order</p>
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: ORDER NOTES */}
                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <span>📝</span>
                                Order Notes
                            </h2>
                            {!editingNotes && (
                                <button
                                    onClick={() => setEditingNotes(true)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    ✏️ Edit Notes
                                </button>
                            )}
                        </div>
                        {editingNotes ? (
                            <div>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full p-4 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 min-h-[120px] mb-3"
                                    placeholder="Add notes about this order..."
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleNotesUpdate}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                                    >
                                        Save Notes
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingNotes(false);
                                            setNotes(order.notes || '');
                                        }}
                                        className="px-4 py-2 bg-slate-400 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-700">
                                {order.notes ? (
                                    <p className="text-base leading-relaxed">{order.notes}</p>
                                ) : (
                                    <p className="text-slate-400 italic">No notes added yet</p>
                                )}
                            </div>
                        )}
                        {order.description && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Order Description</p>
                                <p className="text-base text-slate-700">{order.description}</p>
                            </div>
                        )}
                    </div>

                    {/* SECTION 5: ORDER ACTIONS */}
                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span>⚡</span>
                            Order Actions
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            {order.status === 'Order Created' && (
                                <button
                                    onClick={() => handleStatusUpdate('Cutting Completed')}
                                    disabled={updatingStatus}
                                    className="flex-1 min-w-[200px] px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {updatingStatus ? (
                                        <span>Updating...</span>
                                    ) : (
                                        <>
                                            <span>✂️</span>
                                            <span>Mark Cutting Done</span>
                                        </>
                                    )}
                                </button>
                            )}
                            {order.status === 'Cutting Completed' && (
                                <button
                                    onClick={() => handleStatusUpdate('Order Completed')}
                                    disabled={updatingStatus}
                                    className="flex-1 min-w-[200px] px-6 py-4 bg-green-600 hover:bg-green-700 text-white text-base font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {updatingStatus ? (
                                        <span>Updating...</span>
                                    ) : (
                                        <>
                                            <span>✅</span>
                                            <span>Mark Order Completed</span>
                                        </>
                                    )}
                                </button>
                            )}
                            {order.status === 'Order Completed' && (
                                <div className="flex-1 min-w-[200px] px-6 py-4 bg-green-50 border-2 border-green-300 text-green-700 text-base font-semibold rounded-lg flex items-center justify-center gap-2">
                                    <span>✓</span>
                                    <span>Order Completed</span>
                                </div>
                            )}
                            {order.cuttingCompletedAt && (
                                <div className="flex-1 min-w-[200px] text-sm text-slate-600">
                                    <p className="font-medium">Cutting completed at:</p>
                                    <p>{formatDate(order.cuttingCompletedAt)}</p>
                                </div>
                            )}
                            {order.completedAt && (
                                <div className="flex-1 min-w-[200px] text-sm text-slate-600">
                                    <p className="font-medium">Order completed at:</p>
                                    <p>{formatDate(order.completedAt)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage;
