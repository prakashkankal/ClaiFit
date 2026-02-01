import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PostDetail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [showActionSheet, setShowActionSheet] = useState(false);
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

    if (!post) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <p className="text-slate-500 mb-4">Post not found</p>
                    <button onClick={() => navigate(-1)} className="text-[#6b4423] font-bold">Go Back</button>
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
            await axios.delete(`http://localhost:5000/api/posts/${post.id || post._id}`, config);

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
                const uploadRes = await axios.post('http://localhost:5000/api/posts/upload', formData, uploadConfig);
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

            const { data } = await axios.put(`http://localhost:5000/api/posts/${post.id || post._id}`, updateData, config);

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

    return (
        <div className="w-full min-h-screen bg-white md:bg-[#f5f5f0] pb-32 md:pb-0 md:flex md:justify-center md:items-start md:pt-8">
            <div className="w-full md:max-w-xl bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-200 overflow-hidden min-h-screen md:min-h-[80vh] relative">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between relative">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 rounded-full hover:bg-slate-50">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h1 className="font-bold text-slate-800">Post Details</h1>
                    <div className="relative">
                        <button onClick={() => setShowActionSheet(!showActionSheet)} className="p-2 -mr-2 text-slate-600 rounded-full hover:bg-slate-50">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                        {/* Desktop Dropdown */}
                        {showActionSheet && (
                            <>
                                <div className="hidden md:block fixed inset-0 z-30" onClick={() => setShowActionSheet(false)}></div>
                                <div className="hidden md:block absolute top-10 right-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-40 py-1 overflow-hidden animate-scale-up-origin-tr">
                                    <button onClick={() => { setIsEditing(true); setShowActionSheet(false); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Edit Post
                                    </button>
                                    <button onClick={() => { setShowDeleteModal(true); setShowActionSheet(false); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-50">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Delete Post
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto">
                    {/* Image Carousel (Single Image for now as per data) */}
                    <div className="w-full aspect-square bg-slate-100 relative">
                        {/* Placeholder for image */}
                        {post.images && post.images.length > 0 ? (
                            <img src={post.images[0]} className="absolute inset-0 w-full h-full object-cover" alt={post.title} />
                        ) : (
                            <div className="absolute inset-0 bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                <span className="text-slate-400 font-medium italic">{post.title} Image</span>
                            </div>
                        )}
                    </div>

                    {/* Post Info */}
                    <div className="px-5 py-6 space-y-6">
                        {/* Owner Info */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-[#6b4423] font-bold text-sm">
                                ME
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">My Shop Name</p>
                                <p className="text-xs text-slate-500">{post.date}</p>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">{post.title}</h2>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-100">{post.category}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-lg font-bold text-[#6b4423]">{post.price}</span>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-base">{post.description}</p>
                        </div>
                    </div>
                </div>

                {/* Action Sheet (Mobile Only) */}
                {showActionSheet && (
                    <div className="md:hidden">
                        <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={() => setShowActionSheet(false)}></div>
                        <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl p-4 animate-slide-up safe-area-pb">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                            <div className="space-y-2">
                                <button onClick={() => { setIsEditing(true); setShowActionSheet(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-slate-700 hover:bg-slate-50 font-semibold rounded-2xl transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </div>
                                    Edit Post
                                </button>
                                <button onClick={() => { setShowDeleteModal(true); setShowActionSheet(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-red-600 hover:bg-red-50 font-semibold rounded-2xl transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </div>
                                    Delete Post
                                </button>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <button onClick={() => setShowActionSheet(false)} className="w-full py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <>
                        <div className="fixed inset-0 bg-black/40 z-60" onClick={() => setShowDeleteModal(false)}></div>
                        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-[90%] max-w-sm z-70 shadow-xl animate-scale-up">
                            <h3 className="font-bold text-lg text-slate-900 mb-2">Delete this post?</h3>
                            <p className="text-slate-500 mb-6">This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                                <button onClick={handleDelete} disabled={isLoading} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                                    {isLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Edit Modal (Responsive) */}
                {isEditing && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>

                        <div className="relative w-full h-full md:h-auto md:max-h-[85vh] md:max-w-lg bg-white md:rounded-2xl shadow-2xl flex flex-col animate-slide-up md:animate-scale-up overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between safe-area-top shadow-sm z-10 bg-white">
                                <button onClick={() => setIsEditing(false)} className="text-slate-500 font-medium px-2 py-1">Cancel</button>
                                <h2 className="font-bold text-lg">Edit Post</h2>
                                <button disabled={isLoading} onClick={handleSave} className="text-[#6b4423] font-bold px-2 py-1 disabled:opacity-50">
                                    {isLoading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto bg-slate-50 relative pb-20">
                                {/* Image Preview / Selector (Added) */}
                                <div className="aspect-square bg-slate-200 flex items-center justify-center relative group cursor-pointer border-b border-slate-200" onClick={() => document.getElementById('editImageUpload').click()}>
                                    {editForm.imagePreview ? (
                                        <img src={editForm.imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                    ) : (
                                        <div className="text-center text-slate-400">
                                            <p className="font-medium">No Image</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="editImageUpload"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageSelect}
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-white/90 text-slate-800 px-4 py-2 rounded-lg font-bold text-sm shadow-sm">Change Photo</span>
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="p-4 space-y-4 bg-white">
                                    <div className="border-b border-slate-100 pb-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
                                        <textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            className="w-full py-2 text-base placeholder:text-slate-400 focus:outline-none min-h-[100px] resize-none"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Title</label>
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6b4423]"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
                                                <select
                                                    value={editForm.category}
                                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6b4423]"
                                                >
                                                    <option>Menswear</option>
                                                    <option>Womenswear</option>
                                                    <option>Kidswear</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Price</label>
                                                <input
                                                    type="number"
                                                    value={editForm.price}
                                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6b4423]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast */}
                {toast && (
                    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg z-80 animate-fade-in-up text-sm font-medium">
                        {toast}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostDetail;
