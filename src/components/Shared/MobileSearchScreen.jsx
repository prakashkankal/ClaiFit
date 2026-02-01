import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MobileSearchScreen = ({ onClose, onSearch }) => {
    const navigate = useNavigate();
    const [service, setService] = useState('');
    const [location, setLocation] = useState('');

    const handleSearch = () => {
        if (onSearch) {
            onSearch({ service, location });
        }
        // Close the search screen after searching
        if (onClose) {
            onClose();
        } else {
            navigate('/');
        }
    };

    const handleBack = () => {
        if (onClose) {
            onClose();
        } else {
            navigate(-1);
        }
    };

    const quickSearchOptions = [
        {
            icon: <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
            label: 'Nearby',
            action: () => setLocation('Nearby')
        },
        {
            icon: <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
            label: 'Men Tailoring',
            action: () => setService('men-tailoring')
        },
        {
            icon: <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
            label: 'Women Tailoring',
            action: () => setService('women-tailoring')
        },
        {
            icon: <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>,
            label: 'Alterations',
            action: () => setService('alterations')
        },
    ];

    return (
        <>
            {/* Backdrop Overlay - Blurred background */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-fadeIn"
                onClick={onClose}
                aria-label="Close search"
            />

            {/* Bottom Sheet Container */}
            <div className="fixed inset-x-0 bottom-0 z-50 md:hidden animate-slideUp">
                {/* Bottom Sheet - 80% height, rounded top */}
                <div
                    className="bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
                    style={{ height: '80vh', maxHeight: '80vh' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with close button */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
                        <h1 className="text-xl font-semibold text-gray-900">Search Tailors</h1>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Search Form */}
                        <div className="p-4 space-y-6 pb-40">
                            {/* Service Selection */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-800">
                                    Service Type
                                </label>
                                <div className="relative">
                                    <select
                                        value={service}
                                        onChange={(e) => setService(e.target.value)}
                                        className="w-full pl-4 pr-12 py-4 text-base border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#8B7355] focus:border-transparent outline-none bg-white appearance-none"
                                        style={{ fontSize: '16px' }}
                                    >
                                        <option value=''>Select a service</option>
                                        <option value='men-tailoring'>Men Tailoring</option>
                                        <option value='women-tailoring'>Women Tailoring</option>
                                        <option value='alterations'>Alterations</option>
                                        <option value='custom-stitching'>Custom Stitching</option>
                                        <option value='repairs'>Repairs</option>
                                    </select>

                                    {/* Dropdown Icon - Right side */}
                                    <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Location Input */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-800">
                                    Location
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter your location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full pl-4 pr-12 py-4 text-base border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#8B7355] focus:border-transparent outline-none"
                                        style={{ fontSize: '16px' }}
                                    />

                                    {/* Location Icon - Right side */}
                                    <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Quick Search Options */}
                            <div className="space-y-3">
                                <h2 className="text-sm font-semibold text-gray-800">Quick Search</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {quickSearchOptions.map((option, index) => (
                                        <button
                                            key={index}
                                            onClick={option.action}
                                            className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-left"
                                        >
                                            <div className="shrink-0">{option.icon}</div>
                                            <span className="text-sm font-medium text-gray-700">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sticky Search Button - Positioned above bottom navbar */}
                    <div className="sticky bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
                        <button
                            onClick={handleSearch}
                            className="w-full py-4 bg-linear-to-r from-[#8B7355] to-[#6B5444] text-white rounded-full font-semibold text-base hover:from-[#6B5444] hover:to-[#5A4535] active:scale-98 transition-all shadow-md"
                        >
                            Search Tailors
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MobileSearchScreen;
