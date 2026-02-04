import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from parent directory (backend root)
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/User.js';
import Tailor from '../models/Tailor.js';
import connectDB from '../config/db.js';

const email = process.argv[2];

if (!email) {
    console.log('Usage: node scripts/manualVerify.js <email>');
    console.log('Please provide an email address.');
    process.exit(1);
}

const verifyUser = async () => {
    try {
        await connectDB();

        let user = await User.findOne({ email });
        let type = 'User';

        if (!user) {
            user = await Tailor.findOne({ email });
            type = 'Tailor';
        }

        if (!user) {
            console.log(`No user found with email: ${email}`);
            process.exit(1);
        }

        if (user.isVerified) {
            console.log(`${type} ${email} is already verified.`);
            process.exit(0);
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save();

        console.log(`Successfully verified ${type}: ${email}`);
        process.exit(0);

    } catch (error) {
        console.error('Error verifying user:', error);
        process.exit(1);
    }
};

verifyUser();
