import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TailorBottom from './tailor_bottom';

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

    useEffect(() => {
        const fetchTailor = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:5000/api/tailors/${id}`);

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

    const checkAuth = () => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            setShowLoginModal(true);
            return false;
        }
        return true;
    };

    const handleSubmitReview = async () => {
        if (!checkAuth()) return;

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
            const user = JSON.parse(userInfo);

            const response = await fetch(`http://localhost:5000/api/tailors/${id}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerId: user._id,
                    customerName: user.name,
                    rating: ratingInput,
                    comment: reviewText
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit review');
            }

            // Update local state with new review
            setTailor(prev => ({
                ...prev,
                reviews: [data, ...(prev.reviews || [])],
                rating: (prev.rating * (prev.totalReviews || 0) + ratingInput) / ((prev.totalReviews || 0) + 1), // Approx update or just refetch. 
                // Actually backend returns new review, but we need fresh average from backend or calculate it locally.
                // Let's just refetch tailor to get correct average is safest, or trust backend calc logic I wrote in Step 2.
                // But simplified approx:
                totalReviews: (prev.totalReviews || 0) + 1
            }));

            setRatingInput(0);
            setReviewText('');
            alert('Review submitted successfully!');
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
                <div className="flex gap-3 pointer-events-auto">
                    <button className="bg-white/90 flex items-center justify-center align-center backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors">
                        <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>
                    <button className="bg-white/90 flex items-center justify-center align-center backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors">
                        <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>
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
            <div className="md:pt-32 md:px-6">
                <div className="max-w-7xl mx-auto">

                    {/* MOBILE: Top Image Carousel */}
                    <div className="md:hidden relative w-full h-[40vh] bg-gray-200">
                        {tailor.shopImage ? (
                            <img src={tailor.shopImage} alt={tailor.shopName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-linear-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                                <span className="text-4xl font-bold text-[#6b4423]">{getInitials(tailor.shopName)}</span>
                            </div>
                        )}
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2.5 py-1 text-xs font-medium rounded-md backdrop-blur-sm">
                            1 / {portfolioImages.length > 0 ? portfolioImages.length + 1 : 1}
                        </div>
                    </div>

                    {/* MOBILE: Title & Key Details */}
                    <div className="md:hidden px-4 py-6 border-b border-gray-100">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2 font-serif">{tailor.shopName}</h1>
                        <div className="flex items-center gap-2 mb-1">
                            {renderStars(tailor.rating || 0)}
                            <span className="text-sm font-semibold text-gray-900 ml-1">{(tailor.rating || 0).toFixed(1)}</span>
                            <span className="text-sm text-gray-500">({tailor.totalReviews || 0} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 text-sm mt-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="underline decoration-dotted">{tailor.address?.city}, {tailor.address?.state}</span>
                        </div>
                    </div>

                    {/* DESKTOP: Original Hero Content */}
                    <div className="hidden md:block mb-6">
                        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-3">{tailor.shopName}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                                <span className="font-semibold flex items-center gap-1">
                                    <svg className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    {(tailor.rating || 0).toFixed(1)}
                                </span>
                                <span className="text-slate-600">· {tailor.totalReviews || 0} reviews</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <span className="text-slate-700">{tailor.address?.city}, {tailor.address?.state}</span>
                            </div>
                            <span className="px-3 py-1 bg-amber-100 text-[#6b4423] rounded-full text-xs font-semibold">
                                {tailor.specialization?.charAt(0).toUpperCase() + tailor.specialization?.slice(1) || 'All Types'}
                            </span>
                        </div>
                    </div>

                    {/* DESKTOP: Original Image Banner */}
                    <div className="hidden md:block w-full h-[400px] rounded-xl overflow-hidden mb-8 shadow-md">
                        {tailor.shopImage ? (
                            <img src={tailor.shopImage} alt={tailor.shopName} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                        ) : (
                            <div className="w-full h-full bg-linear-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                                <div className="w-32 h-32 rounded-full bg-linear-to-br from-[#6b4423] to-[#8b5a3c] flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                                    {getInitials(tailor.shopName)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
                <div className="grid grid-cols-1 gap-12">
                    {/* Main Content Area - Full Width */}
                    <div className="w-full space-y-8 md:space-y-12">
                        {/* Introduction */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About {tailor.name}</h2>
                            <p className="text-slate-700 leading-relaxed mb-4">
                                {tailor.shopDescription || `Professional tailor with ${tailor.experience} years of experience specializing in ${tailor.specialization} tailoring.`}
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-slate-700">On-time delivery</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-slate-700">Perfect fitting guarantee</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-slate-700">Premium finishing</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-slate-700">{tailor.experience}+ years experience</span>
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-200" />

                        {/* Services */}
                        <section id="services">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Services Offered</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {(tailor.services && tailor.services.length > 0 ? tailor.services : ['Custom Tailoring', 'Alterations', 'Repairs']).map((service, idx) => (
                                    <div key={idx} className="p-4 border border-slate-200 rounded-lg hover:border-[#6b4423] hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-3">
                                            <svg className="w-5 h-5 text-[#6b4423]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm font-medium text-slate-900">{service}</span>
                                        </div>
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
                                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                        {['All', 'Shirts', 'Suits', 'Blouses', 'Dresses', 'Ethnic'].map((filter) => (
                                            <button
                                                key={filter}
                                                onClick={() => setActiveFilter(filter)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === filter
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
                                                    setLightboxIndex(idx);
                                                    setShowLightbox(true);
                                                }}
                                                className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative"
                                            >
                                                <img
                                                    src={item.image || item}
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
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
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
                                    <button
                                        onClick={handleSubmitReview}
                                        disabled={reviewSubmitting}
                                        className={`px-4 py-1.5 bg-[#6b4423] text-white text-sm font-medium rounded-lg hover:bg-[#573619] transition-colors ${reviewSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {reviewSubmitting ? 'Posting...' : 'Post Review'}
                                    </button>
                                </div>
                            </div>

                            {/* 2 & 3) Horizontal Scroll (Mobile) / Grid (Desktop) */}
                            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:grid md:grid-cols-2 md:gap-6 md:pb-0 md:mx-0 md:px-0 scrollbar-hide">
                                {tailor.reviews && tailor.reviews.length > 0 ? (
                                    tailor.reviews.slice(0, 6).map((review, idx) => (
                                        <div key={idx} className="min-w-[85vw] md:min-w-0 snap-center border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col h-full hover:border-[#6b4423] transition-colors">
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
                                            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 md:line-clamp-none">"{review.comment}"</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-500 col-span-2 text-center py-6 bg-slate-50 rounded-lg">No reviews yet. Be the first to review!</p>
                                )}
                            </div>

                            {/* 4) View All Reviews Button */}
                            {tailor.reviews && tailor.reviews.length > 0 && (
                                <button className="w-full mt-2 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                                    Show all {tailor.reviews.length} reviews
                                </button>
                            )}
                        </section>

                        <hr className="border-slate-200" />

                        {/* Location */}
                        <section id="location">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Location</h2>
                            <div className="flex items-start gap-3 text-slate-700">
                                <svg className="w-5 h-5 text-[#6b4423] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div>
                                    <div>{tailor.address?.street}</div>
                                    <div>{tailor.address?.city}, {tailor.address?.state} {tailor.address?.pincode}</div>
                                </div>
                            </div>
                        </section>
                    </div>

                </div>

                {/* Contact Section */}
                <section id="contact" className="mt-12 pt-12 border-t border-slate-200">
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
                </section>
            </div>

            {/* Floating WhatsApp Button */}
            <TailorBottom
                tailor={tailor}
                showLightbox={showLightbox}
                setShowLightbox={setShowLightbox}
                filteredPortfolio={filteredPortfolio}
                lightboxIndex={lightboxIndex}
                setLightboxIndex={setLightboxIndex}
            />
            {/* Login Required Modal */}
            {showLoginModal && (
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
            )}
        </div>
    );
};
export default TailorDetailPage;
