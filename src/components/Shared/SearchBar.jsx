import React, { useState } from 'react';

const SearchBar = ({ onSearch, compact = false }) => {
    const [service, setService] = useState('');
    const [location, setLocation] = useState('');

    const handleSearch = () => {
        if (onSearch) {
            onSearch({ service, location });
        }
    };

    return (
        <div
            className={`bg-white backdrop-blur-md rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_30px_rgba(0,0,0,0.12)] ${compact ? 'p-1' : 'p-1 md:p-1.5'} flex flex-row items-center gap-0 transition-all duration-300 border border-gray-200 overflow-hidden`}
        >
            {/* Service Field */}
            <div className={`flex-1 min-w-0 ${compact ? 'px-3 py-2 md:px-4 md:py-2' : 'px-3 py-2 md:px-5 md:py-3'} border-r border-gray-200 hover:bg-gray-50 rounded-l-full transition-colors cursor-pointer flex items-center gap-2 relative`}>
                <div className="flex-1 min-w-0">
                    {/* Label - Hidden on mobile, visible on desktop */}
                    <label className='hidden md:block text-xs font-semibold text-gray-800 mb-0.5'>Service</label>

                    <select
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        className='w-full text-sm md:text-base bg-transparent border-none outline-none text-gray-600 cursor-pointer font-medium appearance-none truncate'
                        style={{ fontSize: '16px' }} /* Prevents zoom on iOS */
                    >
                        <option value=''>Service</option>
                        <option value='men-tailoring'>Men Tailoring</option>
                        <option value='women-tailoring'>Women Tailoring</option>
                        <option value='alterations'>Alterations</option>
                        <option value='custom-stitching'>Custom Stitching</option>
                        <option value='repairs'>Repairs</option>
                    </select>
                </div>

                {/* Service Icon - Right side */}
                <svg className='w-4 h-4 text-gray-600 shrink-0 absolute right-2 top-1/2 transform -translate-y-1/2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
            </div>

            {/* Location Field */}
            <div className={`flex-1 min-w-0 ${compact ? 'px-3 py-2 md:px-4 md:py-2' : 'px-3 py-2 md:px-5 md:py-3'} border-r md:border-r-0 border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2`}>
                <div className="flex-1 min-w-0">
                    {/* Label - Hidden on mobile, visible on desktop */}
                    <label className='hidden md:block text-xs font-semibold text-gray-800 mb-0.5'>Location</label>

                    <input
                        type='text'
                        placeholder='Location'
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className='w-full text-sm md:text-base bg-transparent border-none outline-none placeholder-gray-400 text-gray-600 font-medium focus:placeholder-gray-500 truncate'
                        style={{ fontSize: '16px' }} /* Prevents zoom on iOS */
                    />
                </div>

                {/* Location Icon - Right side */}
                <svg className='w-4 h-4 text-gray-600 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                </svg>
            </div>

            {/* Search Button - Circular, icon-only */}
            <button
                onClick={handleSearch}
                className={`${compact ? 'w-9 h-9 md:w-14 md:h-14 ml-1 md:ml-2' : 'w-10 h-10 md:w-16 md:h-16 ml-1 md:ml-3'} shrink-0 bg-gradient-to-r from-[#8B7355] to-[#6B5444] text-white rounded-full hover:from-[#6B5444] hover:to-[#5A4535] hover:scale-105 active:scale-95 transition-all duration-200 shadow-md flex items-center justify-center`}
                aria-label="Search"
            >
                <svg className='w-4 h-4 md:w-6 md:h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                </svg>
            </button>
        </div>
    );
};

export default SearchBar;