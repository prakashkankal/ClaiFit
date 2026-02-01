import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const tailorSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, required: true },
    role: { type: String, enum: ['tailor'], default: 'tailor' },
    googleId: { type: String, unique: true, sparse: true },
    shopName: { type: String, required: true },
    shopImage: { type: String, default: '' },
    bio: { type: String, default: '' },
    specialization: { type: String, enum: ['men', 'women', 'kids', 'all'], default: 'all' },
    experience: { type: Number, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true }
    },
    businessHours: {
        type: Map,
        of: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '18:00' },
            closed: { type: Boolean, default: false }
        },
        default: {
            Monday: { open: '09:00', close: '18:00', closed: false },
            Tuesday: { open: '09:00', close: '18:00', closed: false },
            Wednesday: { open: '09:00', close: '18:00', closed: false },
            Thursday: { open: '09:00', close: '18:00', closed: false },
            Friday: { open: '09:00', close: '18:00', closed: false },
            Saturday: { open: '09:00', close: '18:00', closed: false },
            Sunday: { open: '09:00', close: '18:00', closed: true }
        }
    }
}, {
    timestamps: true
});

// Hash password before saving
tailorSchema.pre('save', async function () {
    console.log('Pre-save hook called. Password modified:', this.isModified('password'));

    if (!this.isModified('password')) {
        return;
    }

    console.log('Hashing password... Original length:', this.password?.length);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed! New length:', this.password?.length);
});

// Method to compare password for login
tailorSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Tailor = mongoose.model('Tailor', tailorSchema);

export default Tailor;
