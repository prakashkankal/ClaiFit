import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import API_URL from '../../config/api';

const TailorRegistration = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Hook to get navigation state
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
        pincode: '',
        googleId: ''
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Check if user is already logged in (localStorage) OR data passed via navigation state
    useEffect(() => {
        // 1. Check for data passed via navigation (e.g. from "Switch to Tailor")
        if (location.state?.prefillData) {
            const { name, email, phone } = location.state.prefillData;
            console.log("Prefilling data from navigation state:", location.state.prefillData);
            setFormData(prev => ({
                ...prev,
                name: name || '',
                email: email || '',
                phone: phone || ''
            }));
            // If email is provided, we can treat them somewhat like an existing user for pre-fill purposes,
            // but they still need to set a password if they don't have one, or just fill the form.
            // Since they are "switching", they are already logged in as a customer.
            // But this registration form creates a NEW tailor account or upgrades?
            // The prompt says "redirect to tailor registration which should be filled with existing info".
            // It doesn't explicitly say "upgrade the account". Usually registration assumes creating a new record or checking existence.
            // I'll leave isExistingUser as false so they can enter a password for their new tailor identity if needed,
            // or if the backend handles email duplication by merging/upgrading, that's backend logic.
            // However, visually pre-filling is key.
            setIsExistingUser(true); // Let's mark as existing so email is read-only if we want that behavior.
        }

        // 2. Check localStorage for session
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const user = JSON.parse(userInfo);

                // If already a tailor, redirect to dashboard
                if (user.role === 'tailor' || user.userType === 'tailor') {
                    navigate('/dashboard');
                    return;
                }

                // If it's a regular user and NO navigation state was passed (fallback), pre-fill their information
                if (!location.state?.prefillData && user.email) {
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
    }, [navigate, location]);


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

    const isStep1Valid = () => {
        return formData.name && formData.email && formData.phone && formData.password && formData.confirmPassword && (formData.password === formData.confirmPassword) && (formData.password.length >= 6);
    }

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

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const { credential } = credentialResponse;
            const response = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credential, role: 'tailor' })
            });
            const data = await response.json();

            if (response.status === 200 || response.status === 201) {
                // Logged in successfully
                localStorage.setItem('userInfo', JSON.stringify(data));
                navigate('/dashboard');
            } else if (response.status === 202) {
                // New Tailor - Pre-fill form
                setFormData(prev => ({
                    ...prev,
                    name: data.name,
                    email: data.email,
                    googleId: data.googleId
                }));
                setIsExistingUser(true); // Locks email
                setError('Please complete your shop details to finish registration.');
            } else {
                setError(data.message || 'Google Sign-Up Failed');
            }
        } catch (err) {
            console.error(err);
            setError('Google Sign-Up Failed');
        }
    };

    const handleGoogleError = () => {
        setError('Google Sign-Up Failed');
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
            },
            googleId: formData.googleId
        };

        try {
            const response = await fetch(`${API_URL}/api/tailors/register`, {
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
                navigate('/verify-otp', { state: { email: formData.email } });
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Something went wrong. Please try again.');
        }
    };

    // Styles (Mobile First)
    const inputClasses = "w-full h-[48px] px-4 py-3 bg-white border border-gray-200 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6b4423] focus:border-transparent transition-all placeholder:text-gray-400 appearance-none";
    const labelClasses = "block text-sm font-medium text-gray-900 mb-1.5";

    // DESKTOP VIEW
    const DesktopView = () => (
        <div className='hidden lg:flex min-h-screen'>
            {/* Left Side - Quote & Branding */}
            <div className='w-1/2 bg-[#1e3a5f] relative flex-col justify-between p-12 flex'>
                {/* Logo */}
                <div className='flex items-center gap-3'>
                    <h1 className='text-4xl font-bold text-white' style={{ fontFamily: '"Playfair Display", serif' }}>KStitch</h1>
                </div>

                {/* Quote */}
                <div className='text-white max-w-md'>
                    <p className='text-3xl font-light leading-relaxed mb-4'>
                        "The difference between style and fashion is quality."
                    </p>
                    <p className='text-lg text-gray-300'>— Giorgio Armani</p>
                </div>

                {/* Footer */}
                <div className='text-gray-400 text-sm'>
                    © 2024 KStitch Atelier Systems
                </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className='w-1/2 bg-[#f5f5f0] flex items-center justify-center p-6'>
                <div className="text-center text-gray-400">
                    <p>Refer to mobile view for the redesigned form experience.</p>
                    <p className='text-sm mt-2'>Resize your browser to create.</p>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Keeping desktop strict as per previous instructions or implying mobile-only focus? User said MOBILE FIRST. I'll make it responsive if I can, but primarily focused on mobile structure. For now, I will use a simple layout logic. */}

            <div className='lg:flex min-h-screen bg-white'>
                {/* Left Branding (Desktop) - Same as UserRegistration */}
                <div className='hidden lg:flex lg:w-1/2 bg-[#1e3a5f] relative flex-col justify-between p-12'>
                    <div className='flex items-center gap-3'>
                        <span className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                            KStitch
                        </span>
                    </div>
                    <div className='text-white max-w-md'>
                        <p className='text-3xl font-light leading-relaxed mb-4'>
                            "Success is often achieved by those who don't know that failure is inevitable."
                        </p>
                        <p className='text-lg text-gray-300'>— Coco Chanel</p>
                    </div>
                    <div className='text-gray-400 text-sm'>
                        © 2024 KStitch Atelier Systems
                    </div>
                </div>

                {/* Content Area */}
                <div className='w-full lg:w-1/2 flex flex-col h-screen lg:h-auto overflow-hidden bg-white'>

                    {/* Mobile Top Bar */}
                    <div className="px-5 pt-6 pb-2 bg-white flex items-center justify-between shrink-0">
                        <button
                            onClick={() => {
                                if (location.state?.from) {
                                    navigate(location.state.from);
                                } else {
                                    navigate('/signup');
                                }
                            }}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-900 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        {/* Step Count */}
                        <div className="text-sm font-medium text-gray-500">
                            Step {currentStep} of 3
                        </div>
                        {/* Placeholder for balance */}
                        <div className="w-8"></div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-gray-100 shrink-0">
                        <div
                            className="h-full bg-[#6b4423] transition-all duration-300 ease-out"
                            style={{ width: `${(currentStep / 3) * 100}%` }}
                        ></div>
                    </div>

                    {/* Scrollable Form Area */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
                        {currentStep === 1 && (
                            <div className="max-w-md mx-auto fade-in">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Personal Information</h2>

                                {!isExistingUser && (
                                    <>
                                        <div className='mb-6'>
                                            <GoogleLogin
                                                onSuccess={handleGoogleSuccess}
                                                onError={handleGoogleError}
                                                theme="outline"
                                                shape="pill"
                                                text="signup_with"
                                                width="100%"
                                            />
                                        </div>
                                        <div className='relative mb-8'>
                                            <div className='absolute inset-0 flex items-center'>
                                                <div className='w-full border-t border-gray-100'></div>
                                            </div>
                                            <div className='relative flex justify-center text-sm'>
                                                <span className='px-4 bg-white text-gray-400'>or use email</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-5 pb-24">
                                    <div>
                                        <label className={labelClasses}>Full Name</label>
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            type="text"
                                            className={inputClasses}
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Email Address</label>
                                        <input
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            type="email"
                                            className={inputClasses}
                                            placeholder="john@example.com"
                                            readOnly={isExistingUser}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Phone Number</label>
                                        <input
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            type="tel"
                                            className={inputClasses}
                                            placeholder="9876543210"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Password</label>
                                        <div className="relative">
                                            <input
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                type={showPassword ? "text" : "password"}
                                                className={inputClasses}
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' /></svg>
                                                ) : (
                                                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                type={showConfirmPassword ? "text" : "password"}
                                                className={inputClasses}
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? (
                                                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' /></svg>
                                                ) : (
                                                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>
                                                )}
                                            </button>
                                        </div>
                                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Placeholder for Step 2 and 3 simple rendering to keep file valid until further edits */}
                        {currentStep === 2 && (
                            <div className="max-w-md mx-auto fade-in">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Shop Details</h2>
                                <div className="space-y-5 pb-24">
                                    <div><label className={labelClasses}>Shop Name</label><input name="shopName" value={formData.shopName} onChange={handleChange} type="text" className={inputClasses} placeholder="Elegant Tailors" /></div>
                                    <div><label className={labelClasses}>Specialization</label><select name="specialization" value={formData.specialization} onChange={handleChange} className={inputClasses}><option value="">Select</option><option value="men">Men's</option><option value="women">Women's</option><option value="all">All</option></select></div>
                                    <div><label className={labelClasses}>Years of Experience</label><input name="experience" value={formData.experience} onChange={handleChange} type="number" className={inputClasses} placeholder="5" /></div>
                                    <div><label className={labelClasses}>Price Range</label><select name="priceRange" value={formData.priceRange} onChange={handleChange} className={inputClasses}><option value="">Select</option><option value="budget">Budget</option><option value="mid-range">Mid-Range</option><option value="premium">Premium</option></select></div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="max-w-md mx-auto fade-in">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Shop Address</h2>
                                <div className="space-y-5 pb-24">
                                    <div><label className={labelClasses}>Street Address</label><input name="street" value={formData.street} onChange={handleChange} type="text" className={inputClasses} placeholder="123 Main St" /></div>
                                    <div><label className={labelClasses}>City</label><input name="city" value={formData.city} onChange={handleChange} type="text" className={inputClasses} placeholder="Mumbai" /></div>
                                    <div><label className={labelClasses}>State</label><input name="state" value={formData.state} onChange={handleChange} type="text" className={inputClasses} placeholder="Maharashtra" /></div>
                                    <div><label className={labelClasses}>Pincode</label><input name="pincode" value={formData.pincode} onChange={handleChange} type="text" className={inputClasses} placeholder="400001" /></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Bottom Actions */}
                    <div className="p-4 bg-white border-t border-gray-100 shrink-0 safe-area-bottom">
                        <div className="max-w-md mx-auto flex gap-3">
                            {currentStep === 1 && (
                                <button
                                    onClick={handleNext}
                                    disabled={!isStep1Valid()}
                                    className={`w-full h-[52px] rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all ${isStep1Valid()
                                        ? 'bg-[#6b4423] hover:bg-[#573619] text-white shadow-lg shadow-orange-900/10'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Next: Shop Details
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </button>
                            )}
                            {currentStep > 1 && (
                                <>
                                    <button
                                        onClick={handleBack}
                                        className="w-14 h-[52px] bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 border border-gray-200"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <button
                                        onClick={currentStep === 3 ? handleSubmit : handleNext}
                                        className="flex-1 h-[52px] bg-[#6b4423] hover:bg-[#573619] text-white rounded-xl font-semibold text-base shadow-lg shadow-orange-900/10"
                                    >
                                        {currentStep === 3 ? 'Complete Registration' : 'Next Step'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}

export default TailorRegistration
