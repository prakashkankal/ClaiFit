import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../../components/Tailor/DashboardSidebar'
import API_URL from '../../config/api'

const TailorOrders = () => {
    const navigate = useNavigate();
    const [tailorData, setTailorData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedDateRange, setSelectedDateRange] = useState('all');
    const [openMenuId, setOpenMenuId] = useState(null);

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
            navigate('/login');
        }
    }, [navigate]);

    // Fetch orders from backend
    useEffect(() => {
        const fetchOrders = async () => {
            if (!tailorData?._id) return;

            try {
                setLoading(true);
                setError(null);
                // Fetch a larger dataset so status filters (like Cancelled) are accurate.
                const response = await fetch(`${API_URL}/api/orders/${tailorData._id}?limit=1000`);

                if (!response.ok) {
                    throw new Error('Failed to fetch orders');
                }

                const data = await response.json();
                setOrders(data.orders || []);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [tailorData]);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const handleUpdateTailorData = (updatedData) => {
        setTailorData(updatedData);
    };

    const isPayLaterOrder = (order) => {
        const remaining = Number(order?.remainingAmount || 0);
        const status = order?.paymentStatus;

        // Pay Later should show only orders that still have unpaid due amount.
        if (remaining <= 0 || status === 'paid') return false;

        return Boolean(order?.payLaterEnabled) ||
            status === 'scheduled' ||
            status === 'partial' ||
            Boolean(order?.payLaterDate);
    };

    const FILTER_OPTIONS = [
        'All',
        'Pay Later',
        'Manual Bill',
        'Payment Completed',
        'Order Created',
        'Cutting Completed',
        'Order Completed',
        'Cancelled',
        'Delivered'
    ];

    const DATE_RANGE_OPTIONS = [
        { label: 'All Time', value: 'all' },
        { label: 'Last 15 Days', value: '15d' },
        { label: 'Last 1 Month', value: '1m' },
        { label: 'Last 2 Months', value: '2m' },
        { label: 'Last 3 Months', value: '3m' },
        { label: 'Last 6 Months', value: '6m' },
        { label: 'Last 1 Year', value: '1y' }
    ];

    const hasAnyRemainingDue = (order) => {
        const remainingAmount = Number(order?.remainingAmount || 0);
        const payLaterAmount = Number(order?.payLaterAmount || 0);
        const total = Number(order?.price || 0);
        const advance = Number(order?.advancePayment || 0);
        const discount = Number(order?.discountAmount ?? order?.discount ?? 0);
        const currentPaid = Number(order?.currentPaymentAmount || 0);
        const computedRemaining = Math.max(0, total - advance - discount - currentPaid);
        const paymentStatus = order?.paymentStatus;

        return (
            remainingAmount > 0 ||
            payLaterAmount > 0 ||
            computedRemaining > 0 ||
            paymentStatus === 'partial' ||
            paymentStatus === 'scheduled' ||
            paymentStatus === 'unpaid'
        ) && paymentStatus !== 'paid';
    };

    const matchesFilter = (order, filter) => {
        if (filter === 'All') return true;
        if (filter === 'Pay Later') return isPayLaterOrder(order);
        if (filter === 'Manual Bill') return Boolean(order?.isManualBill);
        if (filter === 'Cancelled') return order.status === 'Cancelled' || order.status === 'Canceled';
        return order.status === filter;
    };

    const matchesDateRange = (order, selectedRange) => {
        if (selectedRange === 'all') return true;

        const orderDate = new Date(order.createdAt);
        if (Number.isNaN(orderDate.getTime())) return false;

        const now = new Date();
        let fromDate = new Date(now);

        if (selectedRange === '15d') {
            fromDate.setDate(now.getDate() - 15);
        } else if (selectedRange === '1m') {
            fromDate.setMonth(now.getMonth() - 1);
        } else if (selectedRange === '2m') {
            fromDate.setMonth(now.getMonth() - 2);
        } else if (selectedRange === '3m') {
            fromDate.setMonth(now.getMonth() - 3);
        } else if (selectedRange === '6m') {
            fromDate.setMonth(now.getMonth() - 6);
        } else if (selectedRange === '1y') {
            fromDate.setFullYear(now.getFullYear() - 1);
        }

        return orderDate >= fromDate && orderDate <= now;
    };

    // Calculate stats from orders
    const stats = {
        total: orders.length,
        orderCreated: orders.filter(o => o.status === 'Order Created').length,
        cuttingCompleted: orders.filter(o => o.status === 'Cutting Completed').length,
        paymentCompleted: orders.filter(o => o.status === 'Payment Completed').length,
        payLater: orders.filter(isPayLaterOrder).length
    };

    // Filter orders by status / payment mode
    const filteredOrders = orders.filter(
        (order) => matchesFilter(order, selectedStatus) && matchesDateRange(order, selectedDateRange)
    );

    const getOrderStatusLabel = (order) => {
        if (order?.isManualBill) return 'Manual Bill';
        if (isPayLaterOrder(order)) return 'Pay Later';
        return order.status;
    };

    const getOrderStatusBadgeClass = (order) => {
        if (order?.isManualBill) {
            return 'bg-violet-100 text-violet-700 border border-violet-200';
        }
        if (isPayLaterOrder(order)) {
            return 'bg-orange-100 text-orange-700 border border-orange-200';
        }

        switch (order.status) {
            case 'Order Created':
                return 'bg-amber-100 text-amber-700';
            case 'Cutting Completed':
                return 'bg-blue-100 text-blue-700';
            case 'Order Completed':
                return 'bg-emerald-100 text-emerald-700';
            case 'Payment Completed':
                return 'bg-indigo-100 text-indigo-700';
            case 'Delivered':
                return 'bg-slate-100 text-slate-700 border border-slate-200';
            case 'Cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format price
    const formatPrice = (price) => {
        return `₹${price.toLocaleString('en-IN')}`;
    };

    // Get shortened order ID
    const getShortenedId = (id) => {
        return `ORD-${id.slice(-6).toUpperCase()}`;
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

    const handleSendInvoice = (order) => {
        if (!order?.customerPhone) return;
        const phone = formatPhoneNumber(order.customerPhone);

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
        const phone = formatPhoneNumber(order.customerPhone);
        const message = buildTextInvoiceMessage(order);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (!tailorData) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[#f5f5f0]">
                <div className="text-slate-600 text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex bg-[#f5f5f0] text-slate-900 overflow-x-hidden">
            {/* Sidebar with Profile Modal */}
            <DashboardSidebar
                tailorData={tailorData}
                onLogout={handleLogout}
                onUpdateTailorData={handleUpdateTailorData}
            />

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 p-3 pb-22 md:p-6 lg:p-8 dashboard-main-mobile min-w-0">
                <header className="mb-4 md:mb-8 flex items-start justify-between gap-2 md:gap-3">
                    <div className="min-w-0">
                        <h1 className="text-[30px] md:text-3xl font-serif font-bold text-slate-800 leading-none mb-1">Orders</h1>
                        <p className="text-xs md:text-base text-slate-500 leading-tight [@media(max-height:760px)]:text-[11px]">Manage all your customer orders</p>
                    </div>
                    <div className="shrink-0 w-[122px] md:w-auto">
                        <label className="block text-[10px] md:text-xs font-semibold text-slate-500 mb-1 leading-tight">
                            Sort by Time
                        </label>
                        <div className="relative">
                            <select
                                value={selectedDateRange}
                                onChange={(e) => setSelectedDateRange(e.target.value)}
                                aria-label="Sort orders by time range"
                                className="h-11 md:h-14 w-full md:min-w-[168px] rounded-lg border border-slate-300 bg-white pl-2 pr-7 md:pl-3 md:pr-9 text-[8px] md:text-[8px] text-slate-800 leading-tight appearance-none outline-none focus:ring-2 focus:ring-[#6b4423]/20 focus:border-[#6b4423]"
                            >
                                {DATE_RANGE_OPTIONS.map((range) => (
                                    <option
                                        key={range.value}
                                        value={range.value}
                                        className="bg-white text-slate-800"
                                    >
                                        {range.label}
                                    </option>
                                ))}
                            </select>
                            <svg
                                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </header>

                {/* Stats Cards - Synced for Mobile & Desktop */}
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-2 md:gap-4 mb-4 md:mb-8">
                    <div className="bg-white border border-slate-200 p-2.5 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
                        <p className="text-slate-500 text-[9px] md:text-sm font-medium mb-0.5 uppercase tracking-wide leading-tight">Total</p>
                        <p className="text-lg md:text-3xl font-bold text-slate-900 leading-none">{stats.total}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-2.5 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
                        <p className="text-slate-500 text-[9px] md:text-sm font-medium mb-0.5 uppercase tracking-wide leading-tight">Order Created</p>
                        <p className="text-lg md:text-3xl font-bold text-amber-600 leading-none">{stats.orderCreated}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-2.5 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
                        <p className="text-slate-500 text-[9px] md:text-sm font-medium mb-0.5 uppercase tracking-wide leading-tight">Cutting Done</p>
                        <p className="text-lg md:text-3xl font-bold text-blue-600 leading-none">{stats.cuttingCompleted}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-2.5 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
                        <p className="text-slate-500 text-[9px] md:text-sm font-medium mb-0.5 uppercase tracking-wide leading-tight">Payment Done</p>
                        <p className="text-lg md:text-3xl font-bold text-indigo-600 leading-none">{stats.paymentCompleted}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-2.5 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
                        <p className="text-slate-500 text-[9px] md:text-sm font-medium mb-0.5 uppercase tracking-wide leading-tight">Pay Later</p>
                        <p className="text-lg md:text-3xl font-bold text-orange-600 leading-none">{stats.payLater}</p>
                    </div>
                </div>

                {/* Status Filters - Redesigned for Mobile (Horizontal Pills) */}
                <div className="mb-4 overflow-x-auto no-scrollbar pb-1">
                    <div className="flex gap-2 min-w-max md:flex-wrap md:min-w-0">
                        {FILTER_OPTIONS.map((status) => (
                            <button
                                key={status}
                                onClick={() => setSelectedStatus(status)}
                                className={`px-3 py-1.5 rounded-full text-[11px] md:text-sm font-medium transition-all whitespace-nowrap ${selectedStatus === status
                                    ? 'bg-[#6b4423] text-white shadow-md'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders Section Title */}
                <h2 className="text-xl md:text-xl font-bold text-slate-800 mb-3 px-1 leading-none">Orders</h2>

                {/* Orders Display */}
                {/* Orders Display */}
                <div className="bg-white border border-slate-200 rounded-2xl md:overflow-hidden min-h-[300px] shadow-sm">
                    <div className="hidden md:block p-6 border-b border-white/50">
                        <h2 className="text-xl font-bold text-slate-800">
                            {selectedStatus === 'All' ? 'All Orders' : `${selectedStatus} Orders`}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b4423]"></div>
                            <p className="mt-4 text-slate-600">Loading orders...</p>
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center">
                            <div className="text-red-600 text-lg mb-2 flex items-center justify-center gap-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Error
                            </div>
                            <p className="text-slate-600">{error}</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="flex justify-center mb-4">
                                <svg className="w-16 h-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <p className="text-slate-800 font-bold text-lg">No orders yet</p>
                            <p className="text-slate-500 text-sm">
                                {selectedStatus === 'All'
                                    ? `No orders found for ${(DATE_RANGE_OPTIONS.find((opt) => opt.value === selectedDateRange)?.label || 'selected range').toLowerCase()}.`
                                    : `No ${selectedStatus.toLowerCase()} orders found for ${(DATE_RANGE_OPTIONS.find((opt) => opt.value === selectedDateRange)?.label || 'selected range').toLowerCase()}.`}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile View: Compact List Layout (Dashboard Style) */}
                            <div className="md:hidden flex flex-col divide-y divide-gray-100 bg-white">
                                {filteredOrders.map((order) => {
                                    // Inline due date logic for simplicity
                                    let dateText = '-';
                                    let dateClass = 'text-slate-500';

                                    if (order.dueDate) {
                                        const today = new Date(); today.setHours(0, 0, 0, 0);
                                        const due = new Date(order.dueDate); due.setHours(0, 0, 0, 0);
                                        const diffTime = due.getTime() - today.getTime();
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                        const dateStr = new Date(order.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

                                        if (diffDays < 0) {
                                            dateText = `${dateStr} (${Math.abs(diffDays)}d overdue)`;
                                            dateClass = 'text-red-600 font-bold';
                                        } else if (diffDays === 0) {
                                            dateText = `${dateStr} (Today!)`;
                                            dateClass = 'text-orange-600 font-bold';
                                        } else if (diffDays <= 3) {
                                            dateText = `${dateStr} (${diffDays}d left)`;
                                            dateClass = 'text-amber-600 font-medium';
                                        } else {
                                            dateText = dateStr;
                                            dateClass = 'text-slate-600';
                                        }
                                    }

                                    return (
                                        <div
                                            key={order._id}
                                            onClick={() => navigate(`/orders/${order._id}`)}
                                            className="flex items-center justify-between p-2.5 active:bg-slate-50 transition-colors cursor-pointer min-h-[66px]"
                                        >
                                            {/* Left: Customer & ID */}
                                            <div className="flex flex-col min-w-0 flex-1 pr-2">
                                                <p className="text-xl font-bold text-slate-800 leading-tight break-words">
                                                    {order.customerName}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[11px] font-medium text-slate-500">
                                                        #{order._id.slice(-6).toUpperCase()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">•</span>
                                                    <span className="text-[12px] font-bold text-slate-700">
                                                        {formatPrice(order.price)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Center: Status & Due Date */}
                                            <div className="flex flex-col items-center min-w-[88px] px-1">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1 whitespace-nowrap leading-tight ${getOrderStatusBadgeClass(order)}`}>
                                                    {getOrderStatusLabel(order)}
                                                </span>
                                                <span className={`text-[11px] ${dateClass} text-center leading-tight`}>
                                                    {dateText.replace(/ \(.*\)/, '')}
                                                    {dateText.includes('overdue') && <span className="block text-[10px] font-extrabold text-red-600">Overdue</span>}
                                                    {dateText.includes('Today') && <span className="block text-[10px] font-extrabold text-orange-600">Today</span>}
                                                    {dateText.includes('left') && <span className="block text-[10px] font-bold text-amber-600">{dateText.match(/\d+d left/)?.[0]}</span>}
                                                </span>
                                            </div>

                                            {/* Right: Actions Menu */}
                                            <div
                                                className="pl-2 shrink-0"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === order._id ? null : order._id)}
                                                        className="w-9 h-9 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all outline-none"
                                                        aria-label="Order actions"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                            {/* Desktop View: Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/40">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Order ID</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Customer</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phone</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Item</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Due Date</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Amount</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map((order) => (
                                            <tr key={order._id} className="border-t border-white/30 hover:bg-white/20 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                    {getShortenedId(order._id)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-700">{order.customerName}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{order.customerPhone}</td>
                                                <td className="px-6 py-4 text-sm text-slate-700">{order.orderType}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusBadgeClass(order)}`}>
                                                        {getOrderStatusLabel(order)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {order.dueDate ? formatDate(order.dueDate) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                                    {formatPrice(order.price)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative inline-flex">
                                                        <button
                                                            onClick={() => setOpenMenuId(openMenuId === order._id ? null : order._id)}
                                                            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                                                            aria-label="Order actions"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
                                                            </svg>
                                                        </button>
                                                        {openMenuId === order._id && (
                                                            <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1">
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
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Mobile Bottom Spacer */}
                <div className="h-24 md:hidden"></div>
            </main>
        </div>
    )
}

export default TailorOrders

