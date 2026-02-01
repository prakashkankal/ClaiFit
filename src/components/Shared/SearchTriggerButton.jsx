import React from 'react';

const SearchTriggerButton = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="md:hidden w-full bg-white backdrop-blur-md rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_30px_rgba(0,0,0,0.12)] p-4 flex items-center gap-3 transition-all duration-300 border border-gray-200 active:scale-98"
            aria-label="Open search"
        >
            {/* Search Icon */}
            <svg className='w-5 h-5 text-gray-600 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
            </svg>

            {/* Search Text */}
            <span className="text-base text-gray-600 font-medium">Search tailors...</span>
        </button>
    );
};

export default SearchTriggerButton;
