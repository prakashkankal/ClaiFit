import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TailorBottom from './tailor_bottom';
import API_URL from '../../config/api';

const TailorDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tailor, setTailor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [navScrolled, setNavScrolled] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [showLightbox, setShowLightbox] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Review State
    const [ratingInput, setRatingInput] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [menuOpenReviewId, setMenuOpenReviewId] = useState(null);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    const handleShareProfile = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: tailor?.shopName || 'Tailor Profile',
                    text: `Check out ${tailor?.shopName} on KStitch!`,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            const text = encodeURIComponent(`Check out ${tailor?.shopName} on KStitch! ${window.location.href}`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    };

    const handleLikeProfile = () => {
        setIsLiked(!isLiked);
        // Here you would typically call an API to persist the like
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setMenuOpenReviewId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchTailor = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/api/tailors/${id}`);

                if (!response.ok) {
                    throw new Error('Tailor not found');
                }

                const data = await response.json();
                setTailor(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTailor();
    }, [id]);

    // Scroll behavior for secondary navbar (shows at 60% scroll)
    useEffect(() => {
        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercentage = (window.scrollY / scrollHeight) * 100;
            setNavScrolled(scrollPercentage >= 60);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Smooth scroll to section
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return 'TL';
        const words = name.split(' ');
        if (words.length >= 2) {
            return `${words[0][0]}${words[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Render rating stars
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <svg key={i} className="w-4 h-4 fill-amber-400" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <svg key={i} className="w-4 h-4 fill-amber-400" viewBox="0 0 20 20">
                        <defs>
                            <linearGradient id={`half-${i}`}>
                                <stop offset="50%" stopColor="rgb(251, 191, 36)" />
                                <stop offset="50%" stopColor="rgb(226, 232, 240)" />
                            </linearGradient>
                        </defs>
                        <path fill={`url(#half-${i})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                );
            } else {
                stars.push(
                    <svg key={i} className="w-4 h-4 fill-slate-300" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                );
            }
        }
        return stars;
    };

    // Helper to get authenticated user consistently
    const getAuthenticatedUser = () => {
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            return userInfoStr ? JSON.parse(userInfoStr) : null;
        } catch (error) {
            console.error('Error parsing auth user:', error);
            return null;
        }
    };

    const checkAuth = () => {
        const user = getAuthenticatedUser();
        if (!user) {
            setShowLoginModal(true);
            return false;
        }
        return true;
    };

    const handleEditReview = (review) => {
        setReviewText(review.comment);
        setRatingInput(review.rating);
        setEditingReviewId(review._id);
        const form = document.getElementById('review-form');
        if (form) form.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;

        const user = getAuthenticatedUser();
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/api/tailors/${id}/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}` // Assuming token might be needed, though simplistic auth usually relies on backend session or checking user ID in body/params if no token. Let's send user ID in body just in case if pure REST isn't fully set up, or standard headers. Given "userInfo" structure usually has tokens.
                },
                body: JSON.stringify({ userId: user._id }) // Passing userId for backend verification if needed
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete review');
            }

            // Update state
            setTailor(prev => ({
                ...prev,
                reviews: prev.reviews.filter(r => r._id !== reviewId),
                totalReviews: Math.max(0, (prev.totalReviews || 1) - 1)
                // Note: Recalculating average rating accurately requires re-fetching or complex math removing the specific weight. 
                // For simplicity/safety, we will just re-fetch the tailor details silently or accept a slight drift until refresh.
                // Or better:
            }));

            // Re-fetch to ensure rating calculations are perfect
            const refetchResponse = await fetch(`${API_URL}/api/tailors/${id}`);
            if (refetchResponse.ok) {
                const updatedData = await refetchResponse.json();
                setTailor(updatedData);
            }

            alert('Review deleted successfully');
        } catch (error) {
            alert(error.message);
        }
    };

    const handleSubmitReview = async () => {
        const user = getAuthenticatedUser();

        // 1. Auth check
        if (!user) {
            setShowLoginModal(true);
            return;
        }

        // 2. Role validation
        if (user.role !== 'customer') {
            alert('Only customers can submit reviews.');
            return;
        }

        // 3. Form validation
        if (ratingInput === 0) {
            alert('Please select a rating');
            return;
        }
        if (!reviewText.trim()) {
            alert('Please write a review');
            return;
        }

        try {
            setReviewSubmitting(true);

            const url = editingReviewId
                ? `${API_URL}/api/tailors/${id}/reviews/${editingReviewId}`
                : `${API_URL}/api/tailors/${id}/reviews`;

            const method = editingReviewId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerId: user._id,
                    customerName: user.name,
                    rating: ratingInput,
                    comment: reviewText,
                    userId: user._id // Ensure ownership check on backend
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Failed to ${editingReviewId ? 'update' : 'submit'} review`);
            }

            // Re-fetch tailor data to get updated averages and lists cleanly
            const refetchResponse = await fetch(`${API_URL}/api/tailors/${id}`);
            if (refetchResponse.ok) {
                const updatedData = await refetchResponse.json();
                setTailor(updatedData);
            } else {
                // Fallback optimistic update if fetch fails
                setTailor(prev => {
                    const updatedReviews = editingReviewId
                        ? prev.reviews.map(r => r._id === editingReviewId ? data : r)
                        : [data, ...(prev.reviews || [])];

                    return {
                        ...prev,
                        reviews: updatedReviews,
                        totalReviews: editingReviewId ? prev.totalReviews : (prev.totalReviews || 0) + 1
                    };
                });
            }

            setRatingInput(0);
            setReviewText('');
            setEditingReviewId(null);
            alert(`Review ${editingReviewId ? 'updated' : 'submitted'} successfully!`);
        } catch (error) {
            alert(error.message);
        } finally {
            setReviewSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#6b4423] mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading tailor details...</p>
                </div>
            </div>
        );
    }

    if (error || !tailor) {
        return (
            <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Tailor Not Found</h2>
                    <p className="text-slate-600 mb-4">{error || 'The tailor you are looking for does not exist.'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-[#6b4423] text-white rounded-lg hover:bg-[#573619] transition-colors"
                    >
                        Back to Homepage
                    </button>
                </div>
            </div>
        );
    }

    const portfolioImages = tailor.portfolio || [];
    const filteredPortfolio = activeFilter === 'All'
        ? portfolioImages
        : portfolioImages.filter(item => item.category === activeFilter);

    return (
        <div className="min-h-screen bg-white pb-24 md:pb-0">
            {/* MOBILE: Sticky Top Controls */}
            <div className="md:hidden absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 bg-linear-to-b from-black/50 to-transparent pointer-events-none">
                <button onClick={() => navigate(-1)} className="bg-white/90 flex items-center justify-center align-center backdrop-blur-sm p-2 rounded-full shadow-sm pointer-events-auto hover:bg-white transition-colors">
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* SECONDARY NAVIGATION - Desktop Only */}
            <nav className={`hidden md:block fixed top-20 left-0 right-0 z-50 bg-[#D4C4B0] backdrop-blur-md shadow-sm transition-all duration-500 py-3 ${navScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative">
                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => scrollToSection('portfolio')} className="text-sm font-medium text-slate-700 hover:text-[#6b4423] transition-colors">Portfolio</button>
                        <button onClick={() => scrollToSection('services')} className="text-sm font-medium text-slate-700 hover:text-[#6b4423] transition-colors">Services</button>
                        <button onClick={() => scrollToSection('reviews')} className="text-sm font-medium text-slate-700 hover:text-[#6b4423] transition-colors">Reviews</button>
                        <button onClick={() => scrollToSection('location')} className="text-sm font-medium text-slate-700 hover:text-[#6b4423] transition-colors">Location</button>
                        <button onClick={() => scrollToSection('contact')} className="text-sm font-medium text-slate-700 hover:text-[#6b4423] transition-colors">Contact</button>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <div className="md:pt-28 md:px-6">
                <div className="max-w-7xl mx-auto">

                    {/* Facebook-style Profile Header */}
                    <div className="relative mb-8">
                        {/* Banner Image */}
                        <div className="w-full h-48 md:h-[350px] bg-gray-200 md:rounded-xl overflow-hidden relative group">
                            {tailor.bannerImage ? (
                                <img
                                    src={tailor.bannerImage}
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-linear-to-r from-[#d4c4b0] to-[#c7b299] flex items-center justify-center opacity-80">
                                    <svg className="w-24 h-24 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                        </div>

                        {/* Profile Picture & Info Container */}
                        <div className="max-w-7xl mx-auto px-4 md:px-8 absolute w-full -bottom-16 md:-bottom-12 flex items-end">
                            {/* Profile Picture */}
                            <div className="relative z-10">
                                <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden flex items-center justify-center">
                                    {tailor.shopImage ? (
                                        <img src={tailor.shopImage} alt={tailor.shopName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl md:text-5xl font-bold text-[#6b4423]">{getInitials(tailor.shopName)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tailor Info Section */}
                    <div className="mt-20 md:mt-16 px-4 md:px-8 max-w-7xl mx-auto mb-8">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 font-serif">{tailor.shopName}</h1>

                                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm mb-4">
                                    <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                        <svg className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="font-bold text-gray-800">{(tailor.rating || 0).toFixed(1)}</span>
                                        <span className="text-slate-500">({tailor.totalReviews || 0} reviews)</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{tailor.address?.city}, {tailor.address?.state}</span>
                                    </div>

                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold border border-gray-200">
                                        {tailor.specialization?.charAt(0).toUpperCase() + tailor.specialization?.slice(1) || 'All Types'}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons (Request Consultation / Save) */}
                            <div className="flex items-center gap-3">
                                <button onClick={() => scrollToSection('contact')} className="flex-1 md:flex-none bg-[#6b4423] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#573619] transition-colors shadow-sm active:scale-95 transform">
                                    Contact Now
                                </button>
                                <button
                                    onClick={handleLikeProfile}
                                    className={`p-2.5 border rounded-lg transition-colors ${isLiked ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-300 hover:bg-gray-50 text-gray-600'}`}
                                >
                                    <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleShareProfile}
                                    className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
                <div className="grid grid-cols-1 gap-12">
                    {/* Main Content Area - Full Width */}
                    <div className="w-full space-y-8 md:space-y-12">
                        {/* Introduction */}
                        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">About {tailor.name}</h2>
                            <p className="text-slate-600 leading-relaxed mb-8 text-base md:text-lg">
                                {tailor.shopDescription || `Professional tailor with ${tailor.experience} years of experience specializing in ${tailor.specialization} tailoring.`}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50/50 border border-green-100 hover:border-green-200 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-slate-700">On-time delivery</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/50 border border-purple-100 hover:border-purple-200 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-slate-700">Perfect fitting guarantee</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100 hover:border-amber-200 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-slate-700">Premium finishing</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100 hover:border-blue-200 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-slate-700">{tailor.experience}+ years experience</span>
                                </div>
                            </div>
                        </section>


                        <hr className="border-slate-200" />

                        {/* Services */}
                        <section id="services">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-8 bg-[#6b4423] rounded-full block"></span>
                                Services Offered
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {(tailor.services && tailor.services.length > 0 ? tailor.services : ['Custom Tailoring', 'Alterations', 'Repairs']).map((service, idx) => (
                                    <div key={idx} className="group p-5 bg-white border border-slate-200 rounded-xl hover:border-[#6b4423] hover:shadow-md transition-all duration-300 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-[#6b4423]/5 group-hover:bg-[#6b4423]/10 flex items-center justify-center transition-colors">
                                            <svg className="w-6 h-6 text-[#6b4423]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="font-semibold text-gray-800 group-hover:text-[#6b4423] transition-colors">{service}</span>
                                    </div>
                                ))}
                            </div>
                        </section>


                        <hr className="border-slate-200" />

                        {/* Portfolio */}
                        <section id="portfolio">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio</h2>
                            {portfolioImages.length > 0 ? (
                                <>
                                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 flex-nowrap no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                                        {['All', 'Shirts', 'Suits', 'Blouses', 'Dresses', 'Ethnic'].map((filter) => (
                                            <button
                                                key={filter}
                                                onClick={() => setActiveFilter(filter)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${activeFilter === filter
                                                    ? 'bg-[#6b4423] text-white'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {filter}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {filteredPortfolio.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    navigate(`/tailor/${id}/posts`, {
                                                        state: {
                                                            posts: filteredPortfolio,
                                                            initialIndex: idx
                                                        }
                                                    });
                                                }}
                                                className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative"
                                            >
                                                <img
                                                    src={item.images?.[0] || item.image || item}
                                                    alt={item.title || `Portfolio ${idx + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                                {item.title && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-sm">
                                                        {item.title}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-slate-500">No portfolio images available</p>
                            )}
                        </section>

                        <hr className="border-slate-200" />

                        {/* Reviews */}
                        <section id="reviews">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
                                <div className="flex items-center gap-1 font-semibold text-gray-900">
                                    <svg className="w-5 h-5 fill-amber-400" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span>{(tailor.rating || 0).toFixed(1)}</span>
                                </div>
                            </div>

                            {/* 1) Add Review Input */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100" id="review-form">
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    onClick={() => checkAuth()}
                                    placeholder="Write your review..."
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#6b4423] focus:ring-1 focus:ring-[#6b4423] resize-none h-20 mb-3"
                                ></textarea>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <svg
                                                key={star}
                                                onClick={() => {
                                                    if (checkAuth()) setRatingInput(star);
                                                }}
                                                className={`w-6 h-6 cursor-pointer transition-colors ${ratingInput >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        {editingReviewId && (
                                            <button
                                                onClick={() => {
                                                    setEditingReviewId(null);
                                                    setRatingInput(0);
                                                    setReviewText('');
                                                }}
                                                className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            onClick={handleSubmitReview}
                                            disabled={reviewSubmitting}
                                            className={`px-4 py-1.5 bg-[#6b4423] text-white text-sm font-medium rounded-lg hover:bg-[#573619] transition-colors ${reviewSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {reviewSubmitting ? 'Processing...' : (editingReviewId ? 'Update Review' : 'Post Review')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 2 & 3) Horizontal Scroll (Mobile) / Grid (Desktop) */}
                            <div className={`gap-4 ${showAllReviews ? 'grid grid-cols-1 md:grid-cols-2' : 'flex overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:grid md:grid-cols-2 md:gap-6 md:pb-0 md:mx-0 md:px-0 scrollbar-hide'}`}>
                                {tailor.reviews && tailor.reviews.length > 0 ? (
                                    tailor.reviews.slice(0, showAllReviews ? tailor.reviews.length : 6).map((review, idx) => (
                                        <div key={idx} className={`${!showAllReviews ? 'min-w-[85vw] md:min-w-0 snap-center' : ''} border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col h-full hover:border-[#6b4423] transition-colors relative group`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#6b4423] text-white flex items-center justify-center font-bold text-sm">
                                                        {review.customerName ? review.customerName[0].toUpperCase() : 'A'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm">{review.customerName || 'Anonymous'}</div>
                                                        <div className="flex items-center gap-0.5">
                                                            {renderStars(review.rating || 0)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {review.date ? new Date(review.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 md:line-clamp-none mb-2">"{review.comment}"</p>

                                            {/* Edit/Delete Actions for Own Reviews - Top Right Menu */}
                                            {getAuthenticatedUser() && review.customerId === getAuthenticatedUser()?._id && (
                                                <div className="absolute top-4 right-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMenuOpenReviewId(menuOpenReviewId === review._id ? null : review._id);
                                                        }}
                                                        className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                        </svg>
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {menuOpenReviewId === review._id && (
                                                        <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 z-10 p-1.5 flex gap-1 animation-fade-in-fast min-w-[80px] justify-center">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditReview(review);
                                                                    setMenuOpenReviewId(null);
                                                                }}
                                                                className="p-2 text-gray-500 hover:bg-gray-100 hover:text-[#6b4423] rounded-md transition-colors"
                                                                title="Edit"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteReview(review._id);
                                                                    setMenuOpenReviewId(null);
                                                                }}
                                                                className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                                                                title="Delete"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-500 col-span-2 text-center py-6 bg-slate-50 rounded-lg">No reviews yet. Be the first to review!</p>
                                )}
                            </div>

                            {/* 4) View All Reviews Button */}
                            {tailor.reviews && tailor.reviews.length > 6 && (
                                <button
                                    onClick={() => setShowAllReviews(!showAllReviews)}
                                    className="w-full mt-2 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                                >
                                    {showAllReviews ? 'Show fewer reviews' : `Show all ${tailor.reviews.length} reviews`}
                                </button>
                            )}
                        </section>

                        <hr className="border-slate-200" />

                        {/* Location */}
                        <section id="location">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">Location</h2>
                                {tailor.location?.locationSet && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        Verified Location
                                    </span>
                                )}
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm text-[#6b4423]">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">Shop Address</h3>
                                        <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                                            {tailor.address?.street}<br />
                                            {tailor.address?.city}, {tailor.address?.state} {tailor.address?.pincode}
                                        </p>

                                        <a
                                            href={tailor.location?.locationSet && tailor.location?.latitude
                                                ? `https://www.google.com/maps/search/?api=1&query=${tailor.location.latitude},${tailor.location.longitude}`
                                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([tailor.shopName, tailor.address?.street, tailor.address?.city, tailor.address?.state].filter(Boolean).join(', '))}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#6b4423] hover:border-[#6b4423] transition-all group"
                                        >
                                            <span>{tailor.location?.locationSet ? 'View Pinned Location' : 'Open in Maps'}</span>
                                            <svg className="w-4 h-4 text-slate-400 group-hover:text-[#6b4423]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div >

                </div >

                {/* Contact Section */}
                < section id="contact" className="mt-12 pt-12 border-t border-slate-200" >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <a href={`tel:${tailor.phone}`} className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-[#6b4423] transition-colors">
                            <svg className="w-5 h-5 text-[#6b4423]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <div>
                                <div className="text-xs text-slate-600">Phone</div>
                                <div className="text-sm font-medium text-slate-900">{tailor.phone}</div>
                            </div>
                        </a>
                        <a href={`mailto:${tailor.email}`} className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-[#6b4423] transition-colors">
                            <svg className="w-5 h-5 text-[#6b4423]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <div>
                                <div className="text-xs text-slate-600">Email</div>
                                <div className="text-sm font-medium text-slate-900">{tailor.email}</div>
                            </div>
                        </a>
                        <a href={`https://wa.me/${tailor.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-green-600 transition-colors">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <div>
                                <div className="text-xs text-slate-600">WhatsApp</div>
                                <div className="text-sm font-medium text-slate-900">Message Us</div>
                            </div>
                        </a>
                    </div>
                </section >
            </div >

            {/* Floating WhatsApp Button */}
            < TailorBottom
                tailor={tailor}
                showLightbox={showLightbox}
                setShowLightbox={setShowLightbox}
                filteredPortfolio={filteredPortfolio}
                lightboxIndex={lightboxIndex}
                setLightboxIndex={setLightboxIndex}
            />
            {/* Login Required Modal */}
            {
                showLoginModal && (
                    <div className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        {/* Dimmed Background */}
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowLoginModal(false)}
                        ></div>

                        {/* Modal Content */}
                        <div className="relative w-full md:w-[480px] bg-white rounded-t-2xl md:rounded-2xl p-6 shadow-2xl transform transition-all animate-in slide-in-from-bottom duration-300">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
                                <p className="text-gray-500">Please log in to write a review for this tailor.</p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full py-3.5 bg-[#6b4423] text-white rounded-xl font-semibold text-base hover:bg-[#573619] active:scale-[0.98] transition-transform shadow-sm"
                                >
                                    Login / Sign up
                                </button>
                                <button
                                    onClick={() => setShowLoginModal(false)}
                                    className="w-full py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-base hover:bg-gray-50 active:scale-[0.98] transition-transform"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
export default TailorDetailPage;
