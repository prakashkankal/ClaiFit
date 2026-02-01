import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../../components/Tailor/DashboardSidebar'

const TailorSettings = () => {
    const navigate = useNavigate();
    const [tailorData, setTailorData] = useState(null);

    // Business hours state
    const [businessHours, setBusinessHours] = useState({
        Monday: { open: '09:00', close: '18:00', closed: false },
        Tuesday: { open: '09:00', close: '18:00', closed: false },
        Wednesday: { open: '09:00', close: '18:00', closed: false },
        Thursday: { open: '09:00', close: '18:00', closed: false },
        Friday: { open: '09:00', close: '18:00', closed: false },
        Saturday: { open: '09:00', close: '18:00', closed: false },
        Sunday: { open: '09:00', close: '18:00', closed: true }
    });

    // Mobile state
    const [expandedDay, setExpandedDay] = useState(new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()));
    const [notifications, setNotifications] = useState({
        email: true,
        sms: true,
        updates: true,
        messages: true
    });

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

    // Initialize business hours when tailorData loads
    useEffect(() => {
        if (tailorData?.businessHours) {
            const hours = {};
            if (tailorData.businessHours instanceof Map) {
                tailorData.businessHours.forEach((value, key) => {
                    hours[key] = value;
                });
            } else {
                Object.assign(hours, tailorData.businessHours);
            }
            setBusinessHours(hours);
        }
    }, [tailorData]);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const handleHoursChange = (day, field, value) => {
        setBusinessHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value
            }
        }));
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
        <div className="w-full min-h-screen flex bg-[#f5f5f0] text-slate-900 overflow-x-hidden">
            {/* Sidebar with Profile Modal */}
            <DashboardSidebar
                tailorData={tailorData}
                onLogout={handleLogout}
                onUpdateTailorData={handleUpdateTailorData}
            />

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 p-3 md:p-6 lg:p-8 dashboard-main-mobile min-w-0 pb-52">
                <header className="mb-6 md:mb-8 px-1">
                    <div className="flex items-center gap-3 mb-1 md:mb-2">
                        {/* Mobile Back Button */}
                        <button
                            onClick={() => navigate('/dashboard/profile')}
                            className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 active:bg-slate-100 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 flex items-center gap-2">
                            Settings
                            <svg className="hidden md:block w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </h1>
                    </div>
                    <p className="text-sm md:text-base text-slate-500 ml-12 md:ml-0">Manage your account and preferences</p>
                </header>

                <div className="space-y-6">
                    {/* Business Hours Section */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6">Business Hours</h2>

                        {/* Desktop View - Preservation Table */}
                        <div className="hidden md:block space-y-4">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                <div key={day} className="flex items-center justify-between">
                                    <span className="text-slate-700 font-medium w-32">{day}</span>
                                    <div className="flex gap-4 items-center">
                                        <input
                                            type="time"
                                            value={businessHours[day]?.open || '09:00'}
                                            onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                            disabled={businessHours[day]?.closed}
                                            className="px-4 py-2 rounded-lg bg-white/60 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6b4423] disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <span className="text-slate-500 font-medium">to</span>
                                        <input
                                            type="time"
                                            value={businessHours[day]?.close || '18:00'}
                                            onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                            disabled={businessHours[day]?.closed}
                                            className="px-4 py-2 rounded-lg bg-white/60 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6b4423] disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-600 font-medium">Closed</span>
                                            <button
                                                onClick={() => handleHoursChange(day, 'closed', !businessHours[day]?.closed)}
                                                className={`w-[48px] h-[24px] rounded-full p-[2px] flex items-center transition-colors duration-200 outline-none ${businessHours[day]?.closed ? 'bg-red-500' : 'bg-slate-300'}`}
                                            >
                                                <div className={`w-[20px] h-[20px] bg-white rounded-full transition-transform duration-200 shadow-sm ${businessHours[day]?.closed ? 'translate-x-[24px]' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mobile View - Vertical Accordion List */}
                        <div className="md:hidden flex flex-col gap-2">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                <div key={day} className="border border-slate-100 rounded-xl overflow-hidden active:bg-slate-50 transition-colors">
                                    {/* Accordion Header */}
                                    <button
                                        onClick={() => setExpandedDay(expandedDay === day ? null : day)}
                                        className="w-full flex items-center justify-between p-4 bg-white"
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-bold text-slate-800">{day}</span>
                                            {!businessHours[day]?.closed && expandedDay !== day && (
                                                <span className="text-[10px] text-slate-500 uppercase tracking-tight">{businessHours[day]?.open} — {businessHours[day]?.close}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${businessHours[day]?.closed ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {businessHours[day]?.closed ? 'Closed' : 'Open'}
                                            </span>
                                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedDay === day ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </button>

                                    {/* Accordion Body */}
                                    {expandedDay === day && (
                                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-4 animate-slide-down">
                                            {/* Closed Toggle Switch */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Closed</span>
                                                <button
                                                    onClick={() => handleHoursChange(day, 'closed', !businessHours[day]?.closed)}
                                                    className={`w-[58px] h-[20px] rounded-full p-[10px] flex items-center transition-colors duration-200 outline-none ${businessHours[day]?.closed ? 'bg-red-500' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`w-[20px] h-[20px] bg-white rounded-full transition-transform duration-200 shadow-sm ${businessHours[day]?.closed ? 'translate-x-[24px]' : 'translate-x-0'}`} />
                                                </button>
                                            </div>

                                            {/* Time Pickers Stacked */}
                                            {!businessHours[day]?.closed && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Opening</label>
                                                        <input
                                                            type="time"
                                                            value={businessHours[day]?.open || '09:00'}
                                                            onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                                            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-[#6b4423]"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Closing</label>
                                                        <input
                                                            type="time"
                                                            value={businessHours[day]?.close || '18:00'}
                                                            onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                                            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-[#6b4423]"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <p className="mt-6 text-[10px] md:text-xs text-slate-400 italic font-medium leading-relaxed">
                            Business hours can be saved with your profile updates via the profile modal (click your shop name in the sidebar).
                        </p>
                    </div>

                    {/* Notifications Section */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-14 md:p-6 shadow-sm">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6">Notification Preferences</h2>
                        <div className="space-y-1 md:space-y-4">
                            {[
                                { id: 'email', label: 'Email Notifications' },
                                { id: 'sms', label: 'SMS Notifications' },
                                { id: 'updates', label: 'Order Updates' },
                                { id: 'messages', label: 'Customer Messages' }
                            ].map((item, idx) => (
                                <div key={item.id} className={`flex items-center justify-between py-3 md:py-0 ${idx !== 3 ? 'border-b border-slate-50 md:border-none' : ''}`}>
                                    <span className="text-sm md:text-base text-slate-700 font-medium">{item.label}</span>

                                    {/* Toggle Switches - All Screens */}
                                    <button
                                        onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                        className={`w-[58px]  h-[20px] rounded-full p-[10px] flex items-center transition-colors duration-200 outline-none ${notifications[item.id] ? 'bg-[#6b4423]' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-[20px] h-[20px] bg-white rounded-full transition-transform duration-200 shadow-sm ${notifications[item.id] ? 'translate-x-[24px]' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default TailorSettings
