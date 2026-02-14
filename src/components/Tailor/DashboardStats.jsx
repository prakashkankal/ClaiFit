import React, { useState, useEffect } from 'react'
import axios from 'axios'
import API_URL from '../../config/api'

const DashboardStats = ({ tailorId }) => {
    const [stats, setStats] = useState({
        ordersDueToday: 0,
        pendingCutting: 0,
        pendingStitching: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!tailorId) return;

            try {
                setLoading(true);
                const { data } = await axios.get(`${API_URL}/api/orders/${tailorId}`);
                const orders = data.orders || [];

                // Get today's date (start and end of day)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                // Calculate work-focused stats
                const ordersDueToday = orders.filter(order => {
                    if (order.isManualBill) return false;
                    if (!order.dueDate) return false;
                    if (order.status === 'Delivered' || order.deliveredAt) return false;
                    const dueDate = new Date(order.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate.getTime() === today.getTime();
                }).length;

                const pendingCutting = orders.filter(order =>
                    order.status === 'Order Created' && !order.isManualBill
                ).length;

                const pendingStitching = orders.filter(order =>
                    order.status === 'Cutting Completed'
                ).length;

                setStats({
                    ordersDueToday,
                    pendingCutting,
                    pendingStitching
                });
                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
                setError('Failed to load statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [tailorId]);

    const statsDisplay = [
        {
            title: 'Orders Due Today',
            value: loading ? '...' : stats.ordersDueToday,
            icon: <svg className="w-6 h-6 md:w-10 md:h-10 text-slate-400 group-hover:text-[#6b4423] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            highlight: stats.ordersDueToday > 0,
            bgColor: stats.ordersDueToday > 0 ? 'bg-red-50 border-red-300' : 'bg-white border-gray-300'
        },
        {
            title: 'Pending Cutting',
            value: loading ? '...' : stats.pendingCutting,
            icon: <svg className="w-6 h-6 md:w-10 md:h-10 text-slate-400 group-hover:text-[#6b4423] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>,
            subtitle: 'Order Created',
            bgColor: 'bg-white border-gray-300'
        },
        {
            title: 'Pending Stitching',
            value: loading ? '...' : stats.pendingStitching,
            icon: <svg className="w-6 h-6 md:w-10 md:h-10 text-slate-400 group-hover:text-[#6b4423] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
            subtitle: 'Cutting Completed',
            bgColor: 'bg-white border-gray-300'
        },
    ];

    if (error) {
        return (
            <div className="mb-8 p-6 bg-red-100 border border-red-400 text-red-700 rounded-2xl">
                {error}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 md:grid-cols-3 gap-1.5 md:gap-6 mb-4 md:mb-8 max-w-full overflow-hidden">
            {statsDisplay.map((stat, index) => (
                <div
                    key={index}
                    className={`${stat.bgColor} border border-gray-200 shadow-sm p-1.5 md:p-6 rounded-lg md:rounded-2xl transition-all flex flex-col items-center md:items-start text-center md:text-left min-w-0`}
                >
                    <div className="flex justify-between items-start mb-1 md:mb-4 w-full">
                        <div className="text-lg md:text-4xl mx-auto md:mx-0">{stat.icon}</div>
                        {stat.highlight && (
                            <span className="hidden md:block text-[10px] md:text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 md:py-1 rounded-full animate-pulse whitespace-nowrap ml-1">
                                Action Needed
                            </span>
                        )}
                    </div>
                    <h3 className="text-slate-500 text-[8px] md:text-sm font-medium leading-tight mb-0.5 md:mb-1 px-0.5">{stat.title}</h3>
                    <p className={`text-lg md:text-3xl font-bold ${stat.highlight ? 'text-red-600' : 'text-slate-800'}`}>
                        {stat.value}
                    </p>
                </div>
            ))}
        </div>
    )
}

export default DashboardStats
