import express from 'express';
import MeasurementPreset from '../models/MeasurementPreset.js';

const router = express.Router();

// @desc    Get all presets for a tailor
// @route   GET /api/presets/:tailorId
// @access  Private
router.get('/:tailorId', async (req, res) => {
    try {
        const { tailorId } = req.params;

        const presets = await MeasurementPreset.find({ tailorId })
            .sort({ isDefault: -1, name: 1 });

        res.json({ presets });
    } catch (error) {
        console.error('Error fetching presets:', error);
        res.status(500).json({ message: 'Server error fetching presets' });
    }
});

// @desc    Get single preset by ID
// @route   GET /api/presets/detail/:presetId
// @access  Private
router.get('/detail/:presetId', async (req, res) => {
    try {
        const { presetId } = req.params;

        const preset = await MeasurementPreset.findById(presetId);

        if (!preset) {
            return res.status(404).json({ message: 'Preset not found' });
        }

        res.json({ preset });
    } catch (error) {
        console.error('Error fetching preset:', error);
        res.status(500).json({ message: 'Server error fetching preset' });
    }
});

// @desc    Create a new preset
// @route   POST /api/presets
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { tailorId, name, description, fields } = req.body;

        // Validation
        if (!tailorId || !name || !fields || fields.length === 0) {
            return res.status(400).json({ message: 'Tailor ID, name, and at least one field are required' });
        }

        // Check if preset with same name already exists for this tailor
        const existingPreset = await MeasurementPreset.findOne({ tailorId, name });
        if (existingPreset) {
            return res.status(400).json({ message: 'A preset with this name already exists' });
        }

        const preset = await MeasurementPreset.create({
            tailorId,
            name,
            description: description || '',
            fields,
            isDefault: false
        });

        res.status(201).json({ preset, message: 'Preset created successfully' });
    } catch (error) {
        console.error('Error creating preset:', error);
        res.status(500).json({ message: 'Server error creating preset' });
    }
});

// @desc    Update a preset
// @route   PUT /api/presets/:presetId
// @access  Private
router.put('/:presetId', async (req, res) => {
    try {
        const { presetId } = req.params;
        const { name, description, fields } = req.body;

        const preset = await MeasurementPreset.findById(presetId);

        if (!preset) {
            return res.status(404).json({ message: 'Preset not found' });
        }

        // Check if name is being changed and if it conflicts
        if (name && name !== preset.name) {
            const existingPreset = await MeasurementPreset.findOne({
                tailorId: preset.tailorId,
                name,
                _id: { $ne: presetId }
            });
            if (existingPreset) {
                return res.status(400).json({ message: 'A preset with this name already exists' });
            }
        }

        if (name) preset.name = name;
        if (description !== undefined) preset.description = description;
        if (fields && fields.length > 0) preset.fields = fields;

        await preset.save();

        res.json({ preset, message: 'Preset updated successfully' });
    } catch (error) {
        console.error('Error updating preset:', error);
        res.status(500).json({ message: 'Server error updating preset' });
    }
});

// @desc    Delete a preset
// @route   DELETE /api/presets/:presetId
// @access  Private
router.delete('/:presetId', async (req, res) => {
    try {
        const { presetId } = req.params;

        const preset = await MeasurementPreset.findById(presetId);

        if (!preset) {
            return res.status(404).json({ message: 'Preset not found' });
        }

        await MeasurementPreset.deleteOne({ _id: presetId });

        res.json({ message: 'Preset deleted successfully' });
    } catch (error) {
        console.error('Error deleting preset:', error);
        res.status(500).json({ message: 'Server error deleting preset' });
    }
});

// @desc    Create default presets for a tailor
// @route   POST /api/presets/create-defaults
// @access  Private
router.post('/create-defaults', async (req, res) => {
    try {
        const { tailorId } = req.body;

        if (!tailorId) {
            return res.status(400).json({ message: 'Tailor ID is required' });
        }

        // Check if defaults already exist
        const existingPresets = await MeasurementPreset.find({ tailorId, isDefault: true });
        if (existingPresets.length > 0) {
            return res.status(400).json({ message: 'Default presets already exist for this tailor' });
        }

        const defaultPresets = MeasurementPreset.getDefaultPresets();
        const presetsToCreate = defaultPresets.map(preset => ({
            ...preset,
            tailorId
        }));

        const createdPresets = await MeasurementPreset.insertMany(presetsToCreate);

        res.status(201).json({
            presets: createdPresets,
            message: 'Default presets created successfully'
        });
    } catch (error) {
        console.error('Error creating default presets:', error);
        res.status(500).json({ message: 'Server error creating default presets' });
    }
});

export default router;
