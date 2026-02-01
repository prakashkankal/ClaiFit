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
                                {/* Image Placeholder */}
                                <div className="w-full h-32 md:h-48 bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center relative overflow-hidden">
                                    <div className="text-slate-300 group-hover:scale-110 transition-transform">
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
        </div>
    )
}

export default TailorPortfolio
