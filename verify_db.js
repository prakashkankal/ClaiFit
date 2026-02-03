
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: './.env' });

const uri = process.env.MONGO_URI;
console.log('Testing connection to:', uri.replace(/:([^:@]+)@/, ':****@')); // Hide password in log

async function testConnection() {
    try {
        console.log('Attempting to connect...');
        await mongoose.connect(uri);
        console.log('✅ SUCCESS: Authentication works!');
        console.log('Now go to Render Dashboard -> Environment and ensure MONGO_URI matches exactly.');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ FAILED: Connection error.');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.message.includes('authentication failed')) {
            console.error('CAUSE: Wrong Username or Password.');
        } else if (error.message.includes('bad auth')) {
            console.error('CAUSE: Bad Authentication.');
        } else {
            console.error('CAUSE: Network or Whitelist issue.');
        }
        process.exit(1);
    }
}

testConnection();
