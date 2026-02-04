import React from 'react';
import Footer from '../../components/Shared/Footer';

const TailorBottom = ({
    tailor,
    showLightbox,
    setShowLightbox,
    filteredPortfolio,
    lightboxIndex,
    setLightboxIndex
}) => {
    return (
        <>
            {/* Floating WhatsApp Button - Desktop Only */}
            <a
                href={`https://wa.me/${tailor?.phone?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex fixed bottom-6 right-6 w-14 h-14 bg-green-600 rounded-full items-center justify-center shadow-lg hover:bg-green-700 transition-colors z-40"
            >
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            </a>

            {/* Sticky Bottom CTA - Mobile Only */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50 flex gap-3 safe-area-pb shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                {/* WhatsApp Button - Primary */}
                <a
                    href={`https://wa.me/${tailor?.phone?.replace(/[^0-9]/g, '')}?text=Hi, I found your profile on KStitch. I’d like to discuss stitching.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 transition-all text-white font-semibold py-3 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                </a>

                {/* Call Button - Secondary */}
                <a
                    href={`tel:${tailor?.phone}`}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all text-gray-700 font-semibold py-3 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call
                </a>

                {/* Location Button - Square */}
                <a
                    href={tailor?.location?.locationSet && tailor?.location?.latitude
                        ? `https://www.google.com/maps/search/?api=1&query=${tailor.location.latitude},${tailor.location.longitude}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([tailor?.shopName, tailor?.address?.street, tailor?.address?.city, tailor?.address?.state].filter(Boolean).join(', '))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open shop location"
                    title={tailor?.location?.locationSet ? "View pinned location" : "View address on map"}
                    className="flex-none aspect-square bg-white border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all text-gray-700 font-semibold rounded-xl text-sm shadow-sm flex items-center justify-center w-[46px]"
                >
                    <svg className={`w-5 h-5 ${tailor?.location?.locationSet ? 'text-[#6b4423]' : 'text-gray-400'}`} fill={tailor?.location?.locationSet ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </a>
            </div>

            {/* Detailed Post Preview Modal */}
            {showLightbox && filteredPortfolio[lightboxIndex] && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowLightbox(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-white w-full max-w-4xl max-h-[90vh] md:h-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">

                        {/* Close Button */}
                        <button
                            onClick={() => setShowLightbox(false)}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {/* Left: Image Container */}
                        <div className="w-full md:w-3/5 bg-black relative flex items-center justify-center group h-[40vh] md:h-auto overflow-hidden">
                            <img
                                src={filteredPortfolio[lightboxIndex]?.images?.[0] || filteredPortfolio[lightboxIndex]?.image || filteredPortfolio[lightboxIndex]}
                                alt={filteredPortfolio[lightboxIndex]?.title || "Portfolio Item"}
                                className="w-full h-full object-contain"
                            />

                            {/* Navigation Arrows (Desktop overlay / Mobile overlay) */}
                            <div className="absolute inset-x-0 flex justify-between px-4 pointer-events-none">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : filteredPortfolio.length - 1));
                                    }}
                                    className="pointer-events-auto p-2 rounded-full bg-white/80 text-slate-800 hover:bg-white shadow-lg backdrop-blur-sm transition-transform active:scale-95"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxIndex((prev) => (prev < filteredPortfolio.length - 1 ? prev + 1 : 0));
                                    }}
                                    className="pointer-events-auto p-2 rounded-full bg-white/80 text-slate-800 hover:bg-white shadow-lg backdrop-blur-sm transition-transform active:scale-95"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Right: Details Container */}
                        <div className="w-full md:w-2/5 p-6 md:p-8 bg-white flex flex-col h-full overflow-y-auto">
                            <div className="flex-1">
                                {filteredPortfolio[lightboxIndex]?.category && (
                                    <span className="inline-block px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider mb-3 border border-amber-100">
                                        {filteredPortfolio[lightboxIndex].category}
                                    </span>
                                )}

                                <h3 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
                                    {filteredPortfolio[lightboxIndex]?.title || "Portfolio Item"}
                                </h3>

                                {filteredPortfolio[lightboxIndex]?.price && (
                                    <div className="text-xl font-bold text-[#6b4423] mb-4">
                                        ₹{filteredPortfolio[lightboxIndex].price}
                                    </div>
                                )}

                                <div className="h-px bg-slate-100 my-4"></div>

                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                    {filteredPortfolio[lightboxIndex]?.description || "No description available."}
                                </p>
                            </div>

                            {/* CTA Action */}
                            <div className="mt-8 pt-4 border-t border-slate-100">
                                <a
                                    href={`https://wa.me/${tailor?.phone?.replace(/[^0-9]/g, '')}?text=Hi, I'm interested in the "${filteredPortfolio[lightboxIndex]?.title || 'item'}" (₹${filteredPortfolio[lightboxIndex]?.price || ''}) I saw on your profile.`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3.5 bg-[#6b4423] hover:bg-[#573619] text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                    Inquire Now
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <Footer />
        </>
    );
};

export default TailorBottom;
