import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const CheckEmail = () => {
    const location = useLocation();
    const email = location.state?.email || 'your email';

    const handleOpenEmail = () => {
        window.location.href = 'mailto:';
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-[#f5f5f0] p-4 text-slate-900'>
            <div className='w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center'>
                <div className='w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6'>
                    <svg className='w-8 h-8 text-[#1e3a5f]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                    </svg>
                </div>

                <h2 className='text-3xl font-bold text-gray-900 mb-4' style={{ fontFamily: '"Playfair Display", serif' }}>
                    Check Your Email
                </h2>

                <p className='text-gray-600 mb-8 leading-relaxed'>
                    We sent a verification link to <span className="font-semibold text-gray-900">{email}</span>. <br />
                    Please click the link inside to verify your account.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleOpenEmail}
                        className='w-full py-3.5 bg-[#1e3a5f] hover:bg-[#152a45] text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2'
                    >
                        Open Email App
                    </button>

                    <p className="text-sm text-gray-500">
                        Didn't receive the email? <Link to="/login" className="text-[#1e3a5f] font-semibold hover:underline">Click to login</Link>
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm font-medium">
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CheckEmail;
