import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';

const VerifyOtp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']); // Array for 6 digits
    const [status, setStatus] = useState('idle'); // idle, verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        } else {
            // Fallback or redirect if no email passed
            navigate('/login');
        }
    }, [location, navigate]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Focus next input
        if (element.nextSibling && element.value !== "") {
            element.nextSibling.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            if (e.target.value === "" && e.target.previousSibling) {
                e.target.previousSibling.focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').slice(0, 6).split('');
        if (pasteData.length > 0) {
            const newOtp = [...otp];
            pasteData.forEach((char, index) => {
                if (index < 6 && !isNaN(char)) {
                    newOtp[index] = char;
                }
            });
            setOtp(newOtp);
            // Focus the last filled input or the first empty one
            // Simple logic: focus the last one
            const inputs = document.querySelectorAll('input[name="otp-input"]');
            if (inputs[pasteData.length - 1 < 6 ? pasteData.length - 1 : 5]) {
                inputs[pasteData.length - 1 < 6 ? pasteData.length - 1 : 5].focus();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setStatus('error');
            setMessage('Please enter a valid 6-digit code.');
            return;
        }

        setStatus('verifying');
        setMessage('');

        try {
            const { data } = await axios.post(`${API_URL}/api/auth/verify-otp`, {
                email,
                otp: otpString
            });

            setStatus('success');
            setMessage(data.message || 'Verification successful!');

            if (data.token) {
                localStorage.setItem('userInfo', JSON.stringify(data));
            }

            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Verification failed. Please try again.');
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-[#f5f5f0] p-4 text-slate-900'>
            <div className='w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center'>
                <div className='w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6'>
                    <svg className='w-8 h-8 text-[#1e3a5f]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                </div>

                <h2 className='text-3xl font-bold text-gray-900 mb-2' style={{ fontFamily: '"Playfair Display", serif' }}>
                    Verify Email
                </h2>

                <p className='text-gray-600 mb-8'>
                    We sent a 6-digit code to <span className="font-semibold text-gray-900">{email}</span>. <br />
                    Enter it below to confirm your account.
                </p>

                {status === 'error' && (
                    <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                        {message}
                    </div>
                )}

                {status === 'success' && (
                    <div className="mb-6 p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm border border-emerald-100">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center gap-2 mb-8">
                        {otp.map((data, index) => (
                            <input
                                key={index}
                                name="otp-input"
                                type="text"
                                maxLength="1"
                                className="w-12 h-12 border border-gray-300 rounded-lg text-center text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition-all bg-gray-50"
                                value={data}
                                onChange={e => handleChange(e.target, index)}
                                onKeyDown={e => handleKeyDown(e, index)}
                                onPaste={handlePaste}
                                onFocus={e => e.target.select()}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'verifying' || status === 'success'}
                        className='w-full py-3.5 bg-[#1e3a5f] hover:bg-[#152a45] text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed'
                    >
                        {status === 'verifying' ? 'Verifying...' : 'Verify Code'}
                    </button>
                </form>

                <div className="mt-6">
                    <p className="text-sm text-gray-500">
                        Didn't receive code? <button className="text-[#1e3a5f] font-semibold hover:underline">Resend OTP</button>
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <Link to="/login" className="text-gray-400 hover:text-gray-600 text-sm font-medium">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;
