import mongoose from 'mongoose';

const measurementFieldSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        enum: ['inches', 'cm', 'any'],
        default: 'inches'
    },
    required: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const measurementPresetSchema = new mongoose.Schema({
    tailorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tailor',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    basePrice: {
        type: Number,
        default: 0
    },
    fields: [measurementFieldSchema],
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient querying
measurementPresetSchema.index({ tailorId: 1, name: 1 });

// Default presets that should be created for new tailors
measurementPresetSchema.statics.getDefaultPresets = function () {
    return [
        {
            name: 'Shirt',
            description: 'Standard shirt measurements',
            fields: [
                { name: 'chest', label: 'Chest', unit: 'inches', required: true },
                { name: 'waist', label: 'Waist', unit: 'inches', required: false },
                { name: 'shoulder', label: 'Shoulder', unit: 'inches', required: true },
                { name: 'sleeveLength', label: 'Sleeve Length', unit: 'inches', required: true },
                { name: 'shirtLength', label: 'Shirt Length', unit: 'inches', required: true },
                { name: 'neck', label: 'Neck', unit: 'inches', required: false }
            ],
            isDefault: true
        },
        {
            name: 'Pant',
            description: 'Standard pant measurements',
            fields: [
                { name: 'waist', label: 'Waist', unit: 'inches', required: true },
                { name: 'hips', label: 'Hips', unit: 'inches', required: false },
                { name: 'inseam', label: 'Inseam', unit: 'inches', required: true },
                { name: 'outseam', label: 'Outseam', unit: 'inches', required: false },
                { name: 'thigh', label: 'Thigh', unit: 'inches', required: false },
                { name: 'knee', label: 'Knee', unit: 'inches', required: false },
                { name: 'bottom', label: 'Bottom', unit: 'inches', required: false }
            ],
            isDefault: true
        },
        {
            name: 'Blouse',
            description: 'Standard blouse measurements',
            fields: [
                { name: 'bust', label: 'Bust', unit: 'inches', required: true },
                { name: 'waist', label: 'Waist', unit: 'inches', required: true },
                { name: 'shoulder', label: 'Shoulder', unit: 'inches', required: true },
                { name: 'sleeveLength', label: 'Sleeve Length', unit: 'inches', required: true },
                { name: 'blouseLength', label: 'Blouse Length', unit: 'inches', required: true },
                { name: 'armhole', label: 'Armhole', unit: 'inches', required: false }
            ],
            isDefault: true
        },
        {
            name: 'Kurta',
            description: 'Standard kurta measurements',
            fields: [
                { name: 'chest', label: 'Chest', unit: 'inches', required: true },
                { name: 'waist', label: 'Waist', unit: 'inches', required: false },
                { name: 'shoulder', label: 'Shoulder', unit: 'inches', required: true },
                { name: 'sleeveLength', label: 'Sleeve Length', unit: 'inches', required: true },
                { name: 'kurtaLength', label: 'Kurta Length', unit: 'inches', required: true },
                { name: 'neck', label: 'Neck', unit: 'inches', required: false },
                { name: 'slit', label: 'Slit', unit: 'inches', required: false }
            ],
            isDefault: true
        }
    ];
};

const MeasurementPreset = mongoose.model('MeasurementPreset', measurementPresetSchema);

export default MeasurementPreset;
