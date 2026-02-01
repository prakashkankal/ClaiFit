import React from 'react';

const ManagementTools = () => {
    const tools = [
        {
            icon: (
                <svg className='w-12 h-12 text-gray-700' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664' />
                </svg>
            ),
            title: 'Digital Profiles',
            description: 'Comprehensive profiles showcasing work, specialties, and reviews for informed decisions.'
        },
        {
            icon: (
                <svg className='w-12 h-12 text-gray-700' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z' />
                </svg>
            ),
            title: 'Order Tracking',
            description: 'Real-time updates from measurement to fitting, keeping you informed throughout the process.'
        },
        {
            icon: (
                <svg className='w-12 h-12 text-gray-700' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' />
                </svg>
            ),
            title: 'Scheduling',
            description: 'Easy appointment booking with instant confirmations and timely reminders for appointments.'
        }
    ];

    return (
        <div className='w-full py-8 md:py-16 bg-[#faf8f5]'>
            <div className='max-w-7xl mx-auto px-4 md:px-6'>
                {/* Section Header - Compact on mobile */}
                <div className='text-center mb-6 md:mb-12'>
                    <p className='text-amber-600 font-semibold text-xs md:text-sm mb-1 md:mb-2 tracking-wide uppercase'>FOR MODERN TAILORS</p>
                    <h2 className='text-2xl md:text-4xl font-serif font-bold text-gray-900'>
                        Precision Management Tools
                    </h2>
                    <p className='text-gray-600 text-sm md:text-base max-w-2xl mx-auto mt-2 md:mt-4'>
                        Streamline your tailoring business with powerful tools designed for efficiency and growth.
                    </p>
                </div>

                {/* Tools Grid - Compact cards on mobile */}
                <div className='grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8'>
                    {tools.map((tool, index) => (
                        <div
                            key={index}
                            className={`bg-white rounded-xl md:rounded-2xl p-3 md:p-8 text-center shadow-sm hover:shadow-lg transition-all duration-300 ${index === tools.length - 1 ? 'col-span-2 md:col-span-1 max-w-[80%] md:max-w-none mx-auto w-full' : ''}`}
                        >
                            {/* Icon - Smaller on mobile */}
                            <div className='flex justify-center mb-2 md:mb-6'>
                                <div className='w-6 h-6 md:w-12 md:h-12'>
                                    {React.cloneElement(tool.icon, { className: 'w-full h-full text-gray-700' })}
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className='text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-3 leading-tight'>{tool.title}</h3>

                            {/* Description */}
                            <p className='text-gray-600 text-xs md:text-base leading-snug md:leading-relaxed'>{tool.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManagementTools;
