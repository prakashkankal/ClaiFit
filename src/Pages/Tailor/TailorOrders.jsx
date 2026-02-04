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
                const response = await fetch(`${API_URL}/api/orders/${tailorData._id}`);

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

    // Calculate stats from orders
    const stats = {
        total: orders.length,
        orderCreated: orders.filter(o => o.status === 'Order Created').length,
        cuttingCompleted: orders.filter(o => o.status === 'Cutting Completed').length,
        orderCompleted: orders.filter(o => o.status === 'Order Completed').length,
        // Legacy statuses
        inProgress: orders.filter(o => o.status === 'In Progress').length,
        completed: orders.filter(o => o.status === 'Completed').length,
        pending: orders.filter(o => o.status === 'Pending').length,
    };

    // Filter orders by status
    const filteredOrders = selectedStatus === 'All'
        ? orders
        : orders.filter(order => order.status === selectedStatus);

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
            <main className="flex-1 lg:ml-72 p-3 pb-24 md:p-6 lg:p-8 dashboard-main-mobile min-w-0">
                <header className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 mb-1 md:mb-2">Orders</h1>
                    <p className="text-sm md:text-base text-slate-500">Manage all your customer orders</p>
                </header>

                {/* Stats Cards - Synced for Mobile & Desktop */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 md:gap-6 mb-6 md:mb-8">
                    <div className="bg-white border border-slate-200 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
                        <p className="text-slate-500 text-[10px] md:text-sm font-medium mb-0.5 md:mb-1 uppercase tracking-wider md:normal-case">Total</p>
                        <p className="text-xl md:text-3xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
                        <p className="text-slate-500 text-[10px] md:text-sm font-medium mb-0.5 md:mb-1 uppercase tracking-wider md:normal-case">Drafts</p>
                        <p className="text-xl md:text-3xl font-bold text-amber-600">{stats.orderCreated + stats.inProgress}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
                        <p className="text-slate-500 text-[10px] md:text-sm font-medium mb-0.5 md:mb-1 uppercase tracking-wider md:normal-case">Stitching</p>
                        <p className="text-xl md:text-3xl font-bold text-blue-600">{stats.cuttingCompleted}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
                        <p className="text-slate-500 text-[10px] md:text-sm font-medium mb-0.5 md:mb-1 uppercase tracking-wider md:normal-case">Ready</p>
                        <p className="text-xl md:text-3xl font-bold text-emerald-600">{stats.orderCompleted + stats.completed}</p>
                    </div>
                </div>

                {/* Status Filters - Redesigned for Mobile (Horizontal Pills) */}
                <div className="mb-6 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex gap-2 min-w-max md:flex-wrap md:min-w-0">
                        {['All', 'Order Created', 'Cutting Completed', 'Stitching', 'Order Completed', 'Delivered'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setSelectedStatus(status === 'Stitching' ? 'Cutting Completed' : status)}
                                className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${(selectedStatus === status || (status === 'Stitching' && selectedStatus === 'Cutting Completed'))
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
                <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-4 px-1">Orders</h2>

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
                                    ? 'Orders will appear here once customers place them.'
                                    : `No ${selectedStatus.toLowerCase()} orders found.`}
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
                                                    <span className="text-[10px] text-slate-400">•</span>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {formatPrice(order.price)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Center: Status & Due Date */}
                                            <div className="flex flex-col items-center min-w-[100px] px-2">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1 whitespace-nowrap ${order.status === 'Order Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    order.status === 'Cutting Completed' ? 'bg-blue-100 text-blue-700' :
                                                        order.status === 'Order Created' ? 'bg-amber-100 text-amber-700' :
                                                            order.status === 'Delivered' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                                                'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {order.status === 'Cutting Completed' ? 'Stitching' : order.status}
                                                </span>
                                                <span className={`text-xs ${dateClass} text-center`}>
                                                    {dateText.replace(/ \(.*\)/, '')}
                                                    {dateText.includes('overdue') && <span className="block text-[10px] font-extrabold text-red-600">Overdue</span>}
                                                    {dateText.includes('Today') && <span className="block text-[10px] font-extrabold text-orange-600">Today</span>}
                                                    {dateText.includes('left') && <span className="block text-[10px] font-bold text-amber-600">{dateText.match(/\d+d left/)?.[0]}</span>}
                                                </span>
                                            </div>

                                            {/* Right: Actions Menu */}
                                            <div
                                                className="pl-3 shrink-0"
                                                onClick={(e) => e.stopPropagation()}
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
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'Order Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                        order.status === 'Cutting Completed' ? 'bg-blue-100 text-blue-700' :
                                                            order.status === 'Order Created' ? 'bg-amber-100 text-amber-700' :
                                                                order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                                    order.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                                                                        order.status === 'Delivered' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                                                            order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                                                'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {order.status === 'Cutting Completed' ? 'Stitching' : order.status}
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
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
