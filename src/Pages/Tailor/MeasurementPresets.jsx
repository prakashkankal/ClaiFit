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

    const handleDeletePreset = async (presetId) => {
        if (!confirm('Are you sure you want to delete this preset?')) {
            return;
        }

        try {
            await axios.delete(`http://localhost:5000/api/presets/${presetId}`);
            fetchPresets();
        } catch (error) {
            console.error('Error deleting preset:', error);
            alert('Failed to delete preset');
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

            <main className="flex-1 lg:ml-72 p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
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

                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Loading presets...</div>
                    ) : presets.length === 0 ? (
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
                    ) : (
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
                                            onClick={() => handleDeletePreset(preset._id)}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create/Edit Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
                                            <div className="flex-1 grid grid-cols-3 gap-2">
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
                )}
            </main>
        </div>
    );
};

export default MeasurementPresets;
