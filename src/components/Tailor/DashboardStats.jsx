import React, { useState, useEffect } from 'react'
import axios from 'axios'

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
                const { data } = await axios.get(`http://localhost:5000/api/orders/${tailorId}`);
                const orders = data.orders || [];

                // Get today's date (start and end of day)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                // Calculate work-focused stats
                const ordersDueToday = orders.filter(order => {
                    if (!order.dueDate) return false;
                    const dueDate = new Date(order.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate.getTime() === today.getTime();
                }).length;

                const pendingCutting = orders.filter(order =>
                    order.status === 'Order Created'
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
            icon: '⏰',
            highlight: stats.ordersDueToday > 0,
            bgColor: stats.ordersDueToday > 0 ? 'bg-red-50 border-red-300' : 'bg-white border-gray-300'
        },
        {
            title: 'Pending Cutting',
            value: loading ? '...' : stats.pendingCutting,
            icon: '✂️',
            subtitle: 'Order Created',
            bgColor: 'bg-white border-gray-300'
        },
        {
            title: 'Pending Stitching',
            value: loading ? '...' : stats.pendingStitching,
            icon: '🧵',
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statsDisplay.map((stat, index) => (
                <div key={index} className={`${stat.bgColor} border-2 border-dashed p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-4xl">{stat.icon}</div>
                        {stat.highlight && (
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full animate-pulse">
                                Action Needed
                            </span>
                        )}
                    </div>
                    <h3 className="text-slate-500 text-sm font-medium">{stat.title}</h3>
                    {stat.subtitle && (
                        <p className="text-xs text-slate-400 mt-1">{stat.subtitle}</p>
                    )}
                    <p className={`text-3xl font-bold mt-1 ${stat.highlight ? 'text-red-600' : 'text-slate-800'}`}>
                        {stat.value}
                    </p>
                </div>
            ))}
        </div>
    )
}

export default DashboardStats
