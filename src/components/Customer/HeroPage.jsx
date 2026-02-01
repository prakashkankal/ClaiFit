import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import SearchBar from '../Shared/SearchBar';
import SearchTriggerButton from '../Shared/SearchTriggerButton';
import MobileSearchScreen from '../Shared/MobileSearchScreen';

const HeroPage = ({ heroSearchRef, onSearch }) => {
  const headingRef = useRef(null);
  const subheadingRef = useRef(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    // Elegant fade-in animations
    gsap.fromTo(headingRef.current,
      { opacity: 0, y: 40, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'power3.out',
        delay: 0.3
      }
    );

    gsap.fromTo(subheadingRef.current,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.5
      }
    );
  }, []);

  return (
    <div className='relative w-full h-[35vh] md:h-[50vh] overflow-hidden'>
      {/* Subtle Pattern Overlay */}
      <div className='absolute inset-0 opacity-20' style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* Gradient Background */}
      <div className='absolute inset-0 bg-gradient-to-br from-[#F5F1EB] via-[#E8DFD4] to-[#D4C4B0]'></div>

      {/* Content - Aligned to top on mobile, centered on desktop */}
      <div className='relative z-10 h-full flex flex-col items-center justify-start md:justify-center pt-15 md:pt-0 px-4 md:px-6 text-center'>
        {/* Main Headline */}
        <h1
          ref={headingRef}
          className='text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight mb-1 md:mb-6 px-2'
          style={{ fontFamily: '"Inter", "Poppins", sans-serif' }}
        >
          Perfect Fit. Made Easy.
        </h1>

        {/* Subheading */}
        <p
          ref={subheadingRef}
          className='text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl text-gray-700 max-w-3xl px-2 mb-0 md:mb-0'
          style={{ fontFamily: '"Inter", "Poppins", sans-serif' }}
        >
          Book trusted tailors for custom stitching, alterations, and doorstep service.
        </p>
      </div>

      {/* Search Bar - Desktop: Real inputs, Mobile: Trigger button */}
      <div
        ref={heroSearchRef}
        className="absolute bottom-16 md:bottom-12 left-1/2 transform -translate-x-1/2 z-20 w-4/5 md:w-full max-w-2xl px-0 md:px-6 hero-search-container"
      >
        {/* Desktop Search Bar - Real inputs */}
        <div className="hidden md:block">
          <SearchBar onSearch={onSearch} />
        </div>

        {/* Mobile Search Trigger - Opens modal */}
        <SearchTriggerButton onClick={() => setShowMobileSearch(true)} />
      </div>

      {/* Mobile Search Screen Modal */}
      {showMobileSearch && (
        <MobileSearchScreen
          onClose={() => setShowMobileSearch(false)}
          onSearch={onSearch}
        />
      )}

      {/* Wave decoration at bottom */}
      <div className='absolute bottom-0 left-0 right-0 z-10'>
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 43.9999C106.667 43.9999 213.333 7.33325 320 7.33325C426.667 7.33325 533.333 43.9999 640 43.9999C746.667 43.9999 853.333 7.33325 960 7.33325C1066.67 7.33325 1173.33 43.9999 1280 43.9999C1386.67 43.9999 1440 19.0266 1440 19.0266V100H0V43.9999Z" fill="white" />
        </svg>
      </div>
    </div>
  );
};

export default HeroPage;