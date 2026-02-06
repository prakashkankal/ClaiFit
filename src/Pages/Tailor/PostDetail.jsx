import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';

const PostDetail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [post, setPost] = useState(location.state?.post || null);

    // Editing State
    const [editForm, setEditForm] = useState(post ? {
        title: post.title,
        description: post.description || '',
        category: post.category,
        price: post.price,
        imageFile: null,
        imagePreview: post.images && post.images.length > 0 ? post.images[0] : null
    } : {});

    // UI State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Get current user info for display
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    if (!post) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center animate-fade-in-up">
                    <p className="text-slate-400 mb-4 text-lg">Post not found</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-colors backdrop-blur-md"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            await axios.delete(`${API_URL}/api/posts/${post.id || post._id}`, config);

            setIsLoading(false);
            setShowDeleteModal(false);
            setToast('Post deleted');

            // Navigate back after short delay to show toast
            setTimeout(() => {
                navigate(-1);
            }, 1000);

        } catch (error) {
            console.error('Delete Error:', error);
            setIsLoading(false);
            setToast('Error deleting post');
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            let imageUrl = post.images && post.images.length > 0 ? post.images[0] : null;

            // 1. Upload new image if selected
            if (editForm.imageFile) {
                const formData = new FormData();
                formData.append('image', editForm.imageFile);
                const uploadConfig = {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                };
                const uploadRes = await axios.post(`${API_URL}/api/posts/upload`, formData, uploadConfig);
                imageUrl = uploadRes.data;
            }

            // 2. Update Post
            const updateData = {
                title: editForm.title,
                description: editForm.description,
                category: editForm.category,
                price: Number(String(editForm.price).replace(/[^0-9.]/g, '')),
                images: imageUrl ? [imageUrl] : []
            };

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.put(`${API_URL}/api/posts/${post.id || post._id}`, updateData, config);

            // Update local state
            setPost({ ...data, id: data._id });
            setEditForm({
                title: data.title,
                description: data.description || '',
                category: data.category,
                price: data.price,
                imageFile: null,
                imagePreview: data.images && data.images.length > 0 ? data.images[0] : null
            });

            setIsLoading(false);
            setIsEditing(false);
            setToast('Post updated successfully');
            setTimeout(() => setToast(null), 3000);

        } catch (error) {
            console.error('Update Error:', error);
            setIsLoading(false);
            setToast('Error updating post');
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditForm({
                ...editForm,
                imageFile: file,
                imagePreview: URL.createObjectURL(file)
            });
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: `Check out ${post.title} on my KStitch shop!`,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            const text = encodeURIComponent(`Check out ${post.title} on KStitch! ${window.location.href}`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">

            {/* Top Navigation */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between pointer-events-none">
                <button
                    onClick={() => navigate(-1)}
                    className="pointer-events-auto p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all hover:scale-105 active:scale-95"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
            </div>

            {/* Main Information Layer (Immersive) */}
            <div className="relative flex-1 w-full h-full flex items-center justify-center bg-zinc-900">
                {/* Background Blur Effect (Optional aesthetic) */}
                <div
                    className="absolute inset-0 opacity-20 blur-3xl scale-110"
                    style={{
                        backgroundImage: `url(${post.images?.[0]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                ></div>

                {/* Main Image */}
                <div className="relative z-10 w-full h-full flex items-center justify-center p-4 md:p-8">
                    {post.images && post.images.length > 0 ? (
                        <img
                            src={post.images[0]}
                            className="max-h-full max-w-full object-contain shadow-2xl drop-shadow-2xl"
                            alt={post.title}
                        />
                    ) : (
                        <div className="text-white/50 flex flex-col items-center">
                            <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p>No Image Available</p>
                        </div>
                    )}
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black via-black/60 to-transparent pt-32 pb-8 px-6 md:px-12 z-20">
                    <div className="max-w-4xl mx-auto flex items-end justify-between">

                        {/* Text Details */}
                        <div className="flex-1 pr-8 animate-slide-up">
                            {/* Category Badge */}
                            <div className="flex items-center gap-2 mb-3">
                                {post.category && (
                                    <span className="px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white/90 text-[10px] md:text-xs font-bold uppercase tracking-wider border border-white/10">
                                        {post.category}
                                    </span>
                                )}
                                <span className="text-white/60 text-xs">•</span>
                                <span className="text-white/80 text-xs font-medium">{post.date ? new Date(post.date).toLocaleDateString() : 'Recently added'}</span>
                            </div>

                            {/* Title & Price */}
                            <div className="flex flex-col md:flex-row md:items-end gap-2 mb-3">
                                <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight">{post.title}</h1>
                                {post.price && (
                                    <span className="text-xl md:text-2xl font-bold text-amber-400">₹{post.price}</span>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-white/80 text-sm md:text-base leading-relaxed line-clamp-3 md:line-clamp-none max-w-2xl text-shadow-sm">
                                {post.description}
                            </p>
                        </div>

                        {/* Right Side Floating Actions */}
                        <div className="flex flex-col gap-4 items-center shrink-0 animate-fade-in-right">
                            {/* Edit Button */}
                            <div className="flex flex-col items-center gap-1 group">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-3 md:p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 rounded-full text-white transition-all hover:scale-110 active:scale-95 shadow-lg"
                                    title="Edit Post"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <span className="text-[10px] text-white/80 font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black/50 px-2 py-1 rounded-sm whitespace-nowrap">Edit</span>
                                <span className="text-[10px] md:hidden text-white/80 font-medium">Edit</span>
                            </div>

                            {/* Delete Button */}
                            <div className="flex flex-col items-center gap-1 group">
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="p-3 md:p-4 bg-red-500/10 hover:bg-red-500/20 backdrop-blur-xl border border-red-500/20 rounded-full text-red-500 hover:text-red-400 transition-all hover:scale-110 active:scale-95 shadow-lg"
                                    title="Delete Post"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                                <span className="text-[10px] text-white/80 font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black/50 px-2 py-1 rounded-sm whitespace-nowrap">Delete</span>
                                <span className="text-[10px] md:hidden text-white/80 font-medium">Delete</span>
                            </div>

                            {/* Share Button */}
                            <div className="flex flex-col items-center gap-1 group mt-2 pt-2 border-t border-white/10">
                                <button
                                    onClick={handleShare}
                                    className="p-3 md:p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 rounded-full text-white transition-all hover:scale-110 active:scale-95 shadow-lg"
                                    title="Share"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                </button>
                                <span className="text-[10px] md:hidden text-white/80 font-medium">Share</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Edit Modal (Overlaid on Dark Theme) */}
            {isEditing && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsEditing(false)}></div>

                    <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-scale-up">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                            <h2 className="font-bold text-lg text-slate-800">Edit Post</h2>
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-slate-50">
                            {/* Image Selector */}
                            <div
                                className="aspect-square bg-slate-200 flex items-center justify-center relative group cursor-pointer border-b border-slate-200 shadow-inner"
                                onClick={() => document.getElementById('editImageUpload').click()}
                            >
                                {editForm.imagePreview ? (
                                    <img src={editForm.imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400">
                                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span className="text-sm font-medium">Select Image</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="editImageUpload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageSelect}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                        Change Photo
                                    </span>
                                </div>
                            </div>

                            {/* Info Fields */}
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Title</label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        placeholder="Ex: Summer Floral Dress"
                                        className="w-full p-3.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        placeholder="Describe your masterpiece..."
                                        className="w-full p-3.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black min-h-[120px] resize-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Category</label>
                                        <div className="relative">
                                            <select
                                                value={editForm.category}
                                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                className="w-full p-3.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black appearance-none transition-all"
                                            >
                                                <option>Menswear</option>
                                                <option>Womenswear</option>
                                                <option>Kidswear</option>
                                                <option>Accessories</option>
                                                <option>Ethnic</option>
                                            </select>
                                            <svg className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Price (₹)</label>
                                        <input
                                            type="number"
                                            value={editForm.price}
                                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                            className="w-full p-3.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end gap-3 z-10">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isLoading}
                                onClick={handleSave}
                                className="px-6 py-2.5 bg-black text-white font-bold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform active:scale-95"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
                    <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-scale-up text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <h3 className="font-bold text-xl text-slate-900 mb-2">Delete this post?</h3>
                        <p className="text-slate-500 mb-8 leading-relaxed">This action cannot be undone. This post will be permanently removed from your portfolio.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={isLoading} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 shadow-red-500/20 shadow-lg">
                                {isLoading ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md text-slate-900 px-6 py-3 rounded-full shadow-xl z-80 animate-fade-in-down text-sm font-bold flex items-center gap-2 border border-slate-200/50">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {toast}
                </div>
            )}
        </div>
    );
};

export default PostDetail;
