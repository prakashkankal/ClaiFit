import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardStats from '../../components/Tailor/DashboardStats'
import RecentOrders from '../../components/Tailor/RecentOrders'
import DashboardSidebar from '../../components/Tailor/DashboardSidebar'
import ProfileCompletionModal from '../../components/Tailor/ProfileCompletionModal'
import { calculateProfileCompletion } from '../../utils/profileCompletion'

const Dashboard = () => {
    const navigate = useNavigate();
    const [tailorData, setTailorData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [completionData, setCompletionData] = useState({ percentage: 0, missingFields: [] });

    useEffect(() => {
        // Get logged-in tailor data from localStorage
        const userInfo = localStorage.getItem('userInfo');

        if (!userInfo) {
            // Not logged in, redirect to login
            navigate('/login');
            return;
        }

        try {
            const user = JSON.parse(userInfo);

            // Check if user is a tailor
            if (user.role !== 'tailor' && user.userType !== 'tailor') {
                // Not a tailor, redirect to home
                navigate('/');
                return;
            }

            setTailorData(user);

            // Check Profile Completion
            const completion = calculateProfileCompletion(user);
            setCompletionData(completion);

            const hasSeenModal = sessionStorage.getItem('hasSeenProfileModal');
            if (completion.percentage < 100 && !hasSeenModal) {
                setShowModal(true);
                sessionStorage.setItem('hasSeenProfileModal', 'true');
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
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

    // Get first name from full name
    const getFirstName = (name) => {
        if (!name) return 'Tailor';
        return name.split(' ')[0];
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    if (!tailorData) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[#f5f5f0]">
                <div className="text-slate-600 text-lg">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex bg-[#f5f5f0] text-slate-900">
            {/* Sidebar with Profile Modal */}
            <DashboardSidebar
                tailorData={tailorData}
                onLogout={handleLogout}
                onUpdateTailorData={handleUpdateTailorData}
            />

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-slate-800">
                            Welcome back, {getFirstName(tailorData.name)}! 👋
                        </h1>
                        <p className="text-slate-500">Here's what's happening in your shop today.</p>
                    </div>

                    {/* Mobile: Show Shop Info */}
                    <div className="lg:hidden bg-white/60 p-3 rounded-xl border border-white/50">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-linear-to-br from-[#6b4423] to-[#8b5a3c] rounded-full flex items-center justify-center text-white font-bold text-xs">
                                {tailorData.name?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">{tailorData.shopName}</p>
                                <p className="text-xs text-slate-500">{tailorData.email}</p>
                            </div>
                        </div>
                    </div>
                </header>


                {/* Profile Completion Banner */}
                {tailorData && calculateProfileCompletion(tailorData).percentage < 100 && (
                    <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-fade-in">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                                <span className="font-bold text-sm">{calculateProfileCompletion(tailorData).percentage}%</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Your profile is incomplete</h3>
                                <p className="text-xs text-slate-500">
                                    Complete your profile to unlock full features and appear in search results.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard/profile', { state: { openEditModal: true } })}
                            className="px-4 py-2 bg-[#6b4423] hover:bg-[#573619] text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                        >
                            Complete Now
                        </button>
                    </div>
                )}

                <DashboardStats tailorId={tailorData._id} />
                <RecentOrders tailorId={tailorData._id} />

                <ProfileCompletionModal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    completionData={completionData}
                    tailorData={tailorData}
                />
            </main>
        </div >
    )
}

export default Dashboard
