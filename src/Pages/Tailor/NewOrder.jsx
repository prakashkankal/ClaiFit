import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../../components/Tailor/DashboardSidebar';
import axios from 'axios';
import API_URL from '../../config/api';

const NewOrder = () => {
    const navigate = useNavigate();
    const [tailorData, setTailorData] = useState(null);
    const [presets, setPresets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Customer and general order info
    const [customerInfo, setCustomerInfo] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        dueDate: '',
        notes: '',
        advancePayment: ''
    });

    // Order items
    const [orderItems, setOrderItems] = useState([
        {
            garmentType: '',
            quantity: 1,
            pricePerItem: '',
            selectedPresetId: '',
            measurements: {},
            extraMeasurements: {},
            notes: ''
        }
    ]);

    useEffect(() => {
        // Get logged-in tailor data from localStorage
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

    // Fetch presets when tailor data is available
    useEffect(() => {
        if (tailorData) {
            fetchPresets();
        }
    }, [tailorData]);

    const fetchPresets = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/presets/${tailorData._id}`);
            setPresets(data.presets);
        } catch (error) {
            console.error('Error fetching presets:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const handleUpdateTailorData = (updatedData) => {
        setTailorData(updatedData);
    };

    const handleCustomerInfoChange = (e) => {
        const { name, value } = e.target;
        setCustomerInfo(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleAddItem = () => {
        setOrderItems(prev => [
            ...prev,
            {
                garmentType: '',
                quantity: 1,
                pricePerItem: '',
                selectedPresetId: '',
                measurements: {},
                extraMeasurements: {},
                notes: ''
            }
        ]);
    };

    const handleRemoveItem = (index) => {
        if (orderItems.length === 1) {
            alert('You must have at least one item');
            return;
        }
        setOrderItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        setOrderItems(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const handlePresetChange = (index, presetId) => {
        const preset = presets.find(p => p._id === presetId);
        if (preset) {
            // Initialize measurements based on preset fields
            const initialMeasurements = {};
            preset.fields.forEach(field => {
                initialMeasurements[field.name] = '';
            });

            setOrderItems(prev => prev.map((item, i) =>
                i === index ? {
                    ...item,
                    selectedPresetId: presetId,
                    measurements: initialMeasurements,
                    garmentType: item.garmentType || preset.name
                } : item
            ));
        }
    };

    const handleMeasurementChange = (itemIndex, fieldName, value) => {
        setOrderItems(prev => prev.map((item, i) =>
            i === itemIndex ? {
                ...item,
                measurements: { ...item.measurements, [fieldName]: value }
            } : item
        ));
    };

    const calculateItemTotal = (item) => {
        const pricePerItem = parseFloat(item.pricePerItem) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return pricePerItem * quantity;
    };

    const calculateGrandTotal = () => {
        return orderItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!customerInfo.customerName.trim()) {
            setError('Customer name is required');
            return;
        }
        if (!customerInfo.customerPhone.trim()) {
            setError('Mobile number is required');
            return;
        }
        if (!customerInfo.dueDate) {
            setError('Due date is required');
            return;
        }

        // Validate phone number (basic)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(customerInfo.customerPhone.replace(/\s+/g, ''))) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        // Validate order items
        for (let i = 0; i < orderItems.length; i++) {
            const item = orderItems[i];
            if (!item.garmentType.trim()) {
                setError(`Item ${i + 1}: Please enter a garment type`);
                return;
            }
            if (!item.pricePerItem || parseFloat(item.pricePerItem) <= 0) {
                setError(`Item ${i + 1}: Please enter a valid price`);
                return;
            }
        }

        try {
            setLoading(true);

            // Prepare order items for backend
            const preparedItems = orderItems.map(item => {
                const preset = presets.find(p => p._id === item.selectedPresetId);

                return {
                    garmentType: item.garmentType.trim(),
                    quantity: parseInt(item.quantity) || 1,
                    pricePerItem: parseFloat(item.pricePerItem),
                    totalPrice: calculateItemTotal(item),
                    measurementPresetId: item.selectedPresetId || undefined,
                    presetName: preset?.name || undefined,
                    measurements: Object.keys(item.measurements).length > 0 ? item.measurements : undefined,
                    extraMeasurements: Object.keys(item.extraMeasurements).length > 0 ? item.extraMeasurements : undefined,
                    notes: item.notes.trim() || undefined
                };
            });

            const orderData = {
                tailorId: tailorData._id,
                customerName: customerInfo.customerName.trim(),
                customerPhone: customerInfo.customerPhone.trim(),
                customerEmail: customerInfo.customerEmail.trim() || undefined,
                dueDate: customerInfo.dueDate,
                notes: customerInfo.notes.trim() || undefined,
                advancePayment: customerInfo.advancePayment ? parseFloat(customerInfo.advancePayment) : 0,
                orderItems: preparedItems
            };

            console.log('Creating multi-item order:', orderData);

            const response = await axios.post(`${API_URL}/api/orders`, orderData);

            console.log('Order created:', response.data);
            setSuccess('Order created successfully!');

            // Reset form
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (err) {
            console.error('Error creating order:', err);
            setError(err.response?.data?.message || 'Failed to create order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!tailorData) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[#f5f5f0]">
                <div className="text-slate-600 text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex bg-[#f5f5f0] text-slate-900">
            <DashboardSidebar
                tailorData={tailorData}
                onLogout={handleLogout}
                onUpdateTailorData={handleUpdateTailorData}
            />

            <main className="flex-1 lg:ml-72 p-6 md:p-8 dashboard-main-mobile">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <h1 className="text-3xl font-serif font-bold text-slate-800 flex items-center gap-2">
                                New Order
                                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </h1>
                        </div>
                        <p className="text-slate-500">Create a new order with one or more garments</p>
                    </header>

                    <form onSubmit={handleSubmit}>
                        {/* Error/Success Messages */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-emerald-700">
                                {success}
                            </div>
                        )}

                        {/* Customer Information */}
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 mb-6">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Customer Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="customerName" className="block text-sm font-medium text-slate-700 mb-2">
                                        Customer Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="customerName"
                                        name="customerName"
                                        value={customerInfo.customerName}
                                        onChange={handleCustomerInfoChange}
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423] focus:border-transparent"
                                        placeholder="Enter customer name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="customerPhone" className="block text-sm font-medium text-slate-700 mb-2">
                                        Mobile Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        id="customerPhone"
                                        name="customerPhone"
                                        value={customerInfo.customerPhone}
                                        onChange={handleCustomerInfoChange}
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423] focus:border-transparent"
                                        placeholder="10-digit mobile number"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="customerEmail" className="block text-sm font-medium text-slate-700 mb-2">
                                        Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        id="customerEmail"
                                        name="customerEmail"
                                        value={customerInfo.customerEmail}
                                        onChange={handleCustomerInfoChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423] focus:border-transparent"
                                        placeholder="customer@email.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-2">
                                        Due Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        id="dueDate"
                                        name="dueDate"
                                        value={customerInfo.dueDate}
                                        onChange={handleCustomerInfoChange}
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423] focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-6 mb-6">
                            {orderItems.map((item, itemIndex) => {
                                const selectedPreset = presets.find(p => p._id === item.selectedPresetId);

                                return (
                                    <div key={itemIndex} className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-slate-800">
                                                Item #{itemIndex + 1}
                                            </h3>
                                            {orderItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(itemIndex)}
                                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    Remove Item
                                                </button>
                                            )}
                                        </div>

                                        {/* Basic Item Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Garment Type <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.garmentType}
                                                    onChange={(e) => handleItemChange(itemIndex, 'garmentType', e.target.value)}
                                                    required
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423]"
                                                    placeholder="e.g., Shirt, Pant"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Quantity <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(itemIndex, 'quantity', e.target.value)}
                                                    required
                                                    min="1"
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Price per Item (₹) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={item.pricePerItem}
                                                    onChange={(e) => handleItemChange(itemIndex, 'pricePerItem', e.target.value)}
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423]"
                                                    placeholder="Enter price"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Item Total
                                                </label>
                                                <div className="w-full px-4 py-2.5 bg-green-100 border border-green-300 rounded-lg font-bold text-green-700">
                                                    ₹{calculateItemTotal(item).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Measurement Preset Selection */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-medium text-slate-700">
                                                    Measurement Preset (Optional)
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/dashboard/presets')}
                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    + Manage Presets
                                                </button>
                                            </div>
                                            <select
                                                value={item.selectedPresetId}
                                                onChange={(e) => handlePresetChange(itemIndex, e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423]"
                                            >
                                                <option value="">No preset (enter custom measurements)</option>
                                                {presets.map(preset => (
                                                    <option key={preset._id} value={preset._id}>
                                                        {preset.name} ({preset.fields.length} fields)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Measurements based on selected preset */}
                                        {selectedPreset && (
                                            <div className="bg-white rounded-xl p-4 mb-4">
                                                <h4 className="text-sm font-bold text-slate-800 mb-3">
                                                    Measurements ({selectedPreset.name})
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {selectedPreset.fields.map((field) => (
                                                        <div key={field.name}>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                                                {field.label}
                                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                                                <span className="text-slate-500 ml-1">({field.unit})</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={item.measurements[field.name] || ''}
                                                                onChange={(e) => handleMeasurementChange(itemIndex, field.name, e.target.value)}
                                                                required={field.required}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6b4423]"
                                                                placeholder={`e.g., 38`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Item Notes */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Item Notes
                                            </label>
                                            <textarea
                                                value={item.notes}
                                                onChange={(e) => handleItemChange(itemIndex, 'notes', e.target.value)}
                                                rows="2"
                                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423] resize-none"
                                                placeholder="Special instructions for this item..."
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Add Another Item Button */}
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="w-full px-6 py-4 bg-white border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-600 font-semibold rounded-xl transition-all"
                            >
                                + Add Another Garment
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-linear-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Order Summary</h3>
                            <div className="space-y-2 mb-4">
                                {orderItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-slate-600">
                                            {item.garmentType || `Item ${idx + 1}`} × {item.quantity}
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                            ₹{calculateItemTotal(item).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t-2 border-amber-300 pt-4">
                                <div className="flex justify-between items-center text-xl font-bold">
                                    <span className="text-slate-800">Grand Total</span>
                                    <span className="text-green-600">
                                        ₹{calculateGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Notes */}
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Advance Payment (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="advancePayment"
                                        value={customerInfo.advancePayment}
                                        onChange={handleCustomerInfoChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423]"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Balance Due
                                    </label>
                                    <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-700">
                                        ₹{(calculateGrandTotal() - (parseFloat(customerInfo.advancePayment) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    General Order Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={customerInfo.notes}
                                    onChange={handleCustomerInfoChange}
                                    rows="3"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423] resize-none"
                                    placeholder="Any general notes for this order..."
                                />
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 justify-end">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="px-8 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-linear-to-r from-[#6b4423] to-[#8b5a3c] hover:from-[#573619] hover:to-[#6b4423] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating Order...' : 'Create Order'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default NewOrder;
