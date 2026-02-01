import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CustomerReviews = ({ tailorId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!tailorId) return;
            try {
                setLoading(true);
                const { data } = await axios.get(`http://localhost:5000/api/tailors/${tailorId}`);
                setReviews(data.reviews || []);
            } catch (err) {
                console.error('Error fetching reviews:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [tailorId]);

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

    return (
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-lg shadow-violet-500/5 overflow-hidden flex flex-col mt-8">
            <div className="p-6 border-b border-white/40">
                <h3 className="text-xl font-bold text-slate-800">Customer Reviews</h3>
                {reviews.length > 0 && <p className="text-sm text-slate-500 mt-1">{reviews.length} total reviews</p>}
            </div>

            {loading ? (
                <div className="p-8 text-center text-slate-500">
                    <div className="animate-pulse">Loading reviews...</div>
                </div>
            ) : reviews.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                    <p className="text-lg font-medium">No reviews yet</p>
                    <p className="text-sm mt-2">Reviews from your customers will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {reviews.map((review, idx) => (
                        <div key={idx} className="bg-white/60 border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
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
                                <span className="text-xs text-slate-500">
                                    {review.date ? new Date(review.date).toLocaleDateString() : review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                                </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed text-left">"{review.comment}"</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerReviews;
