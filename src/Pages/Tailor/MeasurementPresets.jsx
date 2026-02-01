import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../../components/Tailor/DashboardSidebar';
import axios from 'axios';

const MeasurementPresets = () => {
    const navigate = useNavigate();
    const [tailorData, setTailorData] = useState(null);
    const [presets, setPresets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPreset, setEditingPreset] = useState(null);
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        fields: [
            { label: '', unit: 'inches', required: false }
        ]
    });

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
            const { data } = await axios.get(`http://localhost:5000/api/presets/${tailorData._id}`);
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
            fields: [...prev.fields, { label: '', unit: 'inches', required: false }]
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
            fields: [{ label: '', unit: 'inches', required: false }]
        });
        setShowCreateModal(true);
    };

    const handleOpenEdit = (preset) => {
        setEditingPreset(preset);
        setFormData({
            name: preset.name,
            description: preset.description,
            fields: preset.fields
        });
        setShowCreateModal(true);
        setShowActionSheet(false);
    };

    const handleDuplicate = (preset) => {
        setEditingPreset(null);
        setFormData({
            name: `${preset.name} (Copy)`,
            description: preset.description,
            fields: preset.fields
        });
        setShowCreateModal(true);
        setShowActionSheet(false);
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

            if (editingPreset) {
                // Update existing
                await axios.put(`http://localhost:5000/api/presets/${editingPreset._id}`, {
                    name: formData.name,
                    description: formData.description,
                    fields: validFields
                });
            } else {
                // Create new
                await axios.post('http://localhost:5000/api/presets', {
                    tailorId: tailorData._id,
                    name: formData.name,
                    description: formData.description,
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
            await axios.delete(`http://localhost:5000/api/presets/${selectedPreset._id}`);
            setShowDeleteConfirm(false);
            setShowActionSheet(false);
            fetchPresets();
        } catch (error) {
            console.error('Error deleting preset:', error);
            alert('Failed to delete preset');
        }
    };

    const handlePresetClick = (preset) => {
        setSelectedPreset(preset);
        setShowActionSheet(true);
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

            <main className="flex-1 lg:ml-72 dashboard-main-mobile min-w-0 pb-24 lg:pb-8">
                {/* Mobile Header */}
                <div className="lg:hidden sticky top-14 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-lg active:bg-slate-200 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-lg font-bold text-slate-900">Measurement Presets</h1>
                </div>

                {/* Desktop Header */}
                <div className="hidden lg:block max-w-7xl mx-auto p-6 md:p-8">
                    <header className="mb-8 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <h1 className="text-3xl font-serif font-bold text-slate-800">Measurement Presets 📏</h1>
                            </div>
                            <p className="text-slate-500">Manage measurement templates for your garments</p>
                        </div>
                        <button
                            onClick={handleOpenCreate}
                            className="px-6 py-3 bg-linear-to-r from-[#6b4423] to-[#8b5a3c] hover:from-[#573619] hover:to-[#6b4423] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            + Create Preset
                        </button>
                    </header>
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
                    <>
                        {/* Mobile: Compact List */}
                        <div className="lg:hidden px-4 pt-4 space-y-3">
                            {presets.map(preset => (
                                <button
                                    key={preset._id}
                                    onClick={() => handlePresetClick(preset)}
                                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-slate-800 truncate">{preset.name}</h3>
                                            {preset.isDefault && (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <svg className="w-5 h-5 text-slate-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">{preset.fields.length} fields</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {preset.fields.slice(0, 3).map((field, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                                                {field.label}
                                            </span>
                                        ))}
                                        {preset.fields.length > 3 && (
                                            <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                                                +{preset.fields.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Desktop: Card Grid (unchanged) */}
                        <div className="hidden lg:block max-w-7xl mx-auto px-6 md:px-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {presets.map(preset => (
                                    <div key={preset._id} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-slate-800 mb-1">{preset.name}</h3>
                                                {preset.isDefault && (
                                                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {preset.description && (
                                            <p className="text-sm text-slate-600 mb-4">{preset.description}</p>
                                        )}
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Fields ({preset.fields.length})</p>
                                            <div className="flex flex-wrap gap-2">
                                                {preset.fields.slice(0, 6).map((field, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                                                        {field.label}
                                                    </span>
                                                ))}
                                                {preset.fields.length > 6 && (
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                                                        +{preset.fields.length - 6} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(preset)}
                                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedPreset(preset);
                                                    setShowDeleteConfirm(true);
                                                }}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
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

                {/* Mobile Action Sheet */}
                {showActionSheet && selectedPreset && (
                    <div className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowActionSheet(false)}>
                        <div className="bg-white rounded-t-3xl w-full p-6 space-y-1 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4"></div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">{selectedPreset.name}</h3>

                            {/* Edit */}
                            <button
                                onClick={() => handleOpenEdit(selectedPreset)}
                                className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 active:bg-slate-100 rounded-xl transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span className="font-medium">Edit Preset</span>
                                </div>
                            </button>

                            {/* Duplicate */}
                            <button
                                onClick={() => handleDuplicate(selectedPreset)}
                                className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 active:bg-slate-100 rounded-xl transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span className="font-medium">Duplicate Preset</span>
                                </div>
                            </button>

                            {/* Delete */}
                            <button
                                onClick={() => {
                                    setShowActionSheet(false);
                                    setShowDeleteConfirm(true);
                                }}
                                disabled={selectedPreset.isDefault}
                                className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 active:bg-red-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span className="font-medium">Delete Preset</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setShowActionSheet(false)}
                                className="w-full px-4 py-3 text-slate-500 font-medium mt-2"
                            >
                                Cancel
                            </button>
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
                        <div className="lg:hidden fixed inset-0 bg-[#f5f5f0] z-50 flex flex-col overflow-hidden">
                            {/* Sticky App Bar */}
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="p-1 -ml-1 text-slate-700 active:bg-slate-100 rounded-full transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <h2 className="text-lg font-bold text-slate-800">
                                        {editingPreset ? 'Edit Preset' : 'New Preset'}
                                    </h2>
                                </div>
                                <button
                                    onClick={handleSavePreset}
                                    className="px-4 py-2 bg-[#6b4423] text-white text-sm font-bold rounded-full active:scale-95 transition-transform"
                                >
                                    Save
                                </button>
                            </div>

                            {/* Scrollable Form Content */}
                            <div className="flex-1 overflow-y-auto pb-32">
                                {/* Basic Info Section */}
                                <div className="p-4 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Preset Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4423] text-sm"
                                            placeholder="e.g. Shirt, Suit, Pant"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Description (Optional)</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b4423] text-sm resize-none"
                                            rows="2"
                                            placeholder="Short details about this template..."
                                        />
                                    </div>
                                </div>

                                {/* Measurement Fields List */}
                                <div className="mt-2">
                                    <div className="px-5 mb-2 flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Measurement Fields</h3>
                                        <span className="text-[10px] font-medium text-slate-400">{formData.fields.length} Total</span>
                                    </div>

                                    <div className="bg-white border-y border-slate-100">
                                        {formData.fields.map((field, index) => {
                                            const isExpanded = selectedPreset?.expandedIndex === index;
                                            return (
                                                <div key={index} className="border-b border-slate-50 last:border-0">
                                                    {/* Compact Row */}
                                                    <button
                                                        onClick={() => setSelectedPreset(prev => ({ ...prev, expandedIndex: isExpanded ? -1 : index }))}
                                                        className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                                                <span className="text-xs font-bold text-slate-500">{index + 1}</span>
                                                            </div>
                                                            <div className="text-left overflow-hidden">
                                                                <p className="text-sm font-bold text-slate-800 truncate">
                                                                    {field.label || <span className="text-slate-300 italic">Untitled Field</span>}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] text-slate-400 uppercase font-medium">{field.unit}</span>
                                                                    {field.required && (
                                                                        <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                                                                    )}
                                                                    {field.required && (
                                                                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter">Required</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <svg className={`w-5 h-5 text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>

                                                    {/* Inline Editor (Expanded) */}
                                                    {isExpanded && (
                                                        <div className="px-5 pb-5 pt-1 space-y-4 animate-slide-down bg-slate-50/50">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="col-span-2 space-y-1">
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Field Label</label>
                                                                    <input
                                                                        type="text"
                                                                        value={field.label}
                                                                        onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6b4423] outline-none"
                                                                        placeholder="e.g. Chest, Sleeve"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Unit</label>
                                                                    <select
                                                                        value={field.unit}
                                                                        onChange={(e) => handleFieldChange(index, 'unit', e.target.value)}
                                                                        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6b4423] outline-none"
                                                                    >
                                                                        <option value="inches">Inches</option>
                                                                        <option value="cm">CM</option>
                                                                        <option value="any">Any</option>
                                                                    </select>
                                                                </div>
                                                                <div className="flex items-center justify-between px-2">
                                                                    <span className="text-xs font-bold text-slate-600">Required</span>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={field.required}
                                                                        onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                                                                        className="w-5 h-5 accent-[#6b4423] rounded-lg cursor-pointer"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveField(index)}
                                                                className="w-full py-3 text-red-600 text-xs font-bold uppercase tracking-widest border border-red-100 rounded-xl active:bg-red-50 transition-colors"
                                                            >
                                                                Remove Field
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

                            {/* Floating Add Button */}
                            <button
                                onClick={() => {
                                    handleAddField();
                                    setSelectedPreset(prev => ({ ...prev, expandedIndex: formData.fields.length }));
                                }}
                                className="fixed bottom-6 right-6 w-14 h-14 bg-[#6b4423] text-white rounded-full shadow-2xl flex items-center justify-center z-20 active:scale-90 transition-transform"
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        {/* DESKTOP: Traditional Modal (Unchanged) */}
                        <div className="hidden lg:flex fixed inset-0 bg-black/50 items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                                <h2 className="text-2xl font-bold text-slate-800 mb-6">
                                    {editingPreset ? 'Edit Preset' : 'Create New Preset'}
                                </h2>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Preset Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423]"
                                            placeholder="e.g., Shirt, Pant, Custom Kurta"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b4423]"
                                            rows="2"
                                            placeholder="Optional description"
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-bold text-slate-800">Measurement Fields</h3>
                                        <button
                                            onClick={handleAddField}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            + Add Field
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.fields.map((field, index) => (
                                            <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg">
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                                    <input
                                                        type="text"
                                                        value={field.label}
                                                        onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                                                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6b4423]"
                                                        placeholder="Measurement name (e.g., Chest)"
                                                    />
                                                    <select
                                                        value={field.unit}
                                                        onChange={(e) => handleFieldChange(index, 'unit', e.target.value)}
                                                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6b4423]"
                                                    >
                                                        <option value="inches">Inches</option>
                                                        <option value="cm">Centimeters</option>
                                                        <option value="any">Any Unit</option>
                                                    </select>
                                                    <label className="flex items-center gap-2 px-3 py-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.required}
                                                            onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm">Required</span>
                                                    </label>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveField(index)}
                                                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSavePreset}
                                        className="px-6 py-3 bg-[#6b4423] hover:bg-[#573619] text-white font-semibold rounded-lg transition-colors"
                                    >
                                        {editingPreset ? 'Update Preset' : 'Create Preset'}
                                    </button>
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
