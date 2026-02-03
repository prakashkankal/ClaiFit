import React, { useState, useEffect, useRef, useCallback } from 'react';
import TailorProfileCard from './TailorProfileCard';
import API_URL from '../../config/api';

const TailorGrid = () => {
    const [tailors, setTailors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [skip, setSkip] = useState(0);
    const limit = 12;

    const observer = useRef();
    const lastTailorRef = useCallback(
        (node) => {
            if (loading) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setSkip((prevSkip) => prevSkip + limit);
                }
            });

            if (node) observer.current.observe(node);
        },
        [loading, hasMore]
    );

    const fetchTailors = async (currentSkip) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `${API_URL}/api/tailors?limit=${limit}&skip=${currentSkip}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch tailors');
            }

            const data = await response.json();

            if (currentSkip === 0) {
                // Initial load
                setTailors(data.tailors);
            } else {
                // Append for infinite scroll
                setTailors((prev) => [...prev, ...data.tailors]);
            }

            setHasMore(data.hasMore);
        } catch (err) {
            console.error('Error fetching tailors:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchTailors(0);
    }, []);

    // Load more when skip changes
    useEffect(() => {
        if (skip > 0) {
            fetchTailors(skip);
        }
    }, [skip]);

    const handleRetry = () => {
        setError(null);
        fetchTailors(skip);
    };

    // Loading skeleton component
    const LoadingSkeleton = () => (
        <>
            {[...Array(4)].map((_, index) => (
                <div
                    key={index}
                    className="bg-white/30 backdrop-blur-md rounded-2xl overflow-hidden border border-white/40 animate-pulse"
                >
                    <div className="h-48 bg-linear-to-br from-slate-200 to-slate-300"></div>
                    <div className="p-5 space-y-3">
                        <div className="h-6 bg-slate-300 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    </div>
                </div>
            ))}
        </>
    );

    return (
        <div className="w-full px-4 py-8">
            {/* Section Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Find Your Perfect Tailor
                </h2>
                <p className="text-slate-600">
                    Browse through our expert tailors and find the perfect fit for your needs
                </p>
            </div>

            {/* Error State */}
            {error && !loading && (
                <div className="max-w-7xl mx-auto mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-800 font-medium">Failed to load tailors: {error}</p>
                        </div>
                        <button
                            onClick={handleRetry}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Tailors Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tailors.map((tailor, index) => {
                    // Attach ref to last element for infinite scroll
                    if (tailors.length === index + 1) {
                        return (
                            <div key={tailor._id} ref={lastTailorRef}>
                                <TailorProfileCard tailor={tailor} />
                            </div>
                        );
                    }
                    return <TailorProfileCard key={tailor._id} tailor={tailor} />;
                })}

                {/* Loading skeletons */}
                {loading && <LoadingSkeleton />}
            </div>

            {/* Empty State */}
            {!loading && tailors.length === 0 && !error && (
                <div className="max-w-7xl mx-auto text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br from-violet-100 to-fuchsia-100 mb-4">
                        <svg className="w-10 h-10 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Tailors Found</h3>
                    <p className="text-slate-600">Check back later for new tailors in your area.</p>
                </div>
            )}

            {/* End of results message */}
            {!loading && !hasMore && tailors.length > 0 && (
                <div className="max-w-7xl mx-auto text-center py-8">
                    <p className="text-slate-500 text-sm">
                        You've reached the end of the list
                    </p>
                </div>
            )}
        </div>
    );
};

export default TailorGrid;
