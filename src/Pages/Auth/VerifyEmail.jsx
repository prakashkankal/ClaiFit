import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';

const VerifyEmail = () => {
    const { verificationToken } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const { data } = await axios.put(`${API_URL}/api/auth/verify-email/${verificationToken}`);
                setStatus('success');
                setMessage(data.message || 'Email verified successfully!');

                // Save user info to local storage for auto-login
                if (data.token) {
                    localStorage.setItem('userInfo', JSON.stringify(data));
                }

                // Auto redirect to home or dashboard after 3 seconds
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. Token might be invalid or expired.');
            }
        };

        if (verificationToken) {
            verifyEmail();
        }
    }, [verificationToken, navigate]);

    return (
        <div className='min-h-screen flex items-center justify-center bg-[#f5f5f0] p-4 text-slate-900'>
            <div className='w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center'>

                {status === 'verifying' && (
                    <div className='flex flex-col items-center'>
                        <div className="w-12 h-12 border-4 border-[#6b4423] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h2 className='text-xl font-bold text-gray-900 mb-2'>Verifying Email...</h2>
                        <p className='text-gray-500'>Please wait while we verify your email address.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div>
                        <div className='w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                            <svg className='w-8 h-8 text-emerald-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
                        </div>
                        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Email Verified!</h2>
                        <p className='text-gray-500 mb-6'>{message}</p>
                        <p className='text-sm text-gray-400 mb-4'>Redirecting to home...</p>
                        <Link to="/" className='inline-block w-full py-3 bg-[#6b4423] hover:bg-[#573619] text-white font-semibold rounded-lg transition-colors shadow-sm'>
                            Continue to Home
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div>
                        <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                            <svg className='w-8 h-8 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
                        </div>
                        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Verification Failed</h2>
                        <p className='text-red-500 mb-6'>{message}</p>
                        <Link to="/login" className='text-sm text-gray-500 hover:text-gray-700 font-medium underline underline-offset-4'>
                            Return to Login
                        </Link>
                    </div>
                )}

            </div>
        </div>
    );
};

export default VerifyEmail;
