import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import API_URL from '../config/api'

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            const { credential } = credentialResponse;
            // No role specified for Login intent
            const res = await axios.post(`${API_URL}/api/auth/google`, { token: credential });

            localStorage.setItem('userInfo', JSON.stringify(res.data));

            if (res.data.role === 'tailor' || res.data.userType === 'tailor') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Google Login Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google Login Failed');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await axios.post(`${API_URL}/api/auth/login`, {
                email: formData.email,
                password: formData.password
            });

            localStorage.setItem('userInfo', JSON.stringify(data));

            if (data.role === 'tailor' || data.userType === 'tailor') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='min-h-screen flex'>
            {/* Left Side - Quote & Branding */}
            <div className='hidden lg:flex lg:w-1/2 bg-[#1e3a5f] relative flex-col justify-between p-12'>
                {/* Logo */}
                <div className='flex items-center gap-3'>
                    <span className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                        KStitch
                    </span>
                </div>

                {/* Quote */}
                <div className='text-white max-w-md'>
                    <p className='text-3xl font-light leading-relaxed mb-4'>
                        "Style is a simple way of saying complicated things."
                    </p>
                    <p className='text-lg text-gray-300'>— Jean Cocteau</p>
                </div>

                {/* Scissors Decoration */}
                <div className='absolute bottom-12 right-12 opacity-30'>
                    <div className='absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center rotate-12'>
                        <svg className='w-32 h-32 text-gray-800 rotate-45' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' d='M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664' />
                        </svg>
                    </div>
                </div>

                {/* Footer */}
                <div className='text-gray-400 text-sm'>
                    © 2024 KStitch Atelier Systems
                </div>
            </div>

            {/* Right Side - Login Card */}
            <div className='w-full lg:w-1/2 bg-white lg:bg-[#f5f5f0] flex items-stretch lg:items-center justify-center p-0 lg:p-6 overflow-y-auto'>
                <div className='w-full max-w-none lg:max-w-md flex flex-col justify-center min-h-screen lg:min-h-0'>
                    {/* Login Card with Top Border */}
                    <div className='relative bg-white lg:rounded-2xl lg:shadow-sm lg:dashed-border w-full h-full lg:h-auto'>

                        {/* Mobile Back Button */}
                        <div className='lg:hidden absolute top-4 left-4 z-10'>
                            <button onClick={() => navigate('/')} className='p-2 rounded-full hover:bg-gray-100 transition-colors'>
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                        </div>

                        {/* Scissors Decoration on Right Side */}
                        <div className='absolute -top-3 -right-3 w-8 h-8 rounded-full hidden lg:flex items-center justify-center rotate-12'>
                            <svg className='w-32 h-32 text-gray-800 rotate-45' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664' />
                            </svg>
                        </div>

                        {/* Card Content */}
                        <div className='p-6 pt-16 lg:pt-12 lg:p-12'>

                            {/* Heading */}
                            <div className='text-center mb-8'>
                                <span className="block text-3xl font-bold text-[#6b4423] mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                                    KStitch
                                </span>
                                <h2 className='text-2xl font-serif font-bold text-gray-900 mb-2'>
                                    Login
                                </h2>
                                <p className='text-gray-600 text-sm'>
                                    Enter your credentials to access KStitch.
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className='mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
                                    {error}
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className='space-y-5'>
                                {/* Email */}
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Email Address
                                    </label>
                                    <div className='relative'>
                                        <input
                                            required
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            type="email"
                                            placeholder="example@mail.com"
                                            className='w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400'
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Password
                                    </label>
                                    <div className='relative'>
                                        <input
                                            required
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className='w-full px-4 pr-12 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400'
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className='absolute inset-y-0 right-0 pr-3 flex items-center'
                                        >
                                            <svg className='w-5 h-5 text-gray-400 hover:text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                {showPassword ? (
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                                                ) : (
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                                )}
                                            </svg>
                                        </button>
                                    </div>
                                    <div className='text-right mt-2'>
                                        <Link to="/forgot-password" className='text-sm text-orange-600 hover:text-orange-700 font-medium'>
                                            Forgot password?
                                        </Link>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className='w-full py-3 bg-[#6b4423] hover:bg-[#573619] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2'
                                >
                                    {loading ? 'Accessing...' : (
                                        <>
                                            Login
                                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className='relative my-6'>
                                <div className='absolute inset-0 flex items-center'>
                                    <div className='w-full border-t border-gray-300'></div>
                                </div>
                                <div className='relative flex justify-center text-sm'>
                                    <span className='px-2 bg-white text-gray-500'>or</span>
                                </div>
                            </div>

                            {/* Google Login */}
                            <div className='flex justify-center mb-6'>
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    theme="filled_blue"
                                    shape="rectangular"
                                    text="signin_with"
                                    width="100%"
                                />
                            </div>

                            {/* Sign Up Link */}
                            <div className='text-center'>
                                <p className='text-sm text-gray-600'>
                                    Not a registered user?{' '}
                                    <Link to="/signup" className='text-amber-600 hover:text-amber-700 font-semibold'>
                                        Sign Up
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
