import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import API_URL from '../config/api'

const UserRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            const { credential } = credentialResponse;
            const res = await axios.post(`${API_URL}/api/auth/google`, {
                token: credential,
                role: 'customer'
            });

            localStorage.setItem('userInfo', JSON.stringify(res.data));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Google Sign-Up Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google Sign-Up Failed');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match!');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const { data } = await axios.post(`${API_URL}/api/users/register`, {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone
            });

            navigate('/verify-otp', { state: { email: formData.email } });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Shared Input Styles
    const inputClasses = "w-full h-[48px] px-4 py-3 bg-white border border-gray-200 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400";
    const labelClasses = "block text-sm font-medium text-gray-900 mb-1.5";

    return (
        <div className='min-h-screen flex bg-white lg:bg-[#f5f5f0]'>
            {/* Left Side - Branding (Desktop Only) */}
            <div className='hidden lg:flex lg:w-1/2 bg-[#1e3a5f] relative flex-col justify-between p-12'>
                <div className='flex items-center gap-3'>
                    <span className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                        KStitch
                    </span>
                </div>
                <div className='text-white max-w-md'>
                    <p className='text-3xl font-light leading-relaxed mb-4'>
                        "Elegance is not standing out, but being remembered."
                    </p>
                    <p className='text-lg text-gray-300'>— Giorgio Armani</p>
                </div>
                <div className='text-gray-400 text-sm'>
                    © 2024 KStitch Atelier Systems
                </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className='w-full lg:w-1/2 flex flex-col justify-center p-6 lg:p-12'>
                <div className='w-full max-w-md mx-auto'>

                    {/* Mobile Back Button */}
                    <div className='mb-6 lg:hidden'>
                        <button onClick={() => navigate('/signup')} className='p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors inline-flex items-center gap-2 text-gray-500'>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="text-sm font-medium">Back</span>
                        </button>
                    </div>

                    {/* Header */}
                    <div className='text-center mb-8'>
                        <span className="block lg:hidden text-2xl font-bold text-[#6b4423] mb-6" style={{ fontFamily: '"Playfair Display", serif' }}>
                            KStitch
                        </span>
                        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                            Create Account
                        </h2>
                        <p className='text-gray-500'>
                            Join us to discover perfect fits.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className='mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm'>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className='space-y-5'>
                        {/* Full Name */}
                        <div>
                            <label className={labelClasses}>Full Name</label>
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                type="text"
                                placeholder="e.g. John Doe"
                                className={inputClasses}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className={labelClasses}>Email Address</label>
                            <input
                                required
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                type="email"
                                placeholder="name@example.com"
                                className={inputClasses}
                            />
                        </div>

                        {/* Phone (Optional) */}
                        <div>
                            <label className={labelClasses}>Phone Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                type="tel"
                                placeholder="+91 98765 43210"
                                className={inputClasses}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className={labelClasses}>Password</label>
                            <div className='relative'>
                                <input
                                    required
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={inputClasses}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className='absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600'
                                >
                                    {showPassword ? (
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' /></svg>
                                    ) : (
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className={labelClasses}>Confirm Password</label>
                            <div className='relative'>
                                <input
                                    required
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={inputClasses}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className='absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600'
                                >
                                    {showConfirmPassword ? (
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' /></svg>
                                    ) : (
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className='w-full h-[48px] bg-[#1e3a5f] hover:bg-[#152a45] text-white text-base font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 mt-2 disabled:opacity-70'
                        >
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className='relative my-8'>
                        <div className='absolute inset-0 flex items-center'>
                            <div className='w-full border-t border-gray-100'></div>
                        </div>
                        <div className='relative flex justify-center text-sm'>
                            <span className='px-4 bg-white lg:bg-[#f5f5f0] text-gray-500'>or</span>
                        </div>
                    </div>

                    {/* Google Sign Up */}
                    <div className='mb-8'>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="outline"
                            shape="pill"
                            size="large"
                            text="continue_with"
                            width="100%"
                        />
                    </div>

                    {/* Sign In Link */}
                    <div className='text-center pb-8'>
                        <p className='text-base text-gray-600'>
                            Already have an account?{' '}
                            <Link to="/login" className='text-[#1e3a5f] font-semibold hover:underline decoration-2 underline-offset-4'>
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserRegistration
