import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const TailorShowcase = ({ tailors, loading, hasMore }) => {
    const navigate = useNavigate();

    // Display all tailors (no limit for infinite scroll)
    const displayTailors = tailors && tailors.length > 0 ? tailors : [];

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <svg key={i} className="w-4 h-4 fill-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ));
    };

    return (
        <div className='w-full py-6 md:py-16 bg-[#faf8f5]'>
            <div className='max-w-7xl mx-auto px-4 md:px-6'>
                {/* Section Header - Compact on mobile */}
                <div className='text-start mb-4 md:mb-12'>
                    <h2 className='text-2xl md:text-4xl font-serif font-bold text-gray-900 mb-2 md:mb-4'>
                        Find Your Perfect <span className='text-amber-600'>Tailor</span>
                    </h2>
                </div>

                {/* Tailor Cards Grid - Responsive, compact on mobile */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 tailor-grid-mobile'>
                    {displayTailors.map((tailor) => (
                        <Link
                            key={tailor._id}
                            to={`/tailor/${tailor._id}`}
                            className='block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-dashed border-gray-200 hover:border-[#6b4423]'
                        >
                            {/* Mobile: Horizontal Layout, Desktop: Vertical Layout */}
                            <div className='md:block flex flex-row gap-4 md:gap-0'>
                                {/* Image - Smaller on mobile, on left side */}
                                <div className='relative w-24 md:w-full md:h-48 shrink-0 overflow-hidden bg-linear-to-br from-amber-100 to-orange-100'>
                                    <img
                                        src={tailor.shopImage || `https://ui-avatars.com/api/?name=${tailor.name}&size=400&background=6b4423&color=fff`}
                                        alt={tailor.name}
                                        className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
                                    />
                                    {/* Availability Badge */}
                                    <div className='absolute top-1 left-1 md:top-2 md:left-2'>
                                        <span className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${tailor.availability === 'Available' ? 'bg-green-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                                            {tailor.availability}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Content - Takes remaining space on mobile */}
                                <div className='flex-1 p-3 md:p-4'>
                                    {/* Header: Name & Rating */}
                                    <div className='flex items-start justify-between gap-2 mb-2'>
                                        {/* Tailor Name & Shop */}
                                        <div className='flex-1 min-w-0'>
                                            <h3 className='text-base md:text-lg font-bold text-gray-900 truncate'>{tailor.name}</h3>
                                            <p className='text-xs text-gray-600 truncate'>{tailor.shopName}</p>
                                        </div>

                                        {/* Rating - Top Right */}
                                        <div className='flex items-center gap-1 shrink-0'>
                                            <svg className='w-4 h-4 fill-amber-400' viewBox='0 0 20 20'>
                                                <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                            </svg>
                                            <span className='text-sm font-semibold text-gray-900'>{tailor.rating}</span>
                                        </div>
                                    </div>

                                    {/* Specialization */}
                                    <div className='flex items-center gap-1.5 mb-1 md:mb-2'>
                                        <svg className='w-3.5 h-3.5 text-amber-600 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
                                        </svg>
                                        <span className='text-xs text-gray-700 font-medium truncate'>{tailor.specialization}</span>
                                    </div>

                                    {/* Address */}
                                    <div className='flex items-start gap-1.5 mb-2 md:mb-3'>
                                        <svg className='w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                                        </svg>
                                        <span className='text-xs text-gray-600 line-clamp-1'>
                                            {tailor.address?.city || 'Mumbai'}, {tailor.address?.state || 'Maharashtra'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Loading Spinner */}
                {loading && (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                    </div>
                )}

                {/* No More Tailors Message */}
                {!loading && !hasMore && tailors.length > 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-600 text-sm">You've reached the end! No more tailors to show.</p>
                    </div>
                )}

                {/* No Tailors Available */}
                {!loading && tailors.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">No tailors available at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TailorShowcase;
