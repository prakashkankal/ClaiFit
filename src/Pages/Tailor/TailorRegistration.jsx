import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

const TailorRegistration = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1); // Step 1: Personal Info, Step 2: Shop Details, Step 3: Address
    const [isExistingUser, setIsExistingUser] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        shopName: '',
        specialization: '',
        experience: '',
        shopDescription: '',
        services: [],
        priceRange: '',
        street: '',
        city: '',
        state: '',
        pincode: ''
    });
    const [error, setError] = useState('');

    // Check if user is already logged in and pre-fill data
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const user = JSON.parse(userInfo);

                // If already a tailor, redirect to dashboard
                if (user.userType === 'tailor') {
                    navigate('/dashboard');
                    return;
                }

                // If it's a regular user, pre-fill their information
                if (user.email) {
                    setIsExistingUser(true);
                    setFormData(prev => ({
                        ...prev,
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || ''
                    }));
                }
            } catch (err) {
                console.error('Error parsing user info:', err);
            }
        }
    }, [navigate]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox' && name === 'services') {
            setFormData(prev => ({
                ...prev,
                services: checked
                    ? [...prev.services, value]
                    : prev.services.filter(s => s !== value)
            }));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleNext = () => {
        setError('');

        // Validate Step 1: Personal Information
        if (currentStep === 1) {
            if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
                setError('Please fill in all personal information fields');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match!');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters long');
                return;
            }
            setCurrentStep(2);
        }
        // Validate Step 2: Shop Details
        else if (currentStep === 2) {
            if (!formData.shopName || !formData.specialization || !formData.experience) {
                setError('Please fill in all required shop details');
                return;
            }
            setCurrentStep(3);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate address fields from Step 3
        if (!formData.street || !formData.city || !formData.state || !formData.pincode) {
            setError('Please fill in all address fields');
            return;
        }

        // Construct payload to match backend schema
        const payload = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            shopName: formData.shopName,
            specialization: formData.specialization,
            experience: Number(formData.experience),
            shopDescription: formData.shopDescription,
            services: formData.services,
            priceRange: formData.priceRange,
            address: {
                street: formData.street,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode
            }
        };

        try {
            const response = await fetch('http://localhost:5000/api/tailors/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                // Store user data and token in localStorage (auto-login)
                localStorage.setItem('userInfo', JSON.stringify(data));

                // Registration successful - auto-login and redirect to dashboard
                alert(`Welcome to StyleEase, ${data.name}! Redirecting to your dashboard...`);
                navigate('/dashboard');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Something went wrong. Please try again.');
        }
    };

    return (
        <div className='min-h-screen flex'>
            {/* Left Side - Quote & Branding */}
            <div className='hidden lg:flex lg:w-1/2 bg-[#1e3a5f] relative flex-col justify-between p-12'>
                {/* Logo */}
                <div className='flex items-center gap-3'>
                    <h1 className='text-4xl font-serif font-bold text-white'>StyleEase</h1>
                </div>

                {/* Quote */}
                <div className='text-white max-w-md'>
                    <p className='text-3xl font-light leading-relaxed mb-4'>
                        "The difference between style and fashion is quality."
                    </p>
                    <p className='text-lg text-gray-300'>— Giorgio Armani</p>
                </div>

                {/* Scissors Decoration */}
                <div className='absolute bottom-12 right-12 opacity-30'>
                    <svg className='w-32 h-32 text-gray-800 rotate-45' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664' />
                    </svg>
                </div>

                {/* Footer */}
                <div className='text-gray-400 text-sm'>
                    © 2024 StyleEase Atelier Systems
                </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className='w-full lg:w-1/2 bg-[#f5f5f0] flex items-center justify-center p-6'>
                <div className='w-full max-w-2xl'>
                    {/* Registration Card with Dashed Border */}
                    <div className='relative bg-white rounded-2xl shadow-sm dashed-border p-6'>
                        {/* Scissors Decoration */}
                        <div className='absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center rotate-12'>
                            <svg className='w-32 h-32 text-gray-800 rotate-45' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664' />
                            </svg>
                        </div>

                        {/* Step Indicator */}
                        <div className='flex items-center justify-center mb-4'>
                            <div className='flex items-center gap-2'>
                                <div className={`flex items-center gap-2 ${currentStep === 1 ? 'text-[#6b4423]' : 'text-gray-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep === 1 ? 'bg-[#6b4423] text-white' : currentStep > 1 ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
                                        {currentStep > 1 ? '✓' : '1'}
                                    </div>
                                    <span className='text-sm font-medium hidden sm:inline'>Personal</span>
                                </div>
                                <div className='w-8 h-0.5 bg-gray-300'></div>
                                <div className={`flex items-center gap-2 ${currentStep === 2 ? 'text-[#6b4423]' : 'text-gray-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep === 2 ? 'bg-[#6b4423] text-white' : currentStep > 2 ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
                                        {currentStep > 2 ? '✓' : '2'}
                                    </div>
                                    <span className='text-sm font-medium  hidden sm:inline'>Shop</span>
                                </div>
                                <div className='w-8 h-0.5 bg-gray-300'></div>
                                <div className={`flex items-center gap-2 ${currentStep === 3 ? 'text-[#6b4423]' : 'text-gray-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep === 3 ? 'bg-[#6b4423] text-white' : 'bg-gray-200'}`}>
                                        3
                                    </div>
                                    <span className='text-sm font-medium hidden sm:inline'>Address</span>
                                </div>
                            </div>
                        </div>

                        {/* Heading */}
                        <div className='text-center mb-5'>
                            <h2 className='text-2xl font-serif font-bold text-gray-900 mb-2'>
                                {currentStep === 1 ? 'Personal Information' : currentStep === 2 ? 'Shop Details' : 'Shop Address'}
                            </h2>
                            <p className='text-gray-600 text-sm'>
                                {currentStep === 1
                                    ? 'Create your account to get started'
                                    : currentStep === 2
                                        ? 'Tell us about your tailoring business'
                                        : 'Where can customers find your shop?'}
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className='mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className='space-y-4'>
                            {/* STEP 1: Personal Information */}
                            {currentStep === 1 && (
                                <>
                                    {isExistingUser && (
                                        <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm'>
                                            ℹ️ We've pre-filled your information from your account. You can edit it if needed.
                                        </div>
                                    )}

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>Full Name *</label>
                                        <input
                                            required
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            type="text"
                                            placeholder="John Doe"
                                            className='w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>Email Address *</label>
                                        <input
                                            required
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            type="email"
                                            placeholder="john@example.com"
                                            readOnly={isExistingUser}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 ${isExistingUser ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'}`}
                                        />
                                        {isExistingUser && (
                                            <p className='text-xs text-gray-500 mt-1'>Email cannot be changed as it's linked to your account</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>Phone Number *</label>
                                        <input
                                            required
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            type="tel"
                                            placeholder="9876543210"
                                            maxLength="10"
                                            className='w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>
                                            Password * {isExistingUser && <span className='text-xs font-normal text-gray-500'>(Set password for tailor account)</span>}
                                        </label>
                                        <input
                                            required
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            type="password"
                                            placeholder="••••••••"
                                            className='w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>Confirm Password *</label>
                                        <input
                                            required
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            type="password"
                                            placeholder="••••••••"
                                            className='w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400'
                                        />
                                    </div>

                                    {/* Next Button */}
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className='w-full py-2.5 bg-[#6b4423] hover:bg-[#573619] text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 mt-4'
                                    >
                                        Next: Shop Details
                                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
                                        </svg>
                                    </button>
                                </>
                            )}

                            {/* STEP 2: Shop Details */}
                            {currentStep === 2 && (
                                <>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>Shop Name *</label>
                                        <input
                                            required
                                            name="shopName"
                                            value={formData.shopName}
                                            onChange={handleChange}
                                            type="text"
                                            placeholder="Elegant Tailors"
                                            className='w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>Specialization *</label>
                                        <select
                                            required
                                            name="specialization"
                                            value={formData.specialization}
                                            onChange={handleChange}
                                            className='w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 cursor-pointer'
                                        >
                                            <option value="">Select Specialization</option>
                                            <option value="men">Men's Wear</option>
                                            <option value="women">Women's Wear</option>
                                            <option value="all">All (Unisex)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>Years of Experience *</label>
                                        <input
                                            required
                                            name="experience"
                                            value={formData.experience}
                                            onChange={handleChange}
                                            type="number"
                                            min="0"
                                            placeholder="5"
                                            className='w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>Shop Description</label>
                                        <textarea
                                            name="shopDescription"
                                            value={formData.shopDescription}
                                            onChange={handleChange}
                                            rows="2"
                                            placeholder="Brief description of your shop and services..."
                                            className='w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 resize-none'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>Services Offered</label>
                                        <div className='space-y-2'>
                                            {['Custom Tailoring', 'Alterations', 'Repairs', 'Design Consultation'].map(service => (
                                                <label key={service} className='flex items-center gap-2 cursor-pointer'>
                                                    <input
                                                        type="checkbox"
                                                        name="services"
                                                        value={service}
                                                        checked={formData.services.includes(service)}
                                                        onChange={handleChange}
                                                        className='w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500'
                                                    />
                                                    <span className='text-sm text-gray-700'>{service}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>Price Range</label>
                                        <select
                                            name="priceRange"
                                            value={formData.priceRange}
                                            onChange={handleChange}
                                            className='w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 cursor-pointer'
                                        >
                                            <option value="">Select Price Range</option>
                                            <option value="budget">Budget (₹)</option>
                                            <option value="mid-range">Mid-Range (₹₹)</option>
                                            <option value="premium">Premium (₹₹₹)</option>
                                        </select>
                                    </div>

                                    {/* Next Button */}
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className='w-full py-2.5 bg-[#6b4423] hover:bg-[#573619] text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 mt-4'
                                    >
                                        Next: Address
                                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
                                        </svg>
                                    </button>
                                </>
                            )}

                            {/* STEP 3: Address */}
                            {currentStep === 3 && (
                                <>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>Street Address *</label>
                                        <input
                                            required
                                            name="street"
                                            value={formData.street}
                                            onChange={handleChange}
                                            type="text"
                                            placeholder="123 Main Street, Near Landmark"
                                            className='w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400'
                                        />
                                    </div>

                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1.5'>City *</label>
                                            <input
                                                required
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                type="text"
                                                placeholder="Mumbai"
                                                className='w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1.5'>State *</label>
                                            <input
                                                required
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                type="text"
                                                placeholder="Maharashtra"
                                                className='w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400'
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1.5'>Pincode *</label>
                                        <input
                                            required
                                            name="pincode"
                                            value={formData.pincode}
                                            onChange={handleChange}
                                            type="text"
                                            maxLength="6"
                                            placeholder="400001"
                                            className='w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder:text-gray-400'
                                        />
                                    </div>

                                    {/* Back and Submit Buttons */}
                                    <div className='flex gap-4 mt-4'>
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            className='flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2'
                                        >
                                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 17l-5-5m0 0l5-5m-5 5h12' />
                                            </svg>
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            className='flex-1 py-2.5 bg-[#6b4423] hover:bg-[#573619] text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2'
                                        >
                                            Register as Partner
                                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                            </svg>
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TailorRegistration
