import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardSidebar from '../../components/Tailor/DashboardSidebar';
import API_URL from '../../config/api';

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
    const [activeSection, setActiveSection] = useState(null);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [discount, setDiscount] = useState(0);
    const [finalPaymentAmount, setFinalPaymentAmount] = useState(0);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [deliveryData, setDeliveryData] = useState(null);
    const [editingMeasurements, setEditingMeasurements] = useState(false);
    const [tempOrderItems, setTempOrderItems] = useState([]);
    const [tempLegacyMeasurements, setTempLegacyMeasurements] = useState({});
    const [expandedItemIndex, setExpandedItemIndex] = useState(null);
    const [editingItemIndex, setEditingItemIndex] = useState(null);

    const handleShareInvoice = async () => {
        if (!deliveryData || !order) return;

        try {
            // Attempt native sharing (Mobile)
            if (navigator.canShare) {
                const invoiceUrl = deliveryData.invoiceImageLink || `${API_URL}/api/orders/${order._id}/invoice-jpg`;
                const invoiceRes = await axios.get(invoiceUrl, { responseType: 'blob' });
                const file = new File([invoiceRes.data], `Invoice-${order._id.slice(-6)}.png`, { type: 'image/png' });

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Invoice #${order._id.slice(-6).toUpperCase()}`
                    });
                } else {
                    throw new Error('File sharing not supported');
                }
            } else {
                throw new Error('Web Share API not supported');
            }
        } catch (shareErr) {
            console.log('Falling back to WhatsApp share:', shareErr);

            // Format phone number with country code
            let phoneNumber = order.customerPhone;

            // Remove any spaces, dashes, or special characters
            phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

            // Add +91 country code if not present
            if (!phoneNumber.startsWith('+')) {
                if (phoneNumber.startsWith('91')) {
                    phoneNumber = '+' + phoneNumber;
                } else {
                    phoneNumber = '+91' + phoneNumber;
                }
            }

            const invoiceUrl = deliveryData.invoiceImageLink || `${API_URL}/api/orders/${order._id}/invoice-jpg`;
            const message = `Thank you for your order! Here's your invoice for Order #${order._id.slice(-6).toUpperCase()}. Total Amount: ₹${order.price}. You can view your invoice here: ${invoiceUrl}`;
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

            window.open(whatsappUrl, '_blank');
        }
    };

    // Get logged-in tailor data
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            navigate('/login');
            return;
        }

        try {
            const user = JSON.parse(userInfo);
            if (user.role !== 'tailor' && user.userType !== 'tailor') {
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
                const { data } = await axios.get(`${API_URL}/api/orders/details/${orderId}`);
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

    useEffect(() => {
        if (order) {
            const initialDiscount = order.discount || 0;
            setDiscount(initialDiscount);
            setFinalPaymentAmount(Math.max(0, order.price - (order.advancePayment || 0) - initialDiscount));
        }
    }, [order]);

    // Recalculate final payment when discount changes
    useEffect(() => {
        if (order) {
            const due = Math.max(0, order.price - (order.advancePayment || 0) - (parseFloat(discount) || 0));
            setFinalPaymentAmount(due);
        }
    }, [discount, order]);

    const getPreviousStatus = (currentStatus) => {
        switch (currentStatus) {
            case 'Cutting Completed': return 'Order Created';
            case 'Order Completed': return 'Cutting Completed';
            case 'Delivered': return 'Order Completed';
            default: return null;
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!order) return;

        try {
            setUpdatingStatus(true);
            const payload = { status: newStatus };

            // Add payment details if marking as Delivered
            if (newStatus === 'Delivered') {
                payload.paymentMode = paymentMode;
                payload.finalPaymentAmount = parseFloat(finalPaymentAmount);
                payload.discount = parseFloat(discount) || 0;
            }

            const { data } = await axios.put(`${API_URL}/api/orders/${order._id}/status`, payload);

            // Handle WhatsApp Bill / Image Share
            // Handle WhatsApp Bill / Image Share (via Modal)
            if (newStatus === 'Delivered') {
                setDeliveryData({
                    invoiceImageLink: data.invoiceImageLink || `${API_URL}/api/orders/${order._id}/invoice-jpg`
                });
                setShowDeliveryModal(true);
            }

            // Refresh order data (using the returned order if valid, or refetching)
            if (data.order) {
                setOrder(data.order);
            } else {
                const refreshRes = await axios.get(`${API_URL}/api/orders/details/${orderId}`);
                setOrder(refreshRes.data.order);
            }
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
            await axios.put(`${API_URL}/api/orders/${order._id}/notes`, {
                notes: notes
            });

            // Refresh order data
            const { data } = await axios.get(`${API_URL}/api/orders/details/${orderId}`);
            setOrder(data.order);
            setEditingNotes(false);
        } catch (err) {
            console.error('Error updating notes:', err);
            alert(err.response?.data?.message || 'Failed to update notes');
        }
    };

    const handleStartEditingMeasurements = (index = null) => {
        if (order.orderItems && order.orderItems.length > 0) {
            setTempOrderItems(JSON.parse(JSON.stringify(order.orderItems)));
            if (index !== null) {
                setEditingItemIndex(index);
                setExpandedItemIndex(index);
            }
        } else if (order.measurements) {
            setTempLegacyMeasurements({ ...order.measurements });
            setEditingMeasurements(true);
        }
        setActiveSection('measurements');
    };

    const handleSaveMeasurements = async (index = null) => {
        try {
            const payload = {};
            if (order.orderItems && order.orderItems.length > 0) {
                payload.orderItems = tempOrderItems;
            } else {
                payload.measurements = tempLegacyMeasurements;
            }

            const { data } = await axios.put(`${API_URL}/api/orders/${order._id}/measurements`, payload);

            if (data.order) {
                setOrder(prev => ({
                    ...prev,
                    orderItems: data.order.orderItems,
                    measurements: data.order.measurements
                }));
            }
            if (index !== null) {
                setEditingItemIndex(null);
            } else {
                setEditingMeasurements(false);
            }
        } catch (err) {
            console.error('Error updating measurements:', err);
            alert('Failed to update measurements');
        }
    };

    const handleCancelEditingMeasurements = () => {
        setEditingMeasurements(false);
        setEditingItemIndex(null);
        setTempOrderItems([]);
        setTempLegacyMeasurements({});
    };

    const handleLegacyMeasurementChange = (key, value) => {
        setTempLegacyMeasurements(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleOrderItemMeasurementChange = (itemIndex, type, key, value) => {
        setTempOrderItems(prev => {
            const newItems = [...prev];
            if (!newItems[itemIndex][type]) newItems[itemIndex][type] = {};
            newItems[itemIndex][type] = {
                ...newItems[itemIndex][type],
                [key]: value
            };
            return newItems;
        });
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
            'Delivered': 'bg-slate-100 text-slate-700 border border-slate-300',
            'Pending': 'bg-amber-100 text-amber-700 border border-amber-300',
            'In Progress': 'bg-blue-100 text-blue-700 border border-blue-300',
            'Completed': 'bg-emerald-100 text-emerald-700 border border-emerald-300',
            'Draft': 'bg-purple-100 text-purple-700 border border-purple-300'
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
                                <svg className="w-16 h-16 mb-4 text-amber-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
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
                <div className="max-w-6xl mx-auto p-4 pt-16 pb-24 md:p-8">
                    {/* Header with Back Button */}
                    <div className="mb-4 md:mb-6 flex items-center justify-between">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/60 hover:bg-white/80 border border-white/60 rounded-lg transition-all text-slate-700 hover:text-slate-900 font-medium text-xs md:text-base"
                        >
                            <span>←</span>
                            <span className="md:hidden">Back</span>
                            <span className="hidden md:inline">Back to Dashboard</span>
                        </button>
                        <div className="text-right">
                            <h1 className="text-xl md:text-3xl font-bold text-slate-800">Order Details</h1>
                            <p className="text-xs md:text-sm text-slate-500 mt-0.5 md:mt-1">#{order._id.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>

                    {/* SECTION 1: ORDER SUMMARY (Mobile Accordion / Desktop Grid) */}

                    {/* Desktop View (Unchanged) */}
                    <div className="hidden md:block bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
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
                                <p className="text-base font-semibold text-slate-800">
                                    {order.orderItems && order.orderItems.length > 0
                                        ? order.orderItems.map(item => item.garmentType).join(', ')
                                        : order.orderType}
                                </p>
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
                            {order.discount > 0 && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Discount</p>
                                    <p className="text-base font-semibold text-blue-600">-₹{order.discount.toLocaleString('en-IN')}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Balance Due</p>
                                <p className="text-base font-semibold text-red-600">₹{Math.max(0, order.price - order.advancePayment - (order.discount || 0)).toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile View (Accordion) */}
                    <div className="md:hidden bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg mb-3 overflow-hidden transition-all duration-300">
                        {/* Header */}
                        <div
                            onClick={() => setActiveSection(activeSection === 'summary' ? null : 'summary')}
                            className="p-4 flex items-center justify-between cursor-pointer"
                        >
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Order Summary
                            </h2>
                            <svg
                                className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${activeSection === 'summary' ? 'rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>

                        {/* Collapsed Preview (Visible when CLOSED) */}
                        <div className={`px-4 pb-4 ${activeSection === 'summary' ? 'hidden' : 'block'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Order ID</p>
                                    <p className="text-sm font-semibold text-slate-800">#{order._id.slice(-8).toUpperCase()}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2 border border-red-100 flex items-center justify-between">
                                <p className="text-[10px] text-red-500 uppercase tracking-wide font-bold">Balance Due</p>
                                <p className="text-sm font-bold text-red-600">₹{Math.max(0, order.price - order.advancePayment - (order.discount || 0)).toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* Expanded Content (Visible when OPEN) */}
                        <div className={`px-4 pb-4 transition-all duration-300 ${activeSection === 'summary' ? 'block opacity-100' : 'hidden opacity-0'}`}>
                            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                                <div className="col-span-2">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Garment Type</p>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {order.orderItems && order.orderItems.length > 0
                                            ? order.orderItems.map(item => item.garmentType).join(', ')
                                            : order.orderType}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Due Date</p>
                                    <p className="text-sm font-semibold text-slate-800">{formatDate(order.dueDate)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Created</p>
                                    <p className="text-sm font-semibold text-slate-800">{formatDate(order.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Amount</p>
                                    <p className="text-sm font-semibold text-green-600">₹{order.price.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Advance</p>
                                    <p className="text-sm font-semibold text-slate-600">₹{order.advancePayment.toLocaleString('en-IN')}</p>
                                </div>
                                {order.discount > 0 && (
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Discount</p>
                                        <p className="text-sm font-semibold text-blue-600">-₹{order.discount.toLocaleString('en-IN')}</p>
                                    </div>
                                )}
                                <div className="col-span-2 bg-red-50 rounded-lg p-2 border border-red-100 mt-1">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-red-500 uppercase tracking-wide font-bold">Balance Due</p>
                                        <p className="text-base font-bold text-red-600">₹{Math.max(0, order.price - order.advancePayment - (order.discount || 0)).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: CUSTOMER DETAILS (Mobile Accordion / Desktop Grid) */}

                    {/* Desktop View (Unchanged) */}
                    <div className="hidden md:block bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Customer Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Customer Name</p>
                                <p className="text-base font-semibold text-slate-800">{order.customerName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Mobile Number</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-base font-semibold text-slate-800">{order.customerPhone}</p>
                                    <a
                                        href={`tel:${order.customerPhone}`}
                                        className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors flex items-center justify-center"
                                        title="Call Customer"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </a>
                                </div>
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

                    {/* Mobile View (Accordion) */}
                    <div className="md:hidden bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg mb-3 overflow-hidden transition-all duration-300">
                        {/* Header */}
                        <div
                            onClick={() => setActiveSection(activeSection === 'customer' ? null : 'customer')}
                            className="p-4 flex items-center justify-between cursor-pointer"
                        >
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Customer Details
                            </h2>
                            <svg
                                className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${activeSection === 'customer' ? 'rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>

                        {/* Collapsed Preview (Visible when CLOSED) */}
                        <div className={`px-4 pb-4 ${activeSection === 'customer' ? 'hidden' : 'block'}`}>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Name</p>
                                    <p className="text-sm font-semibold text-slate-800 truncate">{order.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Mobile</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-800">{order.customerPhone}</p>
                                        <a
                                            href={`tel:${order.customerPhone}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors flex items-center justify-center shrink-0"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Content (Visible when OPEN) */}
                        <div className={`px-4 pb-4 transition-all duration-300 ${activeSection === 'customer' ? 'block opacity-100' : 'hidden opacity-0'}`}>
                            <div className="space-y-3 border-t border-slate-100 pt-3">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Customer Name</p>
                                    <p className="text-sm font-semibold text-slate-800">{order.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Mobile Number</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-800">{order.customerPhone}</p>
                                        <a
                                            href={`tel:${order.customerPhone}`}
                                            className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors flex items-center justify-center shrink-0"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                                {order.customerEmail && (
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Email</p>
                                        <p className="text-sm font-semibold text-slate-800 break-all">{order.customerEmail}</p>
                                    </div>
                                )}
                                {order.customerId && (
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Customer Username</p>
                                        <p className="text-sm font-semibold text-slate-800">Linked Account</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: MEASUREMENTS */}
                    <div className={`bg-amber-50/80 backdrop-blur-xl border-2 border-dashed ${editingMeasurements ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-300'} rounded-3xl shadow-lg mb-3 md:mb-6 overflow-hidden transition-all duration-300 md:p-6`}>
                        {/* Header */}
                        <div className="p-4 md:p-0 flex items-center justify-between">
                            <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 12h20" /><path d="M6 12v-2" /><path d="M10 12v-4" /><path d="M14 12v-2" /><path d="M18 12v-4" />
                                </svg>
                                Measurements
                            </h2>
                            <div className="flex items-center gap-2">
                                {/* Only show global edit button for Legacy measurements */}
                                {(!order.orderItems || order.orderItems.length === 0) && (
                                    editingMeasurements ? (
                                        <>
                                            <button
                                                onClick={() => handleSaveMeasurements()}
                                                className="z-10 px-3 py-1.5 md:px-4 md:py-2 bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm font-medium rounded-lg transition-colors relative"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancelEditingMeasurements}
                                                className="z-10 px-3 py-1.5 md:px-4 md:py-2 bg-slate-400 hover:bg-slate-500 text-white text-xs md:text-sm font-medium rounded-lg transition-colors relative"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="z-10 px-3 py-1.5 md:px-4 md:py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs md:text-sm font-medium rounded-lg transition-colors relative"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartEditingMeasurements();
                                            }}
                                        >
                                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-4 pb-4 md:p-0 border-t border-amber-200/50 pt-4 md:border-none md:pt-0 block">
                            {/* NEW: Multi-item Order Structure */}
                            {order.orderItems && order.orderItems.length > 0 ? (
                                <div className="space-y-3">
                                    {(editingItemIndex !== null ? tempOrderItems : order.orderItems).map((item, index) => (
                                        <div key={index} className="bg-white/50 rounded-xl border border-amber-100 overflow-hidden">
                                            {/* Item Header - Accordion Toggle */}
                                            <div
                                                className="p-3 md:p-4 flex items-center justify-between cursor-pointer hover:bg-amber-50/50 transition-colors"
                                                onClick={() => setExpandedItemIndex(expandedItemIndex === index ? null : index)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">Item {index + 1}</span>
                                                    <h3 className="font-bold text-slate-800 text-sm md:text-base">{item.garmentType}</h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {expandedItemIndex === index && editingItemIndex !== index && (
                                                        <button
                                                            className="p-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStartEditingMeasurements(index);
                                                            }}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <svg
                                                        className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedItemIndex === index ? 'rotate-180' : ''}`}
                                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            {expandedItemIndex === index && (
                                                <div className="p-3 md:p-4 border-t border-amber-100 bg-white/30">

                                                    {/* Header for Edit Mode inside Item */}
                                                    {editingItemIndex === index && (
                                                        <div className="flex justify-end gap-2 mb-3">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleSaveMeasurements(index); }}
                                                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleCancelEditingMeasurements(); }}
                                                                className="px-3 py-1 bg-slate-400 hover:bg-slate-500 text-white text-xs font-medium rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Standard Measurements */}
                                                    {item.measurements && Object.keys(item.measurements).length > 0 && (
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-3">
                                                            {Object.entries(item.measurements).map(([key, value]) => (
                                                                <div key={key} className={`bg-white rounded-lg p-2 border ${editingItemIndex === index ? 'border-amber-300 ring-2 ring-amber-100' : 'border-amber-200'} shadow-sm`}>
                                                                    <p className="text-[10px] md:text-xs text-amber-700 uppercase tracking-wide mb-1 font-medium truncate">
                                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                    </p>
                                                                    {editingItemIndex === index ? (
                                                                        <input
                                                                            type="text"
                                                                            value={value}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onChange={(e) => handleOrderItemMeasurementChange(index, 'measurements', key, e.target.value)}
                                                                            className="w-full text-base font-bold text-slate-800 bg-transparent border-b border-amber-200 focus:border-amber-500 focus:outline-none"
                                                                        />
                                                                    ) : (
                                                                        <p className="text-lg md:text-xl font-bold text-slate-800">{value}</p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Extra Measurements */}
                                                    {item.extraMeasurements && Object.keys(item.extraMeasurements).length > 0 && (
                                                        <div className="mt-3">
                                                            <p className="text-xs font-semibold text-slate-500 mb-2">Extra Measurements</p>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                                {Object.entries(item.extraMeasurements).map(([key, value]) => (
                                                                    <div key={key} className={`bg-slate-50 rounded-lg p-2 border ${editingItemIndex === index ? 'border-amber-300' : 'border-slate-200'}`}>
                                                                        <p className="text-[10px] text-slate-500 uppercase font-medium">{key}</p>
                                                                        {editingItemIndex === index ? (
                                                                            <input
                                                                                type="text"
                                                                                value={value}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                onChange={(e) => handleOrderItemMeasurementChange(index, 'extraMeasurements', key, e.target.value)}
                                                                                className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-blue-500 focus:outline-none"
                                                                            />
                                                                        ) : (
                                                                            <p className="text-sm font-bold text-slate-800">{value}</p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {item.notes && (
                                                        <div className="mt-3 text-xs md:text-sm text-slate-600 bg-amber-50 p-2 rounded border border-amber-100 italic">
                                                            Note: {item.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : order.measurements && Object.keys(order.measurements).length > 0 ? (
                                // Legacy Measurements Support (Keep using global editingMeasurements for simplicity for now as fallback)
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                    {Object.entries(editingMeasurements ? tempLegacyMeasurements : order.measurements).map(([key, value]) => (
                                        <div key={key} className={`bg-white rounded-lg p-2 border ${editingMeasurements ? 'border-amber-300 ring-2 ring-amber-100' : 'border-amber-200'} shadow-sm`}>
                                            <p className="text-[10px] md:text-xs text-amber-700 uppercase tracking-wide mb-1 font-medium truncate">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </p>
                                            {editingMeasurements ? (
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => handleLegacyMeasurementChange(key, e.target.value)}
                                                    className="w-full text-base font-bold text-slate-800 bg-transparent border-b border-amber-200 focus:border-amber-500 focus:outline-none"
                                                />
                                            ) : (
                                                <p className="text-lg md:text-xl font-bold text-slate-800">{value}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 md:py-12 text-slate-500">
                                    <div className="mb-2 md:mb-3 flex justify-center text-slate-300">
                                        <svg className="w-12 h-12 md:w-16 md:h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M2 12h20" /><path d="M6 12v-2" /><path d="M10 12v-4" /><path d="M14 12v-2" /><path d="M18 12v-4" />
                                        </svg>
                                    </div>
                                    <p className="text-base md:text-lg font-medium">No measurements</p>
                                    <p className="text-xs md:text-sm mt-1">Measurements were not captured for this order</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 4: ORDER NOTES */}
                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg p-4 mb-3 md:p-6 md:mb-6">
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                            <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Notes
                            </h2>
                            {!editingNotes && (
                                <button
                                    onClick={() => setEditingNotes(true)}
                                    className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-medium rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        {editingNotes ? (
                            <div>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full p-3 md:p-4 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 min-h-[100px] md:min-h-[120px] mb-3 text-sm md:text-base"
                                    placeholder="Add notes about this order..."
                                />
                                <div className="flex gap-2 md:gap-3">
                                    <button
                                        onClick={handleNotesUpdate}
                                        className="flex-1 px-3 py-2 md:px-4 bg-green-600 hover:bg-green-700 text-white text-sm md:text-base font-medium rounded-lg transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingNotes(false);
                                            setNotes(order.notes || '');
                                        }}
                                        className="flex-1 px-3 py-2 md:px-4 bg-slate-400 hover:bg-slate-500 text-white text-sm md:text-base font-medium rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-700">
                                {order.notes ? (
                                    <p className="text-sm md:text-base leading-relaxed">{order.notes}</p>
                                ) : (
                                    <p className="text-xs md:text-base text-slate-400 italic">No notes added yet</p>
                                )}
                            </div>
                        )}
                        {order.description && (
                            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-200">
                                <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide mb-0.5 md:mb-1">Order Description</p>
                                <p className="text-sm md:text-base text-slate-700">{order.description}</p>
                            </div>
                        )}
                    </div>

                    {/* SECTION 5: ORDER ACTIONS */}
                    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg p-4 md:p-6 mb-24 md:mb-0">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Actions
                        </h2>
                        <div className="flex flex-col md:flex-row flex-wrap gap-3 md:gap-4">
                            {order.status === 'Order Created' && (
                                <button
                                    onClick={() => handleStatusUpdate('Cutting Completed')}
                                    disabled={updatingStatus}
                                    className="w-full md:flex-1 md:min-w-[200px] px-4 py-3 md:px-6 md:py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {updatingStatus ? (
                                        <span>Updating...</span>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                                            </svg>
                                            <span>Mark Cutting Done</span>
                                        </>
                                    )}
                                </button>
                            )}
                            {order.status === 'Cutting Completed' && (
                                <button
                                    onClick={() => handleStatusUpdate('Order Completed')}
                                    disabled={updatingStatus}
                                    className="w-full md:flex-1 md:min-w-[200px] px-4 py-3 md:px-6 md:py-4 bg-green-600 hover:bg-green-700 text-white text-sm md:text-base font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {updatingStatus ? (
                                        <span>Updating...</span>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Mark Order Completed</span>
                                        </>
                                    )}
                                </button>
                            )}
                            {order.status === 'Order Completed' && (
                                <div className="w-full md:flex-1 md:min-w-[200px] flex flex-col gap-3">
                                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                                        <p className="text-xs font-bold text-emerald-800 uppercase mb-2">Collect Payment</p>
                                        <div className="flex gap-2 mb-2">
                                            <div className="flex-1">
                                                <label className="block text-[10px] text-emerald-600 font-medium mb-1">Mode</label>
                                                <select
                                                    value={paymentMode}
                                                    onChange={(e) => setPaymentMode(e.target.value)}
                                                    className="w-full text-xs p-1.5 rounded border border-emerald-200 focus:outline-none focus:border-emerald-500"
                                                >
                                                    <option value="Cash">Cash</option>
                                                    <option value="UPI">UPI</option>
                                                    <option value="Card">Card</option>
                                                    <option value="Online">Online</option>
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[10px] text-emerald-600 font-medium mb-1">Discount</label>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1.5 text-xs text-slate-400">₹</span>
                                                    <input
                                                        type="number"
                                                        value={discount}
                                                        onChange={(e) => setDiscount(e.target.value)}
                                                        min="0"
                                                        className="w-full text-xs p-1.5 pl-5 rounded border border-emerald-200 focus:outline-none focus:border-emerald-500 text-slate-700"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[10px] text-emerald-600 font-medium mb-1">Final Amount</label>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1.5 text-xs text-slate-400">₹</span>
                                                    <input
                                                        type="number"
                                                        value={finalPaymentAmount}
                                                        onChange={(e) => setFinalPaymentAmount(e.target.value)}
                                                        className="w-full text-xs p-1.5 pl-5 rounded border border-emerald-200 focus:outline-none focus:border-emerald-500 font-bold text-slate-700"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleStatusUpdate('Delivered')}
                                        disabled={updatingStatus}
                                        className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {updatingStatus ? (
                                            <span>Updating...</span>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                </svg>
                                                <span>Mark Payment & Delivered</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                            {order.status === 'Delivered' && (
                                <div className="w-full md:flex-1 md:min-w-[200px] px-4 py-3 md:px-6 md:py-4 bg-slate-100 border-2 border-slate-300 text-slate-700 text-sm md:text-base font-semibold rounded-lg flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Order Delivered</span>
                                </div>
                            )}

                            <div className="flex flex-row justify-between md:flex-col md:justify-start gap-2 w-full md:w-auto">
                                {order.cuttingCompletedAt && (
                                    <div className="text-xs md:text-sm text-slate-600">
                                        <p className="font-medium inline md:block mr-1">Cutting:</p>
                                        <p className="inline md:block">{formatDate(order.cuttingCompletedAt)}</p>
                                    </div>
                                )}
                                {order.completedAt && (
                                    <div className="text-xs md:text-sm text-slate-600">
                                        <p className="font-medium inline md:block mr-1">Completed:</p>
                                        <p className="inline md:block">{formatDate(order.completedAt)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cancel Order Option */}
                        {order.status !== 'Order Completed' && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                            <div className="mt-4 pt-4 border-t border-slate-200/60 flex justify-end">
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
                                            handleStatusUpdate('Cancelled');
                                        }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors opacity-80 hover:opacity-100"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Cancel Order
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delivery Success / Share Modal */}
            {showDeliveryModal && deliveryData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-green-600 p-6 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">Order Delivered!</h3>
                            <p className="text-green-100 text-sm">Invoice generated successfully</p>
                        </div>

                        <div className="p-6">
                            <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-center">
                                {/* Preview Image or Icon */}
                                <img
                                    src={`${API_URL}/api/orders/${order._id}/invoice-jpg`}
                                    alt="Invoice Preview"
                                    className="max-h-64 object-contain shadow-md rounded-lg border border-slate-200 bg-white"
                                />
                            </div>

                            <p className="text-center text-slate-600 mb-6 text-sm">
                                Share the invoice directly with the customer on WhatsApp.
                            </p>

                            <button
                                onClick={handleShareInvoice}
                                className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 mb-3"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Share Invoice on WhatsApp
                            </button>

                            <button
                                onClick={() => setShowDeliveryModal(false)}
                                className="w-full py-3 text-slate-500 font-medium hover:text-slate-800 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetailsPage;
