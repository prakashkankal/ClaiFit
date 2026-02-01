import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: false,
        minlength: 6
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    phone: {
        type: String,
        required: false
    },
    profilePhoto: {
        type: String,  // Store base64 encoded image
        required: false
    },
    bio: {
        type: String,
        required: false
    },
    dateOfBirth: {
        type: String,
        required: false
    },
    gender: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: false
    },
    country: {
        type: String,
        required: false
    },
    alternatePhone: {
        type: String,
        required: false
    },
    role: {
        type: String,
        enum: ['customer'],
        default: 'customer'
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
