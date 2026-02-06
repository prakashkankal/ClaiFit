import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardSidebar from '../../components/Tailor/DashboardSidebar';
import axios from 'axios';
import API_URL from '../../config/api';

const NewOrder = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const draftId = searchParams.get('draftId'); // Get draft ID from URL

    const [tailorData, setTailorData] = useState(null);
    const [presets, setPresets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [createdOrder, setCreatedOrder] = useState(null);
    const [invoiceInfo, setInvoiceInfo] = useState(null);
    const [invoiceLink, setInvoiceLink] = useState('');
    const [whatsappLink, setWhatsappLink] = useState('');
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [contactPickerAvailable, setContactPickerAvailable] = useState(false);

    // Customer Autocomplete State
    const [previousCustomers, setPreviousCustomers] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef(null);
    const dateInputRef = useRef(null);

    // Measurement Autofill State
    const [pastOrders, setPastOrders] = useState([]);
    const [autofillAvailable, setAutofillAvailable] = useState({}); // { itemIndex: { available: boolean, measurements: object, presetId: string } }
    const [collapsedItems, setCollapsedItems] = useState({}); // { index: boolean } true = collapsed

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

    useEffect(() => {
        setContactPickerAvailable(
            typeof navigator !== 'undefined' &&
            !!navigator?.contacts?.select
        );
    }, []);

    // Fetch presets and customers when tailorData is available
    useEffect(() => {
        if (tailorData) {
            fetchPresets();
            fetchPreviousCustomers();
            if (draftId) {
                fetchDraftOrder(draftId);
            }
        }
    }, [tailorData, draftId]);

    const fetchDraftOrder = async (id) => {
        try {
            const { data } = await axios.get(`${API_URL}/api/orders/details/${id}`);
            const draft = data.order;

            if (draft && draft.status === 'Draft') {
                // Populate form
                setCustomerInfo({
                    customerName: draft.customerName || '',
                    customerPhone: draft.customerPhone || '',
                    customerEmail: draft.customerEmail || '',
                    dueDate: draft.dueDate ? (() => {
                        const d = new Date(draft.dueDate);
                        return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
                    })() : '',
                    notes: draft.notes || '',
                    advancePayment: draft.advancePayment ? draft.advancePayment.toString() : ''
                });

                if (draft.orderItems && draft.orderItems.length > 0) {
                    const loadedItems = draft.orderItems.map(item => ({
                        garmentType: item.garmentType || '',
                        quantity: item.quantity || 1,
                        pricePerItem: item.pricePerItem ? item.pricePerItem.toString() : '',
                        selectedPresetId: item.measurementPresetId || '',
                        measurements: item.measurements || {},
                        extraMeasurements: item.extraMeasurements || {},
                        notes: item.notes || '',
                        isCustomType: !item.measurementPresetId
                    }));
                    setOrderItems(loadedItems);

                    // Helper: Re-calculate autofill availability if needed
                    // (Optional: fetch history for this customer immediately)
                    fetchCustomerHistory(draft.customerPhone);
                }
            }
        } catch (error) {
            console.error('Error fetching draft:', error);
            setError('Failed to load draft');
        }
    };

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Save draft whenever state changes




    const fetchPresets = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/presets/${tailorData._id}`);
            setPresets(data.presets);
        } catch (error) {
            console.error('Error fetching presets:', error);
        }
    };

    const fetchPreviousCustomers = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/orders/customers/${tailorData._id}`);
            setPreviousCustomers(data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    // Silently fetch customer history for autofill
    const fetchCustomerHistory = async (phone) => {
        if (!phone) return;
        try {
            // Use the new filter we added to get all orders for this customer phone
            const { data } = await axios.get(`${API_URL}/api/orders/${tailorData._id}?customerPhone=${encodeURIComponent(phone)}&limit=50`);
            setPastOrders(data.orders || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    // Check availability whenever items or pastOrders change
    useEffect(() => {
        if (pastOrders.length > 0) {
            const newAvailability = {};
            orderItems.forEach((item, index) => {
                const match = findMatchingMeasurements(item.garmentType);
                if (match) {
                    newAvailability[index] = match;
                }
            });
            setAutofillAvailable(newAvailability);
        }
    }, [orderItems, pastOrders]);

    const findMatchingMeasurements = (currentType) => {
        if (!currentType) return null;
        const normalizedType = currentType.toLowerCase().trim();

        // Find most recent order with matching type
        for (const order of pastOrders) {
            // Check legacy structure
            if (order.orderType && order.orderType.toLowerCase().includes(normalizedType)) {
                if (order.measurements && Object.keys(order.measurements).length > 0) {
                    return { measurements: order.measurements, source: `Order #${order._id.slice(-4)}` };
                }
            }
            // Check multi-item structure
            if (order.orderItems && Array.isArray(order.orderItems)) {
                const matchingItem = order.orderItems.find(i =>
                    i.garmentType && i.garmentType.toLowerCase().includes(normalizedType) &&
                    i.measurements && Object.keys(i.measurements).length > 0
                );
                if (matchingItem) {
                    return { measurements: matchingItem.measurements, source: `Order #${order._id.slice(-4)}`, presetId: matchingItem.measurementPresetId };
                }
            }
        }
        return null;
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
        setCustomerInfo(prev => ({ ...prev, [name]: value }));
        setError('');

        if (name === 'customerName') {
            if (value.length > 0) {
                const filtered = previousCustomers.filter(c =>
                    c.name.toLowerCase().includes(value.toLowerCase())
                );
                setSuggestions(filtered);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }
    };

    const handleSuggestionClick = (customer) => {
        setCustomerInfo(prev => ({
            ...prev,
            customerName: customer.name,
            customerPhone: customer.phone || prev.customerPhone,
            customerEmail: customer.email || prev.customerEmail
        }));
        setShowSuggestions(false);
        // Trigger history fetch for measurements
        fetchCustomerHistory(customer.phone);
    };

    const handlePickContact = async () => {
        // Fallback check
        if (!contactPickerAvailable) {
            setError('Contact access not supported on this device. Please enter number manually.');
            return;
        }

        try {
            // Request name and tel fields
            const props = ['name', 'tel'];
            const opts = { multiple: false };
            const contacts = await navigator.contacts.select(props, opts);

            if (!contacts || contacts.length === 0) return;

            const contact = contacts[0];

            // Extract Name
            const name = Array.isArray(contact.name) && contact.name.length > 0
                ? contact.name[0]
                : (typeof contact.name === 'string' ? contact.name : '');

            // Extract Phone Number
            const phoneNumbers = Array.isArray(contact.tel) ? contact.tel : [contact.tel];

            if (!phoneNumbers || phoneNumbers.length === 0 || !phoneNumbers[0]) {
                setError('Selected contact does not have a phone number.');
                return;
            }

            // Pick the first number as per requirement
            const tel = phoneNumbers[0];

            // Sanitize: remove all non-digits
            const digitsOnly = (tel || '').replace(/\D/g, '');

            // Normalize: use full digits (support country codes like 91...)
            const normalizedPhone = digitsOnly;

            if (normalizedPhone.length < 10) {
                setError('Selected contact has an invalid phone number format (less than 10 digits).');
                return;
            }

            setCustomerInfo(prev => ({
                ...prev,
                customerName: name || prev.customerName,
                customerPhone: normalizedPhone
            }));

            // Sync with history if it's a known number
            if (normalizedPhone) {
                fetchCustomerHistory(normalizedPhone);
            }

            setSuccess('Contact details filled successfully!');
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            // Handle cancellation gracefully
            if (err?.name === 'AbortError') return;

            console.error('Contact picker error:', err);
            setError('Unable to access contacts. Please ensure you have granted permission.');
        }
    };

    const handleAutofillMeasurements = (index) => {
        const data = autofillAvailable[index];
        if (!data) return;

        setOrderItems(prev => prev.map((item, i) => {
            if (i !== index) return item;

            // If preset ID matches one of our current presets, use it to ensure labels match
            // Otherwise just fill raw measurements
            let presetId = item.selectedPresetId;
            if (!presetId && data.presetId) {
                const presetExists = presets.find(p => p._id === data.presetId);
                if (presetExists) presetId = data.presetId;
            }

            return {
                ...item,
                selectedPresetId: presetId || item.selectedPresetId,
                measurements: { ...item.measurements, ...data.measurements }
            };
        }));

        // Clear availability to prevent re-clicking confuses user? optional. 
        // Keeping it allows re-fill if they mess up.
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
        if (presetId === 'custom') {
            setOrderItems(prev => prev.map((item, i) =>
                i === index ? {
                    ...item,
                    selectedPresetId: '',
                    garmentType: '',
                    measurements: {},
                    isCustomType: true
                } : item
            ));
            return;
        }

        const preset = presets.find(p => p._id === presetId);
        if (preset) {
            const garmentType = preset.name;

            // Check for previous measurements for this garment type
            const match = findMatchingMeasurements(garmentType);

            let initialMeasurements = {};
            if (match) {
                // Auto-fill from history
                initialMeasurements = match.measurements;
            } else {
                // Initialize empty fields based on preset
                preset.fields.forEach(field => {
                    initialMeasurements[field.name] = '';
                });
            }

            setOrderItems(prev => prev.map((item, i) =>
                i === index ? {
                    ...item,
                    selectedPresetId: presetId,
                    measurements: initialMeasurements,
                    garmentType: garmentType,
                    pricePerItem: preset.basePrice ? preset.basePrice.toString() : item.pricePerItem,
                    isCustomType: false
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

    const saveDraft = async () => {
        // Minimal validation for draft: Must have Name and Phone to identify
        if (!customerInfo.customerName.trim() || !customerInfo.customerPhone.trim()) {
            return; // Discard empty/unidentifiable drafts
        }

        try {
            // Prepare draft items (looser validation)
            const preparedItems = orderItems.map(item => ({
                garmentType: item.garmentType.trim() || 'Unspecified',
                quantity: parseInt(item.quantity) || 1,
                pricePerItem: parseFloat(item.pricePerItem) || 0,
                totalPrice: calculateItemTotal(item),
                measurementPresetId: item.selectedPresetId || undefined,
                presetName: undefined, // Let backend handle if needed, or lookup
                measurements: Object.keys(item.measurements).length > 0 ? item.measurements : undefined,
                extraMeasurements: Object.keys(item.extraMeasurements).length > 0 ? item.extraMeasurements : undefined,
                notes: item.notes.trim() || undefined
            }));

            const draftData = {
                tailorId: tailorData._id,
                customerName: customerInfo.customerName.trim(),
                customerPhone: customerInfo.customerPhone.trim(),
                customerEmail: customerInfo.customerEmail.trim() || undefined,
                dueDate: (() => {
                    // Parse if valid, else ignore for draft (Model: dueDate not required!)
                    if (!customerInfo.dueDate) return undefined;
                    const [d, m, y] = customerInfo.dueDate.split('/');
                    if (!d || !m || !y) return undefined;
                    return `${y}-${m}-${d}`;
                })(),
                notes: customerInfo.notes.trim() || undefined,
                advancePayment: customerInfo.advancePayment ? parseFloat(customerInfo.advancePayment) : 0,
                orderItems: preparedItems,
                price: calculateGrandTotal() || 0, // Ensure price is valid number for Model
                status: 'Draft'
            };

            if (draftId) {
                // Update existing draft
                await axios.put(`${API_URL}/api/orders/${draftId}`, draftData);
            } else {
                // Create new draft
                await axios.post(`${API_URL}/api/orders`, draftData);
            }
            console.log('Draft saved successfully');
        } catch (err) {
            console.error('Failed to save draft:', err);
            // We don't block navigation on draft save failure
        }
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

        // Validate phone number (allow 10-15 digits)
        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(customerInfo.customerPhone.replace(/\s+/g, ''))) {
            setError('Please enter a valid mobile number (10-15 digits)');
            return;
        }

        const totalAmount = calculateGrandTotal();
        const advanceAmount = parseFloat(customerInfo.advancePayment) || 0;
        if (advanceAmount > totalAmount) {
            setError('Advance payment cannot be greater than total amount');
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
                dueDate: (() => {
                    const [d, m, y] = customerInfo.dueDate.split('/');
                    return `${y}-${m}-${d}`;
                })(),
                notes: customerInfo.notes.trim() || undefined,
                advancePayment: customerInfo.advancePayment ? parseFloat(customerInfo.advancePayment) : 0,
                orderItems: preparedItems
            };

            console.log('Creating/Updating multi-item order:', orderData);

            let response;
            if (draftId) {
                // Update Draft -> Real Order
                // Ensure status is overwritten to Created
                // Using PUT
                response = await axios.put(`${API_URL}/api/orders/${draftId}`, {
                    ...orderData,
                    status: 'Order Created'
                });

                // Response from PUT is just the order object, wrapping it to match POST structure expected below if needed
                // But wait, the POST response returns { ...order, invoice: ..., invoiceLink: ... }
                // My PUT only returns updatedOrder.
                // I need to generate invoice info again if I use PUT.
                // OR... I can just POST a new order and delete the draft? 
                // No, I added PUT support. I should update the PUT to return invoice info too? 
                // Or I can just fetch it? 

                // Let's modify the frontend to handle the PUT response.
                // The PUT returns `updatedOrder`.
                // It does NOT return `invoice`, `whatsappLink`.
                // I might need to make a separate call or update backend PUT to return these.
                // Actually, for simplicity and robustness (invoice generation logic is in POST), 
                // let's stick to: If draft, update it using PUT, but we also want to TRIGGER invoice generation.
                // My PUT backend doesn't trigger invoice generation currently.

                // REVISION: The cleanest way without duplicating backend logic is:
                // If it's a DRAFT, DELETE IT and POST NEW.
                // Wait, user might have shared the draft ID? Unlikely.
                // Deleting draft and POSTing new guarantees a fresh Invoice # and fresh logic.
                // But wait, creating a NEW order gives a NEW ID.
                // If I want to keep the ID, I must use PUT.
                // Does the user care if ID changes? "Draft" usually implies temporary.
                // When "Confirmed", it gets a real Order ID? Or keeps Draft ID?
                // Usually Draft ID becomes Order ID.
                // So I MUST use PUT.

                // I will assume for now I don't get the invoice link immediately on PUT (unless I update backend again).
                // I will just navigate to success modal.
                // Wait, success modal needs `invoiceLink`.
                // I should update backend PUT to generate invoice if status changes to 'Order Created'.
                // But that's complicated to add now.

                // Quick fix: After PUT, call the invoice endpoint to get/ensure invoice exists? 
                // Or just use POST and delete old draft. 
                // "The draft order should be open in new order page... show as draft... create new order... draft order detail should not be visible it should be fresh order"
                // This implies conversion.

                // Let's use POST (new order) and DELETE draft.
                // This ensures clean state.

                response = await axios.post(`${API_URL}/api/orders`, orderData);
                // Delete the draft
                await axios.delete(`${API_URL}/api/orders/${draftId}`);
            } else {
                response = await axios.post(`${API_URL}/api/orders`, orderData);
            }

            console.log('Order created:', response.data);
            setCreatedOrder(response.data);
            setInvoiceInfo(response.data?.invoice || null);
            setInvoiceLink(response.data?.invoiceLink || response.data?.invoice?.link || '');
            setWhatsappLink(response.data?.whatsappLink || '');
            setSuccess('Order created successfully!');
            setShowInvoiceModal(true);

            // Clear draft

            // Keep form state for viewing invoice / resending

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

            <main className="flex-1 lg:ml-72 p-6 md:p-8 pb-32 md:pb-8 dashboard-main-mobile overflow-x-hidden">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8">
                        <div className="flex items-center gap-2 mb-1">
                            <button
                                onClick={async () => {
                                    await saveDraft();
                                    navigate('/dashboard');
                                }}
                                className="text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-2">
                                New Order
                                <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </h1>
                        </div>
                        <p className="text-slate-500">Create a new order with one or more garments</p>
                    </header>

                    <form onSubmit={handleSubmit}>
                        {/* Error/Success Messages */}


                        {/* Customer Information */}
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 mb-6">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Customer Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative" ref={suggestionRef}>
                                    <label htmlFor="customerName" className="block text-sm font-medium text-slate-700 mb-2">
                                        Customer Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="customerName"
                                        name="customerName"
                                        value={customerInfo.customerName}
                                        onChange={handleCustomerInfoChange}
                                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                        required
                                        autoComplete="off"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423] focus:border-transparent"
                                        placeholder="Enter customer name"
                                    />
                                    {/* Suggestions Dropdown */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <ul className="relative z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-2 max-h-48 overflow-y-auto">
                                            {suggestions.map((customer, index) => (
                                                <li
                                                    key={index}
                                                    onClick={() => handleSuggestionClick(customer)}
                                                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-0"
                                                >
                                                    <div className="font-bold">{customer.name}</div>
                                                    <div className="text-xs text-slate-500">{customer.phone}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="customerPhone" className="block text-sm font-medium text-slate-700 mb-2">
                                        Mobile Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-stretch group shadow-sm rounded-lg overflow-hidden">
                                        <input
                                            type="tel"
                                            id="customerPhone"
                                            name="customerPhone"
                                            value={customerInfo.customerPhone}
                                            onChange={handleCustomerInfoChange}
                                            required
                                            autoComplete="tel"
                                            className="flex-1 min-w-0 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423] focus:border-transparent transition-all z-10"
                                            placeholder="10-digit mobile number"
                                        />
                                        <button
                                            type="button"
                                            onClick={handlePickContact}
                                            title={contactPickerAvailable ? 'Pick from contacts' : 'Contact access not supported on this device'}
                                            className={`shrink-0 px-3 flex items-center justify-center gap-2 border border-l-0 border-slate-300 transition-all duration-200 ${contactPickerAvailable
                                                ? 'bg-white text-blue-600 hover:bg-blue-50 active:bg-blue-100'
                                                : 'bg-slate-50 text-slate-400 cursor-pointer'
                                                }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                            </svg>
                                            <span className="hidden sm:inline text-sm font-semibold tracking-tight">Contacts</span>
                                        </button>
                                    </div>
                                    {!contactPickerAvailable && (
                                        <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Contact list access is mobile-only. Enter manually on desktop.
                                        </p>
                                    )}
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
                                        autoComplete="off"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423] focus:border-transparent"
                                        placeholder="customer@email.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-2">
                                        Due Date <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="dueDate"
                                            name="dueDate"
                                            value={customerInfo.dueDate}
                                            onChange={(e) => {
                                                let value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
                                                if (value.length > 2) {
                                                    value = value.slice(0, 2) + '/' + value.slice(2);
                                                }
                                                if (value.length > 5) {
                                                    value = value.slice(0, 5) + '/' + value.slice(5);
                                                }
                                                // Ensure we respect the max length for a date (10 chars: DD/MM/YYYY)
                                                if (value.length > 10) value = value.slice(0, 10);

                                                setCustomerInfo(prev => ({ ...prev, dueDate: value }));
                                            }}
                                            maxLength="10"
                                            required
                                            placeholder="DD/MM/YYYY"
                                            className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423] focus:border-transparent"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => dateInputRef.current.showPicker()}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#6b4423] transition-colors p-1"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <input
                                            type="date"
                                            id="hiddenDatePicker"
                                            ref={dateInputRef}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => {
                                                const dateVal = e.target.value; // YYYY-MM-DD
                                                if (dateVal) {
                                                    const [year, month, day] = dateVal.split('-');
                                                    const formatted = `${day}/${month}/${year}`;
                                                    setCustomerInfo(prev => ({ ...prev, dueDate: formatted }));
                                                }
                                            }}
                                            className="absolute opacity-0 pointer-events-none w-0 h-0"
                                            tabIndex={-1}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-6 mb-6">
                            {orderItems.map((item, itemIndex) => {
                                const selectedPreset = presets.find(p => p._id === item.selectedPresetId);
                                const currentAutofill = autofillAvailable[itemIndex];

                                return (
                                    <div key={itemIndex} className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl transition-all duration-300 overflow-hidden">
                                        {/* Item Header - Click to Toggle */}
                                        <div
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-blue-100/50 transition-colors"
                                            onClick={() => setCollapsedItems(prev => ({ ...prev, [itemIndex]: !prev[itemIndex] }))}
                                        >
                                            <div className="flex flex-col">
                                                <h3 className="text-lg font-bold text-slate-800">
                                                    {item.garmentType || `Item #${itemIndex + 1}`}
                                                </h3>
                                                {/* Summary shown when collapsed */}
                                                {collapsedItems[itemIndex] && (
                                                    <p className="text-sm text-slate-600 font-medium mt-1">
                                                        Qty: {item.quantity} • ₹{item.pricePerItem} • Total: ₹{calculateItemTotal(item).toLocaleString('en-IN')}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {orderItems.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveItem(itemIndex);
                                                        }}
                                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Remove Item"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                )}
                                                <svg
                                                    className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${collapsedItems[itemIndex] ? '' : 'rotate-180'}`}
                                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Expanded Content */}
                                        {!collapsedItems[itemIndex] && (
                                            <div className="p-6 pt-0 border-t border-blue-200/50 mt-4">
                                                {/* Basic Item Info */}
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pt-4">
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                                            Garment Type <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            {!item.isCustomType ? (
                                                                <select
                                                                    value={item.selectedPresetId || ''}
                                                                    onChange={(e) => handlePresetChange(itemIndex, e.target.value)}
                                                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423]"
                                                                >
                                                                    <option value="" disabled>Select Type</option>
                                                                    {presets.map(preset => (
                                                                        <option key={preset._id} value={preset._id}>
                                                                            {preset.name}
                                                                        </option>
                                                                    ))}
                                                                    <option value="custom">+ Custom Type</option>
                                                                </select>
                                                            ) : (
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={item.garmentType}
                                                                        onChange={(e) => handleItemChange(itemIndex, 'garmentType', e.target.value)}
                                                                        required
                                                                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423]"
                                                                        placeholder="e.g., Shirt, Pant"
                                                                        autoFocus
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            // Revert to dropdown
                                                                            handleItemChange(itemIndex, 'isCustomType', false);
                                                                            handleItemChange(itemIndex, 'selectedPresetId', '');
                                                                            handleItemChange(itemIndex, 'garmentType', '');
                                                                        }}
                                                                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600"
                                                                        title="Back to List"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* Autofill CTA */}
                                                            {currentAutofill && item.isCustomType && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAutofillMeasurements(itemIndex)}
                                                                    className="absolute right-12 top-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-200 transition-colors flex items-center gap-1"
                                                                    title="Use measurements from previous order"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                                    Autofill available
                                                                </button>
                                                            )}
                                                        </div>
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
                                                            onWheel={(e) => e.target.blur()} // Prevent scroll change
                                                        />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-1">
                                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                                            Item Total
                                                        </label>
                                                        <div className="w-full px-4 py-2.5 bg-green-100 border border-green-300 rounded-lg font-bold text-green-700">
                                                            ₹{calculateItemTotal(item).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Measurements based on selected preset */}
                                                {selectedPreset && (
                                                    <div className="bg-white rounded-xl p-4 mb-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="text-sm font-bold text-slate-800">
                                                                Measurements ({selectedPreset.name})
                                                            </h4>
                                                            {currentAutofill && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAutofillMeasurements(itemIndex)}
                                                                    className="text-xs flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                                    Import from Previous Order
                                                                </button>
                                                            )}
                                                        </div>
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
                                        )}
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
                                        onWheel={(e) => e.target.blur()} // Prevent scroll change
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

                        {/* Mobile Spacer to prevent content from being hidden behind fixed buttons */}
                        <div className="h-44 md:hidden"></div>

                        {/* Submit Buttons */}
                        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200 z-30 flex gap-3 md:static md:bg-transparent md:border-0 md:p-0 md:justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 md:flex-none px-6 py-3 bg-linear-to-r from-[#6b4423] to-[#8b5a3c] hover:from-[#573619] hover:to-[#6b4423] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed order-2 md:order-0"
                            >
                                {loading ? 'Creating...' : 'Create Order'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {showInvoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-emerald-600 font-semibold">Invoice Ready</p>
                                <h3 className="text-lg font-bold text-slate-800">Send Invoice</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowInvoiceModal(false)}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            {createdOrder?._id && (
                                <p className="text-sm text-slate-700">
                                    Order ID: <span className="font-semibold">{createdOrder._id.toString().slice(-6).toUpperCase()}</span>
                                </p>
                            )}
                            {invoiceInfo && (
                                <p className="text-sm text-slate-700">
                                    Invoice: <span className="font-semibold">{invoiceInfo.invoiceNumber}</span>
                                </p>
                            )}
                            <p className="text-sm text-slate-600">
                                Send the text invoice directly to the customer on WhatsApp.
                            </p>
                        </div>
                        <div className="px-5 pb-5 pt-2 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => setShowInvoiceModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
                            <a
                                href={whatsappLink || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex-1 text-center px-4 py-2.5 rounded-lg font-semibold transition-colors ${whatsappLink ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-200 text-emerald-500 cursor-not-allowed'}`}
                                onClick={(e) => {
                                    if (!whatsappLink) {
                                        e.preventDefault();
                                        return;
                                    }
                                    // After sending invoice, return to dashboard
                                    setTimeout(() => {
                                        setShowInvoiceModal(false);
                                        navigate('/dashboard');
                                    }, 300);
                                }}
                            >
                                Send Invoice
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {error && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all scale-100 border border-red-100">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => setError('')}
                            className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewOrder;
