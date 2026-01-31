import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const createDefaultPresetsForAllTailors = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI not found in environment variables');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Define the preset schema (inline for this script)
        const measurementFieldSchema = new mongoose.Schema({
            name: String,
            label: String,
            unit: { type: String, enum: ['inches', 'cm', 'any'], default: 'inches' },
            required: { type: Boolean, default: false }
        }, { _id: false });

        const measurementPresetSchema = new mongoose.Schema({
            tailorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tailor', required: true },
            name: { type: String, required: true, trim: true },
            description: { type: String, trim: true, default: '' },
            fields: [measurementFieldSchema],
            isDefault: { type: Boolean, default: false }
        }, { timestamps: true });

        const MeasurementPreset = mongoose.models.MeasurementPreset ||
            mongoose.model('MeasurementPreset', measurementPresetSchema);

        const Tailor = mongoose.models.Tailor ||
            mongoose.model('Tailor', new mongoose.Schema({}, { strict: false }));

        // Define default presets
        const defaultPresets = [
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

        // Get all tailors
        const tailors = await Tailor.find({});
        console.log(`📊 Found ${tailors.length} tailor(s)`);

        let totalCreated = 0;

        for (const tailor of tailors) {
            console.log(`\n🔍 Processing tailor: ${tailor.name} (${tailor.email})`);

            // Check if this tailor already has presets
            const existingPresets = await MeasurementPreset.find({ tailorId: tailor._id });

            if (existingPresets.length > 0) {
                console.log(`   ⏭️  Skipping - already has ${existingPresets.length} preset(s)`);
                continue;
            }

            // Create presets for this tailor
            const presetsToCreate = defaultPresets.map(preset => ({
                ...preset,
                tailorId: tailor._id
            }));

            const createdPresets = await MeasurementPreset.insertMany(presetsToCreate);
            console.log(`   ✅ Created ${createdPresets.length} default presets`);
            totalCreated += createdPresets.length;

            createdPresets.forEach(preset => {
                console.log(`      - ${preset.name} (${preset.fields.length} fields)`);
            });
        }

        console.log(`\n🎉 Done! Created ${totalCreated} total presets for ${tailors.length} tailor(s).`);
        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

createDefaultPresetsForAllTailors();
