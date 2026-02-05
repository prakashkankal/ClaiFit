import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../../components/Tailor/DashboardSidebar';
import axios from 'axios';
import API_URL from '../../config/api';

const MeasurementPresets = () => {
    const navigate = useNavigate();
    const [tailorData, setTailorData] = useState(null);
    const [presets, setPresets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPreset, setEditingPreset] = useState(null);
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [showDetailView, setShowDetailView] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [travelDirection, setTravelDirection] = useState('right');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        basePrice: '',
        fields: [
            { label: '', unit: 'inches', required: false }
        ]
    });

    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    // Generate unique ID for frontend-only keys
    const generateId = () => Math.random().toString(36).substr(2, 9);

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

    // Fetch presets
    useEffect(() => {
        if (tailorData) {
            fetchPresets();
        }
    }, [tailorData]);

    const fetchPresets = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${API_URL}/api/presets/${tailorData._id}`);
            setPresets(data.presets);
        } catch (error) {
            console.error('Error fetching presets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const handleUpdateTailorData = (updatedData) => {
        setTailorData(updatedData);
    };

    const handleAddField = () => {
        setFormData(prev => ({
            ...prev,
            fields: [...prev.fields, { _id: generateId(), label: '', unit: 'inches', required: false }]
        }));
    };

    const handleRemoveField = (index) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.filter((_, i) => i !== index)
        }));
    };

    const handleFieldChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.map((f, i) =>
                i === index ? { ...f, [field]: value } : f
            )
        }));
    };

    const handleOpenCreate = () => {
        setEditingPreset(null);
        setFormData({
            name: '',
            description: '',
            basePrice: '',
            fields: [{ _id: generateId(), label: '', unit: 'inches', required: false }]
        });
        setShowCreateModal(true);
    };

    const handleOpenEdit = (preset) => {
        setEditingPreset(preset);
        setFormData({
            name: preset.name,
            description: preset.description,
            basePrice: preset.basePrice || '',
            fields: preset.fields.map(f => ({ ...f, _id: f._id || generateId() }))
        });
        setShowCreateModal(true);
        setShowActionSheet(false);
    };

    const handleDuplicate = (preset) => {
        setEditingPreset(null);
        setFormData({
            name: `${preset.name} (Copy)`,
            description: preset.description,
            basePrice: preset.basePrice || '',
            fields: preset.fields.map(f => ({ ...f, _id: generateId(), label: f.label, unit: f.unit, required: f.required }))
        });
        setShowCreateModal(true);
        setShowActionSheet(false);
    };

    // --- Drag and Drop Handlers ---
    const [activeDragIndex, setActiveDragIndex] = useState(null);

    // Desktop Mouse Drag
    const handleDragStart = (e, index) => {
        dragItem.current = index;
        setActiveDragIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnter = (e, index) => {
        const dragIndex = dragItem.current;
        if (dragIndex === null || dragIndex === undefined || dragIndex === index) return;

        const newFields = [...formData.fields];
        const draggedItemContent = newFields[dragIndex];
        newFields.splice(dragIndex, 1);
        newFields.splice(index, 0, draggedItemContent);

        dragItem.current = index;
        setActiveDragIndex(index);
        setFormData(prev => ({ ...prev, fields: newFields }));
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        setActiveDragIndex(null);
    };

    // Mobile Touch Drag
    const handleTouchStart = (index) => {
        dragItem.current = index;
        setActiveDragIndex(index);
    };

    const handleTouchMove = (e) => {
        if (dragItem.current === null) return;
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const row = element?.closest('[data-drag-row="true"]');

        if (row) {
            const targetIndex = parseInt(row.getAttribute('data-index'));
            const dragIndex = dragItem.current;

            if (!isNaN(targetIndex) && targetIndex !== dragIndex) {
                const newFields = [...formData.fields];
                const draggedItemContent = newFields[dragIndex];
                newFields.splice(dragIndex, 1);
                newFields.splice(targetIndex, 0, draggedItemContent);

                dragItem.current = targetIndex;
                setActiveDragIndex(targetIndex);
                setFormData(prev => ({ ...prev, fields: newFields }));
            }
        }
    };

    const handleTouchEnd = () => {
        dragItem.current = null;
        setActiveDragIndex(null);
    };

    const handleSavePreset = async () => {
        try {
            // Validate
            if (!formData.name.trim()) {
                alert('Please enter a preset name');
                return;
            }

            // Auto-generate 'name' from 'label'
            const validFields = formData.fields
                .filter(f => f.label && f.label.trim())
                .map(f => ({
                    name: f.label.toLowerCase().replace(/\s+/g, ''), // e.g., "Chest Size" -> "chestsize"
                    label: f.label.trim(),
                    unit: f.unit,
                    required: f.required
                }));

            if (validFields.length === 0) {
                alert('Please add at least one valid field');
                return;
            }

            let savedPreset;
            if (editingPreset) {
                // Update existing
                const { data } = await axios.put(`${API_URL}/api/presets/${editingPreset._id}`, {
                    name: formData.name,
                    description: formData.description,
                    basePrice: Number(formData.basePrice) || 0,
                    fields: validFields
                });
                savedPreset = data.preset;

                // If we were editing, go back to detail view with updated data
                setSelectedPreset(savedPreset);
                setTravelDirection('left');
                setShowDetailView(true);
            } else {
                // Create new
                await axios.post(`${API_URL}/api/presets`, {
                    tailorId: tailorData._id,
                    name: formData.name,
                    description: formData.description,
                    basePrice: Number(formData.basePrice) || 0,
                    fields: validFields
                });
            }

            setShowCreateModal(false);
            fetchPresets();
        } catch (error) {
            console.error('Error saving preset:', error);
            alert(error.response?.data?.message || 'Failed to save preset');
        }
    };

    const handleDeletePreset = async () => {
        try {
            await axios.delete(`${API_URL}/api/presets/${selectedPreset._id}`);
            setShowDeleteConfirm(false);
            fetchPresets();
        } catch (error) {
            console.error('Error deleting preset:', error);
            alert('Failed to delete preset');
        }
    };

    const handlePresetClick = (preset) => {
        setSelectedPreset(preset);
        setTravelDirection('right');
        setShowDetailView(true);
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

            <main className="flex-1 lg:ml-72 dashboard-main-mobile min-w-0 pb-32 lg:pb-8">
                {/* Header Spacer for Mobile */}
                <div className="lg:hidden h-4"></div>

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <header className="mb-4 lg:mb-8">
                        <div className="flex items-center gap-2 mb-1">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-2">
                                Measurement Presets
                                <span className="text-2xl">📏</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 text-sm md:text-base">Manage measurement templates for your garments</p>
                    </header>

                    {/* Desktop Create Button (Hidden on Mobile as we have FAB) */}
                    <div className="hidden lg:flex justify-end -mt-16 mb-8">
                        <button
                            onClick={handleOpenCreate}
                            className="px-6 py-3 bg-linear-to-r from-[#6b4423] to-[#8b5a3c] hover:from-[#573619] hover:to-[#6b4423] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            + Create Preset
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading presets...</div>
                ) : presets.length === 0 ? (
                    <div className="max-w-7xl mx-auto px-4 lg:px-8">
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
                            <div className="text-6xl mb-4">📏</div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No presets yet</h3>
                            <p className="text-slate-600 mb-6">Create your first measurement preset to streamline order creation</p>
                            <button
                                onClick={handleOpenCreate}
                                className="px-6 py-3 bg-[#6b4423] hover:bg-[#573619] text-white font-semibold rounded-lg transition-colors"
                            >
                                Create Your First Preset
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {presets.map(preset => (
                                <button
                                    key={preset._id}
                                    onClick={() => handlePresetClick(preset)}
                                    className="group relative flex flex-col items-start w-full bg-white rounded-2xl p-4 text-left border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                                >
                                    {/* Decorative Background Gradient */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-bl-full pointer-events-none" />

                                    {/* Header Section */}
                                    <div className="w-full flex items-start justify-between mb-2 relative z-10">
                                        <div className="w-10 h-10 bg-orange-50 text-[#6b4423] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                                            {preset.name.toLowerCase().includes('shirt') ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> // Placeholder for generic garment
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> // Ruler/Tape
                                            )}
                                        </div>
                                        {preset.isDefault ? (
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-blue-100">
                                                Default
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-slate-100 group-hover:bg-white transition-colors">
                                                Custom
                                            </span>
                                        )}
                                    </div>

                                    {/* Text Content */}
                                    <div className="mb-2 relative z-10 w-full">
                                        <h3 className="text-base font-bold text-slate-800 mb-0.5 group-hover:text-[#6b4423] transition-colors line-clamp-1">
                                            {preset.name}
                                        </h3>
                                        {preset.description && (
                                            <p className="text-xs text-slate-500 line-clamp-2">
                                                {preset.description}
                                            </p>
                                        )}
                                        {preset.basePrice > 0 && (
                                            <div className="mt-1 inline-flex items-center px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-100">
                                                ₹{preset.basePrice} Base Price
                                            </div>
                                        )}
                                    </div>

                                    {/* Fields Summary */}
                                    <div className="w-full mt-auto pt-3 border-t border-slate-50 relative z-10">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {preset.fields.length} Measurements
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 h-6 overflow-hidden">
                                            {preset.fields.slice(0, 3).map((field, i) => (
                                                <span key={i} className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[10px] font-semibold text-slate-600">
                                                    {field.label}
                                                </span>
                                            ))}
                                            {preset.fields.length > 3 && (
                                                <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[10px] font-semibold text-slate-500">
                                                    +{preset.fields.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mobile FAB - Create Preset */}
                <button
                    onClick={handleOpenCreate}
                    className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-[#6b4423] hover:bg-[#573619] text-white rounded-full shadow-lg flex items-center justify-center z-20 active:scale-95 transition-all"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>

                {/* Read-Only Detail View Modal */}
                {showDetailView && selectedPreset && (
                    <div className={`fixed inset-0 bg-[#f5f5f0] z-50 flex flex-col overflow-hidden ${travelDirection === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right'}`}>
                        {/* Header */}
                        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
                            <button
                                onClick={() => setShowDetailView(false)}
                                className="p-2 -ml-2 text-slate-700 active:bg-slate-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h2 className="text-lg font-bold text-slate-800">Preset Details</h2>
                            <button
                                onClick={() => {
                                    setShowDetailView(false);
                                    setTravelDirection('right');
                                    handleOpenEdit(selectedPreset);
                                }}
                                className="text-[#6b4423] font-semibold text-sm"
                            >
                                Edit
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8">
                            <div className="max-w-2xl mx-auto space-y-6">
                                {/* Header Card */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h1 className="text-2xl font-bold text-slate-900 mb-2">{selectedPreset.name}</h1>
                                            {selectedPreset.description && (
                                                <p className="text-slate-600 mb-3 leading-relaxed">{selectedPreset.description}</p>
                                            )}
                                            {selectedPreset.basePrice > 0 && (
                                                <div className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 font-bold rounded-lg border border-green-100 mb-2">
                                                    Base Price: ₹{selectedPreset.basePrice}
                                                </div>
                                            )}
                                        </div>
                                        {selectedPreset.isDefault && (
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-4 text-xs text-slate-500 font-medium uppercase tracking-widest border-t border-gray-100 pt-4">
                                        <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            {selectedPreset.fields.length} Fields
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowDetailView(false);
                                                setShowDeleteConfirm(true);
                                            }}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Delete Preset"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Fields List */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Measurements List</h3>
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                                        {selectedPreset.fields.map((field, idx) => (
                                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-slate-300 font-bold text-sm w-4">{idx + 1}</span>
                                                    <div>
                                                        <p className="text-base font-bold text-slate-800">{field.label}</p>
                                                        <p className="text-xs text-slate-500 uppercase font-medium">{field.unit === 'any' ? 'Any Unit' : field.unit}</p>
                                                    </div>
                                                </div>
                                                {field.required && (
                                                    <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-full">
                                                        Required
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions Footer for Mobile */}
                                <div className="pt-4 pb-8 space-y-3">
                                    <button
                                        onClick={() => {
                                            setShowDetailView(false);
                                            handleDuplicate(selectedPreset);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl active:bg-slate-50 shadow-sm"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        Duplicate Preset
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowDetailView(false);
                                            setShowDeleteConfirm(true);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 font-bold rounded-xl active:bg-red-100 border border-red-100"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Delete Preset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && selectedPreset && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Delete Preset?</h3>
                            <p className="text-sm text-slate-600 text-center mb-6">
                                Are you sure you want to delete "<strong>{selectedPreset.name}</strong>"? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeletePreset}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create/Edit Section */}
                {showCreateModal && (
                    <>
                        {/* MOBILE: Full-screen Edit Page */}
                        <div className={`lg:hidden fixed inset-0 bg-[#f5f5f0] z-50 flex flex-col overflow-hidden ${travelDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                            {/* Sticky App Bar */}
                            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm z-20">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            if (editingPreset) {
                                                setTravelDirection('left');
                                                setShowDetailView(true);
                                            }
                                        }}
                                        className="p-2 -ml-2 text-slate-500 hover:text-slate-800 active:bg-slate-100 rounded-full transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                                        {editingPreset ? 'Edit Preset' : 'New Preset'}
                                    </h2>
                                </div>
                                <button
                                    onClick={handleSavePreset}
                                    className="px-5 py-2 bg-[#6b4423] hover:bg-[#5a391d] text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-900/10 active:scale-95 transition-all"
                                >
                                    Save
                                </button>
                            </div>

                            {/* Scrollable Form Content */}
                            <div className="flex-1 overflow-y-auto pb-32 bg-[#f8f9fa]">
                                {/* Basic Info Section */}
                                <div className="p-4 space-y-6">
                                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Preset Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6b4423]/20 focus:border-[#6b4423] transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
                                                placeholder="e.g. Shirt, Suit, Pant"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6b4423]/20 focus:border-[#6b4423] transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400 resize-none"
                                                rows="2"
                                                placeholder="Short details about this template..."
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Base Price (₹)</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <span className="text-slate-400 font-bold">₹</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    value={formData.basePrice}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                                                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6b4423]/20 focus:border-[#6b4423] transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Measurement Fields List */}
                                {/* Measurement Fields List */}
                                <div className="mt-2 px-4">
                                    <div className="mb-3 flex items-end justify-between px-1">
                                        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Measurement Fields</h3>
                                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{formData.fields.length} Fields</span>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.fields.map((field, index) => {
                                            const isExpanded = selectedPreset?.expandedIndex === index;
                                            return (
                                                <div
                                                    key={field._id || index}
                                                    className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-[#6b4423] ring-1 ring-[#6b4423]/10 shadow-lg' : 'border-slate-100 shadow-sm'
                                                        } ${activeDragIndex === index ? 'opacity-50 border-dashed border-amber-400 scale-95' : ''}`}
                                                    draggable={true}
                                                    onDragStart={(e) => handleDragStart(e, index)}
                                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                                    onDragEnd={handleDragEnd}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    data-drag-row="true"
                                                    data-index={index}
                                                >
                                                    {/* Row Container */}
                                                    <div className="flex w-full items-stretch">
                                                        {/* Drag Handle */}
                                                        <div
                                                            className={`w-10 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none ${isExpanded ? 'bg-orange-50/50' : 'bg-slate-50'}`}
                                                            onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(index); }}
                                                            onTouchMove={handleTouchMove}
                                                            onTouchEnd={handleTouchEnd}
                                                        >
                                                            <div className="flex flex-col gap-0.5 opacity-30">
                                                                <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                                                                <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                                                                <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                                                            </div>
                                                        </div>

                                                        {/* Main Content Button */}
                                                        <button
                                                            onClick={() => setSelectedPreset(prev => ({ ...prev, expandedIndex: isExpanded ? -1 : index }))}
                                                            className="flex-1 px-4 py-4 flex items-center justify-between text-left transition-colors bg-white hover:bg-slate-50/50"
                                                        >
                                                            <div className="min-w-0 pr-4">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[10px] font-bold text-slate-300">#{index + 1}</span>
                                                                    {field.required && (
                                                                        <span className="px-1.5 py-0.5 rounded-[4px] bg-red-50 text-red-600 text-[9px] font-bold uppercase tracking-wider leading-none">
                                                                            Req
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className={`text-sm font-bold truncate ${field.label ? 'text-slate-800' : 'text-slate-300 italic'}`}>
                                                                    {field.label || 'Untitled Field'}
                                                                </p>
                                                                {field.unit && (
                                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                                                                        {field.unit}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-orange-50 text-[#6b4423] rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </button>
                                                    </div>

                                                    {/* Inline Editor (Expanded) */}
                                                    {isExpanded && (
                                                        <div className="px-4 pb-4 pt-2 space-y-4 animate-slide-down bg-white border-t border-slate-100">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="col-span-2 space-y-1.5">
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Label</label>
                                                                    <input
                                                                        type="text"
                                                                        value={field.label}
                                                                        onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                                                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#6b4423]/20 focus:border-[#6b4423] transition-all outline-none"
                                                                        placeholder="e.g. Chest"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Unit</label>
                                                                    <select
                                                                        value={field.unit}
                                                                        onChange={(e) => handleFieldChange(index, 'unit', e.target.value)}
                                                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#6b4423]/20 focus:border-[#6b4423] transition-all outline-none appearance-none"
                                                                    >
                                                                        <option value="inches">Inches</option>
                                                                        <option value="cm">CM</option>
                                                                        <option value="any">Any</option>
                                                                    </select>
                                                                </div>
                                                                <div className="flex items-center justify-between px-1 pt-6">
                                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={field.required}
                                                                            onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                                                                            className="w-5 h-5 accent-[#6b4423] rounded-md cursor-pointer"
                                                                        />
                                                                        <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Required Field</span>
                                                                    </label>
                                                                </div>
                                                            </div>

                                                            {/* Mobile Reorder Buttons */}
                                                            <div className="flex items-center gap-2 lg:hidden pt-2">
                                                                <button
                                                                    onClick={() => {
                                                                        if (index === 0) return;
                                                                        const newFields = [...formData.fields];
                                                                        [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
                                                                        setFormData(prev => ({ ...prev, fields: newFields }));
                                                                        setSelectedPreset(prev => ({ ...prev, expandedIndex: index - 1 }));
                                                                    }}
                                                                    disabled={index === 0}
                                                                    className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed active:bg-slate-100"
                                                                >
                                                                    Move Up
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (index === formData.fields.length - 1) return;
                                                                        const newFields = [...formData.fields];
                                                                        [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
                                                                        setFormData(prev => ({ ...prev, fields: newFields }));
                                                                        setSelectedPreset(prev => ({ ...prev, expandedIndex: index + 1 }));
                                                                    }}
                                                                    disabled={index === formData.fields.length - 1}
                                                                    className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed active:bg-slate-100"
                                                                >
                                                                    Move Down
                                                                </button>
                                                            </div>

                                                            <button
                                                                onClick={() => handleRemoveField(index)}
                                                                className="w-full flex items-center justify-center gap-2 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors mt-2"
                                                            >
                                                                <span className="text-xs font-bold uppercase tracking-widest">Remove Field</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>


                                {/* Danger Zone */}
                                {editingPreset && !editingPreset.isDefault && (
                                    <div className="mt-10 mb-20 px-4">
                                        <button
                                            onClick={() => {
                                                setSelectedPreset(editingPreset);
                                                setShowDeleteConfirm(true);
                                            }}
                                            className="w-full py-4 text-red-600 font-bold text-sm bg-red-50 rounded-xl transition-colors active:bg-red-100"
                                        >
                                            Delete This Preset
                                        </button>
                                        <p className="text-center text-[10px] text-slate-400 mt-3 px-6">
                                            This will permanently remove this template from your library. This action cannot be undone.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Floating Add Button for Measurements */}
                            <button
                                onClick={() => {
                                    handleAddField();
                                    setSelectedPreset(prev => ({ ...prev, expandedIndex: formData.fields.length }));
                                }}
                                className="fixed bottom-6 right-6 px-6 py-4 bg-[#6b4423] hover:bg-[#5a391d] text-white rounded-full shadow-2xl flex items-center gap-3 z-20 active:scale-95 transition-all group"
                            >
                                <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="font-bold text-sm tracking-wide">Add Field</span>
                            </button>
                        </div>

                        {/* DESKTOP: Traditional Modal */}
                        <div className="hidden lg:flex fixed inset-0 bg-black/60 backdrop-blur-sm items-center justify-center p-4 z-50">
                            <div className="bg-[#f8f9fa] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/20">
                                {/* Header */}
                                <div className="px-8 py-6 bg-white border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                                            {editingPreset ? 'Edit Preset' : 'New Preset'}
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1">Configure your measurement template</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            if (editingPreset) {
                                                setTravelDirection('left');
                                                setShowDetailView(true);
                                            }
                                        }}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
                                    {/* Basic Info */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="col-span-2 space-y-2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Preset Name <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6b4423]/20 focus:border-[#6b4423] transition-all font-medium text-slate-800 placeholder:text-slate-400"
                                                    placeholder="e.g. Shirt, Suit, Kurta"
                                                />
                                            </div>

                                            <div className="col-span-2 space-y-2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Description</label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6b4423]/20 focus:border-[#6b4423] transition-all font-medium text-slate-800 placeholder:text-slate-400 resize-none"
                                                    rows="2"
                                                    placeholder="Optional details about this preset..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Base Price (₹)</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <span className="text-slate-400 font-bold">₹</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={formData.basePrice}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                                                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6b4423]/20 focus:border-[#6b4423] transition-all font-medium text-slate-800 placeholder:text-slate-400"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Measurements */}
                                    <div className="space-y-4">
                                        <div className="flex items-end justify-between px-1">
                                            <div>
                                                <h3 className="text-base font-bold text-slate-800">Fields</h3>
                                                <p className="text-xs text-slate-400 font-medium mt-0.5">Define the measurements needed</p>
                                            </div>
                                            <button
                                                onClick={handleAddField}
                                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                                            >
                                                + Add Field
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {formData.fields.map((field, index) => (
                                                <div
                                                    key={index}
                                                    className="group flex gap-3 items-start bg-white p-2 pr-3 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
                                                    draggable={true}
                                                    onDragStart={(e) => handleDragStart(e, index)}
                                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                                    onDragEnd={handleDragEnd}
                                                    onDragOver={(e) => e.preventDefault()}
                                                >
                                                    {/* Desktop Drag Handle */}
                                                    <div className="mt-3 cursor-grab text-slate-300 hover:text-slate-500 px-2">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                                                    </div>

                                                    <div className="flex-1 grid grid-cols-12 gap-3">
                                                        <div className="col-span-5">
                                                            <input
                                                                type="text"
                                                                value={field.label}
                                                                onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                                                                className="w-full px-3 py-2.5 bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 rounded-lg text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-[#6b4423]/10"
                                                                placeholder="Label (e.g. Chest)"
                                                            />
                                                        </div>
                                                        <div className="col-span-4">
                                                            <select
                                                                value={field.unit}
                                                                onChange={(e) => handleFieldChange(index, 'unit', e.target.value)}
                                                                className="w-full px-3 py-2.5 bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 rounded-lg text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-[#6b4423]/10 appearance-none"
                                                            >
                                                                <option value="inches">Inches</option>
                                                                <option value="cm">cm</option>
                                                                <option value="any">Any Unit</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-span-3 flex items-center">
                                                            <label className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={field.required}
                                                                    onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                                                                    className="w-4 h-4 accent-[#6b4423] rounded cursor-pointer"
                                                                />
                                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Req</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemoveField(index)}
                                                        className="mt-1.5 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove field"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-between items-center">
                                    {editingPreset && (
                                        <button
                                            onClick={() => {
                                                setShowCreateModal(false);
                                                setShowDeleteConfirm(true);
                                                setSelectedPreset(editingPreset);
                                            }}
                                            className="text-red-500 font-bold text-sm hover:underline"
                                        >
                                            Delete Preset
                                        </button>
                                    )}
                                    <div className="flex gap-3 ml-auto">
                                        <button
                                            onClick={() => {
                                                setShowCreateModal(false);
                                                if (editingPreset) {
                                                    setTravelDirection('left');
                                                    setShowDetailView(true);
                                                }
                                            }}
                                            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSavePreset}
                                            className="px-8 py-2.5 bg-[#6b4423] hover:bg-[#5a391d] text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-900/10 active:scale-95 transition-all"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};


export default MeasurementPresets;
