import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerReviews from '../../components/Tailor/CustomerReviews'
import DashboardSidebar from '../../components/Tailor/DashboardSidebar'

const TailorReviews = () => {
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

    if (!tailorData) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[#f5f5f0]">
                <div className="text-slate-600 text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex bg-[#f5f5f0] text-slate-900">
            <DashboardSidebar
                tailorData={tailorData}
                onLogout={handleLogout}
                onUpdateTailorData={handleUpdateTailorData}
            />
            <main className="flex-1 lg:ml-72 p-4 md:p-6 lg:p-8 dashboard-main-mobile">
                <header className="mb-8">
                    <h1 className="text-3xl font-serif font-bold text-slate-800">
                        Customer Reviews
                    </h1>
                    <p className="text-slate-600 mt-1">See what your customers are saying about you.</p>
                </header>
                <CustomerReviews tailorId={tailorData._id} />
            </main>
        </div>
    )
}

export default TailorReviews
