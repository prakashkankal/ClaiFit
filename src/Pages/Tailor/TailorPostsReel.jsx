import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import API_URL from '../../config/api';

const TailorPostsReel = () => {
    const { tailorId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // State to hold portfolio items
    const [posts, setPosts] = useState(location.state?.posts || []);
    const [loading, setLoading] = useState(!location.state?.posts);
    const [initialIndex, setInitialIndex] = useState(location.state?.initialIndex || 0);
    const [likedPosts, setLikedPosts] = useState({});

    const handleLike = (index) => {
        setLikedPosts(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleShare = async (post) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title || 'Check out this design',
                    text: `Check out this ${post.title || 'design'} on KStitch!`,
                    url: window.location.href
                });
            } catch (error) {
                console.log('Error sharing', error);
            }
        } else {
            // Fallback to WhatsApp
            const text = encodeURIComponent(`Check out this ${post.title || 'design'} on KStitch! ${window.location.href}`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    };

    // Fetch tailor data if posts are not passed in state
    useEffect(() => {
        if (!posts.length) {
            const fetchTailorPosts = async () => {
                try {
                    const response = await fetch(`${API_URL}/api/tailors/${tailorId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setPosts(data.portfolio || []);
                    }
                } catch (error) {
                    console.error('Failed to fetch posts', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchTailorPosts();
        }
    }, [tailorId, posts.length]);

    // Scroll to initial index on load
    const containerRef = useRef(null);
    useEffect(() => {
        if (!loading && posts.length > 0 && containerRef.current) {
            const element = containerRef.current.children[initialIndex];
            if (element) {
                element.scrollIntoView({ behavior: 'auto' });
            }
        }
    }, [loading, posts.length, initialIndex]);

    if (loading) {
        return (
            <div className="h-screen w-full bg-black flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white gap-4">
                <p>No posts available.</p>
                <button onClick={() => navigate(-1)} className="text-sm underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black">
            {/* Close Button */}
            <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 z-50 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Reel Container */}
            <div
                ref={containerRef}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                style={{ scrollBehavior: 'smooth' }}
            >
                {posts.map((post, index) => (
                    <div key={index} className="h-full w-full snap-start relative flex items-center justify-center bg-black">
                        {/* Image */}
                        <div className="w-full h-full flex items-center justify-center">
                            <img
                                src={post.images?.[0] || post.image || post}
                                alt={post.title || "Post"}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>

                        {/* Top Right Actions */}


                        {/* Overlay Details */}
                        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-6 pb-20 pt-12 md:pb-6 text-white pointer-events-none">
                            <div className="max-w-2xl mx-auto flex items-end justify-between">
                                <div className="flex-1 pr-4 pointer-events-auto">
                                    <div className="flex items-center gap-3 mb-2">
                                        {post.category && (
                                            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-sm backdrop-blur-sm">
                                                {post.category}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-bold mb-1">{post.title || "Portfolio Item"}</h2>
                                    {post.price && (
                                        <p className="text-xl font-bold text-amber-400 mb-3">{post.price}</p>
                                    )}
                                    {post.description && (
                                        <p className="text-sm text-gray-200 line-clamp-3 mb-0 leading-relaxed text-shadow-sm">
                                            {post.description}
                                        </p>
                                    )}
                                </div>

                                {/* Right Sided Actions */}
                                <div className="flex flex-col gap-4 pb-2 pointer-events-auto">
                                    <div className="flex flex-col items-center gap-1">
                                        <button
                                            onClick={() => handleLike(index)}
                                            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all active:scale-90"
                                        >
                                            <svg className={`w-8 h-8 transition-colors ${likedPosts[index] ? 'text-red-500 fill-red-500' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </button>
                                        <span className="text-xs font-medium">{likedPosts[index] ? '1' : '0'}</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-1">
                                        <button
                                            onClick={() => handleShare(post)}
                                            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all active:scale-90"
                                        >
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                            </svg>
                                        </button>
                                        <span className="text-xs font-medium">Share</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TailorPostsReel;
