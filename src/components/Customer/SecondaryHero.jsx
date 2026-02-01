import React from 'react';

const SecondaryHero = () => {
    return (
        <div className='relative w-full h-[35vh] md:h-[60vh] bg-cover bg-center flex items-center justify-start'
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558769132-cb1aea1c8e7a?q=80&w=2074')" }}>
            {/* Dark Overlay */}
            <div className='absolute inset-0 bg-black/70'></div>

            {/* Content - Compact on mobile */}
            <div className='relative z-10 max-w-7xl mx-auto px-4 md:px-12'>
                <h2 className='text-2xl md:text-5xl font-serif font-bold text-white mb-3 md:mb-6 leading-tight'>
                    Redefine Your <br />
                    <span className='italic font-serif'>Style</span>
                </h2>
                <div className='w-12 md:w-16 h-0.5 bg-amber-400 mb-3 md:mb-6'></div>
                <p className='text-gray-200 text-sm md:text-lg mb-4 md:mb-8 max-w-xl leading-relaxed'>
                    Expert fittings and consultations from master tailors to create custom pieces that speak to your individuality with style and precision.
                </p>

                <button className='px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base bg-[#6b4423] text-white font-semibold rounded-lg hover:bg-[#573619] transition-all shadow-lg cursor-pointer tracking-wide'>
                    SCHEDULE CONSULT
                </button>
            </div>
        </div>
    );
};

export default SecondaryHero;
