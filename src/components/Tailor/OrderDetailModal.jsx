import React from 'react'

const OrderDetailModal = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
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
    const measurementsArray = order.measurements
        ? Object.entries(order.measurements)
        : [];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="bg-linear-to-r from-[#6b4423] to-[#8b5a3c] text-white p-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">Order Details</h2>
                        <p className="text-white/80 text-sm mt-1">#{order._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors text-2xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                    {/* Order Status */}
                    <div className="mb-6">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusBadge(order.status)}`}>
                            {order.status}
                        </span>
                    </div>

                    {/* Customer Information */}
                    <div className="mb-6 bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-gray-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span>👤</span>
                            Customer Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Name</p>
                                <p className="text-sm font-semibold text-slate-800">{order.customerName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Phone</p>
                                <p className="text-sm font-semibold text-slate-800">{order.customerPhone}</p>
                            </div>
                            {order.customerEmail && (
                                <div className="col-span-2">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Email</p>
                                    <p className="text-sm font-semibold text-slate-800">{order.customerEmail}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="mb-6 bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-gray-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span>📋</span>
                            Order Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Order Type</p>
                                <p className="text-sm font-semibold text-slate-800">{order.orderType}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Price</p>
                                <p className="text-sm font-semibold text-slate-800">₹{order.price.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Advance Payment</p>
                                <p className="text-sm font-semibold text-slate-800">₹{order.advancePayment.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Balance</p>
                                <p className="text-sm font-semibold text-red-600">₹{(order.price - order.advancePayment).toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Due Date</p>
                                <p className="text-sm font-semibold text-slate-800">{formatDate(order.dueDate)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Order Created</p>
                                <p className="text-sm font-semibold text-slate-800">{formatDate(order.createdAt)}</p>
                            </div>
                        </div>

                        {order.description && (
                            <div className="mt-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Description</p>
                                <p className="text-sm text-slate-700">{order.description}</p>
                            </div>
                        )}

                        {order.notes && (
                            <div className="mt-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                                <p className="text-sm text-slate-700">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Customer Measurements */}
                    <div className="bg-amber-50 rounded-2xl p-5 border-2 border-dashed border-amber-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span>📏</span>
                            Customer Measurements
                        </h3>
                        {measurementsArray.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {measurementsArray.map(([key, value]) => (
                                    <div key={key} className="bg-white rounded-lg p-3 border border-amber-200">
                                        <p className="text-xs text-amber-700 uppercase tracking-wide mb-1 font-medium">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </p>
                                        <p className="text-lg font-bold text-slate-800">{value}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <p className="text-4xl mb-2">📏</p>
                                <p className="text-sm">No measurements recorded for this order</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 p-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;
