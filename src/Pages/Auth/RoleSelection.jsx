import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

const RoleSelection = () => {
    const navigate = useNavigate();

    return (
        <div className='min-h-screen flex'>
            {/* Left Side - Branding */}
            <div className='hidden lg:flex lg:w-1/2 bg-[#1e3a5f] relative flex-col justify-between p-12'>
                {/* Logo */}
                <div className='flex items-center gap-3'>
                    <span className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                        Claifit
                    </span>
                </div>

                {/* Quote */}
                <div className='text-white max-w-md'>
                    <p className='text-3xl font-light leading-relaxed mb-4'>
                        "Fashion is the armor to survive the reality of everyday life."
                    </p>
                    <p className='text-lg text-gray-300'>— Bill Cunningham</p>
                </div>

                {/* Scissors Decoration */}
                <div className='absolute bottom-12 right-12 opacity-30'>
                    <svg className='w-32 h-32 text-white rotate-45' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664' />
                    </svg>
                </div>

                {/* Footer */}
                <div className='text-gray-400 text-sm'>
                    © 2024 Claifit Atelier Systems
                </div>
            </div>

            {/* Right Side - Selection */}
            <div className='w-full lg:w-1/2 bg-white lg:bg-[#f5f5f0] flex items-center justify-center p-6'>
                <div className='w-full max-w-lg'>
                    <div className='bg-white lg:rounded-2xl lg:shadow-sm lg:dashed-border p-8 text-center relative'>
                        {/* Mobile Back Button */}
                        <div className='lg:hidden absolute top-4 left-4 z-10'>
                            <button onClick={() => navigate('/login')} className='p-2 rounded-full hover:bg-gray-100 transition-colors'>
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                        </div>

                        <h2 className='text-3xl font-serif font-bold text-[#6b4423] mb-4'>Join Claifit</h2>
                        <p className='text-gray-600 mb-8'>Choose how you want to use the platform</p>

                        <div className='space-y-4'>
                            {/* Customer Option */}
                            <Link to="/signup/customer" className='group block p-6 border-2 border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50 transition-all duration-300 text-left relative overflow-hidden'>
                                <div className='flex items-start gap-4 z-10 relative'>
                                    <div className='w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform'>
                                        <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className='text-lg font-bold text-gray-900 group-hover:text-orange-700'>I'm a Customer</h3>
                                        <p className='text-sm text-gray-500 mt-1'>I want to discover tailors and get clothes stitched.</p>
                                    </div>
                                </div>
                            </Link>

                            {/* Tailor Option */}
                            <Link to="/signup/tailor" className='group block p-6 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-all duration-300 text-left relative overflow-hidden'>
                                <div className='flex items-start gap-4 z-10 relative'>
                                    <div className='w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform'>
                                        <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z' />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className='text-lg font-bold text-gray-900 group-hover:text-blue-700'>I'm a Tailor</h3>
                                        <p className='text-sm text-gray-500 mt-1'>I want to manage my business and find new customers.</p>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className='mt-8 text-sm text-gray-500'>
                            Already have an account? <Link to="/login" className='font-semibold text-orange-600 hover:text-orange-700'>Log in here</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RoleSelection
