import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Check if user is logged in
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                setUser(JSON.parse(userInfo));
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, [location.pathname]);

    // Hide BottomNav on Tailor pages, Orders, and Auth pages
    const isTailorPage =
        location.pathname.startsWith('/dashboard') ||
        location.pathname.startsWith('/orders') ||
        location.pathname === '/new-order' ||
        /^\/tailor\/[^/]+$/.test(location.pathname);

    const isAuthPage = ['/login', '/signup', '/register'].some(path => location.pathname.startsWith(path));

    if (isTailorPage || isAuthPage) {
        return null;
    }

    const isActive = (path) => location.pathname === path;

    // Get the appropriate orders path based on user type
    const getOrdersPath = () => {
        if (user?.userType === 'tailor') {
            return '/orders';
        }
        return '/my-orders';
    };

    const getProfilePath = () => {
        if (user?.userType === 'tailor') {
            return '/tailor-dashboard';
        }
        return '/profile';
    };

    const navItems = [
        {
            name: 'Explore',
            path: '/',
            icon: (active) => (
                <svg className={`w-6 h-6 ${active ? 'fill-current' : 'stroke-current'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            )
        },
        {
            name: 'Orders',
            path: getOrdersPath(),
            icon: (active) => (
                <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            requiresAuth: true
        },
        {
            name: user ? 'Profile' : 'Login',
            path: user ? getProfilePath() : '/login',
            icon: (active) => (
                <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        }
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] safe-area-bottom">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    // Skip items that require auth if user is not logged in
                    if (item.requiresAuth && !user) return null;

                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 min-w-[64px] ${active
                                ? 'text-[#8B7355]'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <div className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                                {item.icon(active)}
                            </div>
                            <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
