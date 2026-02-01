import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MobileSearchScreen from './MobileSearchScreen';
import SearchBar from './SearchBar';

const Navbar = ({ showSearchBar = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [user, setUser] = useState(null);

    // Check if current page is an authentication page
    const isAuthPage = ['/register', '/login', '/signup'].includes(location.pathname);

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

    // Handle scroll for navbar background transition
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
        navigate('/');
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const isHome = location.pathname === '/';
    const shouldShowSolidNavbar = isScrolled || !isHome;

    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    // Mobile Navbar Background - Transparent at start, Gradient on scroll or on other pages
    const mobileNavClasses = `md:hidden fixed top-0 left-0 right-0 z-50 h-16 px-4 flex items-center justify-between transition-all duration-300 ${shouldShowSolidNavbar
        ? 'bg-gradient-to-br from-[#F5F1EB] via-[#E8DFD4] to-[#D4C4B0] shadow-sm'
        : 'bg-transparent'
        }`;

    return (
        <>
            {/* Mobile Navbar */}
            <nav className={mobileNavClasses}>
                {/* Left: Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-[#4A3B32]" style={{ fontFamily: '"Playfair Display", serif' }}>
                        Claifit
                    </span>
                </Link>

                {/* Right: Search Icon (Conditional) */}
                <div className={`transition-opacity duration-300 ${showSearchBar ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                    <button
                        onClick={() => setMobileSearchOpen(true)}
                        className="p-2 text-[#4A3B32] hover:bg-black/5 rounded-full transition-colors"
                        aria-label="Search"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Mobile Search Screen */}
            {mobileSearchOpen && (
                <MobileSearchScreen onClose={() => setMobileSearchOpen(false)} />
            )}

            {/* Desktop Navbar (Existing) */}
            <nav
                className={`hidden md:block md:fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${shouldShowSolidNavbar
                    ? 'bg-[#D4C4B0] shadow-md'
                    : 'bg-transparent'
                    }`}
                style={{
                    height: '80px',
                    backdropFilter: shouldShowSolidNavbar ? 'none' : 'blur(10px)'
                }}
            >
                <div className="w-full h-full px-6 lg:px-12 flex items-center justify-between">
                    {/* Left: Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold tracking-tight text-[#4A3B32]" style={{ fontFamily: '"Playfair Display", serif' }}>
                                Claifit
                            </span>
                        </div>
                    </Link>

                    {/* Center: Search Bar (shown when showSearchBar is true) */}
                    {showSearchBar && (
                        <div className="hidden lg:block flex-1 max-w-2xl mx-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
                            <SearchBar compact={true} />
                        </div>
                    )}

                    {/* Right: Actions - Hidden on mobile (using bottom nav instead) */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Become a Tailor Link */}
                        {!isAuthPage && location.pathname !== '/register' && (
                            <Link
                                to="/register"
                                className={`text-sm font-semibold transition-colors duration-300 hover:text-[#8B7355] ${isScrolled ? 'text-gray-800' : 'text-gray-900'
                                    }`}
                                style={{ fontFamily: '"Inter", "Poppins", sans-serif' }}
                            >
                                Become a Tailor
                            </Link>
                        )}

                        {/* User Profile or Login */}
                        {user ? (
                            <Link to="/profile" className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${isScrolled
                                ? 'bg-gray-100 hover:bg-gray-200'
                                : 'bg-white/90 hover:bg-white'
                                }`}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gradient-to-r from-[#8B7355] to-[#6B5444] text-white">
                                    {getInitials(user.name)}
                                </div>
                                <span className="text-sm text-gray-900 font-medium">{user.name}</span>
                            </Link>
                        ) : (
                            !isAuthPage && (
                                <Link
                                    to="/login"
                                    className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${isScrolled
                                        ? 'bg-gradient-to-r from-[#8B7355] to-[#6B5444] text-white hover:from-[#6B5444] hover:to-[#5A4535]'
                                        : 'bg-gradient-to-r from-[#8B7355] to-[#6B5444] text-white hover:from-[#6B5444] hover:to-[#5A4535]'
                                        } shadow-md hover:shadow-lg`}
                                    style={{ fontFamily: '"Inter", "Poppins", sans-serif' }}
                                >
                                    Login / Sign up
                                </Link>
                            )
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navbar;