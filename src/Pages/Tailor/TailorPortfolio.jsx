import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../../components/Tailor/DashboardSidebar'

const TailorPortfolio = () => {
    const navigate = useNavigate();
    const [tailorData, setTailorData] = useState(null);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            navigate('/login');
            return;
        }
        try {
            const user = JSON.parse(userInfo);
            if (user.role !== 'tailor' && user.userType !== 'tailor') {
                navigate('/');
                return;
            }
            setTailorData(user);
        } catch (error) {
            navigate('/login');
        }
    }, [navigate]);

    const [showLightbox, setShowLightbox] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const handleUpdateTailorData = (updatedData) => {
        setTailorData(updatedData);
    };

    const getInitials = (name) => {
        if (!name) return 'T';
        const names = name.split(' ');
        return names.length >= 2 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
    };

    if (!tailorData) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[#f5f5f0]">
                <div className="text-slate-600 text-lg">Loading...</div>
            </div>
        );
    }

    const portfolioItems = [
        { title: 'Wedding Sherwani', category: 'Menswear', description: 'Elegant traditional sherwani with intricate embroidery', price: '₹25,000' },
        { title: 'Designer Saree Blouse', category: 'Womenswear', description: 'Contemporary blouse design with mirror work', price: '₹5,000' },
        { title: 'Kids Party Wear', category: 'Kidswear', description: 'Colorful and comfortable party wear for children', price: '₹3,500' },
        { title: 'Custom Suit', category: 'Menswear', description: 'Tailored business suit with perfect fit', price: '₹18,000' },
        { title: 'Bridal Lehenga', category: 'Womenswear', description: 'Stunning bridal lehenga with hand embroidery', price: '₹45,000' },
        { title: 'Casual Kurta', category: 'Menswear', description: 'Comfortable cotton kurta for daily wear', price: '₹2,500' },
    ];

    return (
        <div className="w-full min-h-screen flex bg-[#f5f5f0] text-slate-900 overflow-x-hidden">
            {/* Sidebar with Profile Modal */}
            <DashboardSidebar
                tailorData={tailorData}
                onLogout={handleLogout}
                onUpdateTailorData={handleUpdateTailorData}
            />

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 p-3 md:p-6 lg:p-8 dashboard-main-mobile min-w-0">
                <header className="flex justify-between items-center mb-6 md:mb-8 px-1">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 mb-0.5 md:mb-2 flex items-center gap-2">
                            Portfolio
                            <svg className="hidden md:block w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </h1>
                        <p className="text-xs md:text-base text-slate-500">Showcase your best work</p>
                    </div>
                    <button className="px-4 py-2 md:px-6 md:py-3 bg-[#6b4423] text-white text-xs md:text-base rounded-xl font-medium hover:bg-[#573619] transition-all shadow-md md:shadow-lg">
                        + Add Item
                    </button>
                </header>

                {/* Portfolio Display */}
                {portfolioItems.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <div className="flex justify-center mb-4">
                            <svg className="w-16 h-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <p className="text-slate-800 font-bold text-lg">No portfolio items yet</p>
                        <p className="text-slate-500 text-sm">Add your first design to showcase your work.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                        {portfolioItems.map((item, index) => (
                            <div key={index} className="bg-white border border-slate-200 rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-md md:hover:shadow-xl transition-all group">
                                {/* Image Placeholder - Clickable for Preview */}
                                <div
                                    onClick={() => {
                                        setLightboxIndex(index);
                                        setShowLightbox(true);
                                    }}
                                    className="w-full h-32 md:h-48 bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center relative overflow-hidden cursor-pointer group-hover:opacity-95"
                                >
                                    <div className="text-slate-300 group-hover:scale-110 transition-transform duration-500">
                                        {item.category === 'Menswear' ? (
                                            <svg className="w-12 h-12 md:w-16 md:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        ) : item.category === 'Womenswear' ? (
                                            <svg className="w-12 h-12 md:w-16 md:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                        ) : (
                                            <svg className="w-12 h-12 md:w-16 md:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        )}
                                    </div>
                                    <div className="absolute top-2 right-2 md:top-3 md:right-3 px-2 py-0.5 md:px-3 md:py-1 bg-white/95 rounded-full text-[9px] md:text-xs font-bold text-[#6b4423] shadow-sm">
                                        {item.category}
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="bg-white/90 p-2 rounded-full shadow-sm backdrop-blur-sm transform scale-75 group-hover:scale-100 transition-all">
                                            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-3 md:p-6">
                                    <h3 className="text-sm md:text-lg font-bold text-slate-800 mb-0.5 md:mb-2 truncate">{item.title}</h3>
                                    <p className="hidden md:block text-sm text-slate-600 mb-4 line-clamp-2">{item.description}</p>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4 mt-1 md:mt-0">
                                        <span className="text-base md:text-xl font-bold text-[#6b4423]">{item.price}</span>
                                        <button className="w-full md:w-auto px-3 py-1.5 bg-amber-50 text-[#6b4423] rounded-lg text-[10px] md:text-sm font-bold hover:bg-[#6b4423] hover:text-white transition-all border border-amber-100 md:border-none">
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Lightbox Preview Modal */}
            {showLightbox && portfolioItems[lightboxIndex] && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowLightbox(false)}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {/* Image Container */}
                        <div className="w-full md:w-3/5 bg-slate-100 relative flex items-center justify-center h-[40vh] md:h-auto min-h-[300px]">
                            {/* Render placeholder SVG if no actual image URL (since these are hardcoded items with no img url in this file yet) */}
                            <div className="text-slate-300 transform scale-150">
                                {portfolioItems[lightboxIndex].category === 'Menswear' ? (
                                    <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                ) : portfolioItems[lightboxIndex].category === 'Womenswear' ? (
                                    <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                ) : (
                                    <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                )}
                            </div>

                            {/* Nav Arrows */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : portfolioItems.length - 1));
                                }}
                                className="absolute left-4 p-2 rounded-full bg-white/80 text-slate-800 hover:bg-white shadow-lg backdrop-blur-sm transition-transform active:scale-95"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIndex((prev) => (prev < portfolioItems.length - 1 ? prev + 1 : 0));
                                }}
                                className="absolute right-4 p-2 rounded-full bg-white/80 text-slate-800 hover:bg-white shadow-lg backdrop-blur-sm transition-transform active:scale-95"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>

                        {/* Details */}
                        <div className="w-full md:w-2/5 p-8 bg-white flex flex-col justify-between">
                            <div>
                                <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-100">
                                    {portfolioItems[lightboxIndex].category}
                                </span>
                                <h2 className="text-3xl font-bold text-slate-800 mb-2 font-serif">{portfolioItems[lightboxIndex].title}</h2>
                                <p className="text-2xl font-bold text-[#6b4423] mb-6">{portfolioItems[lightboxIndex].price}</p>
                                <hr className="border-slate-100 mb-6" />
                                <p className="text-slate-600 leading-relaxed font-light">
                                    {portfolioItems[lightboxIndex].description}
                                </p>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button className="flex-1 py-3 bg-[#6b4423] text-white rounded-xl font-medium hover:bg-[#573619] transition-colors shadow-md">
                                    Edit Details
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Delete this item?')) {
                                            // Mock delete
                                            setShowLightbox(false);
                                        }
                                    }}
                                    className="px-4 py-3 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TailorPortfolio
