import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import DashboardSidebar from '../../components/Tailor/DashboardSidebar'
import ProfileModal from '../../components/Customer/ProfileModal'
import { calculateProfileCompletion } from '../../utils/profileCompletion'
import axios from 'axios'
import API_URL from '../../config/api'

const TailorProfile = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [tailorData, setTailorData] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);

    // Portfolio & Feed State
    const [portfolioItems, setPortfolioItems] = useState([]);

    const [selectedPost, setSelectedPost] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showPostModal, setShowPostModal] = useState(false);
    const [toast, setToast] = useState(null);

    // New Post Form State
    const [postForm, setPostForm] = useState({
        title: '',
        description: '',
        category: 'Menswear',
        price: '',
        imageFile: null,
        imagePreview: null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            navigate('/login');
            return;
        }
        try {
            const user = JSON.parse(userInfo);
            if (user.role !== 'tailor' && user.userType !== 'tailor') {
                navigate('/');
                return;
            }
            setTailorData(user);
            fetchPosts(); // Fetch posts on load
        } catch (error) {
            navigate('/login');
        }
    }, [navigate]);

    const fetchPosts = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const { data } = await axios.get(`${API_URL}/api/posts/my-posts`, config);
            setPortfolioItems(data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const handleUpdateTailorData = (updatedData) => {
        setTailorData(updatedData);
    };



    useEffect(() => {
        if (location.state?.openEditModal) {
            setShowProfileModal(true);
            // Clear the state to prevent reopening on generic refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const handleNewPost = () => {
        const completion = calculateProfileCompletion(tailorData);
        if (completion.percentage < 100) {
            setToast('Please complete your profile to create posts.');
            setTimeout(() => setToast(null), 3000);
            setShowProfileModal(true);
            return;
        }

        setSelectedPost(null);
        setIsEditing(false);
        setPostForm({
            title: '',
            description: '',
            category: 'Menswear',
            price: '',
            imageFile: null,
            imagePreview: null
        });
        setShowPostModal(true);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPostForm({
                ...postForm,
                imageFile: file,
                imagePreview: URL.createObjectURL(file)
            });
        }
    };

    const handleShare = async () => {
        if (!postForm.title || !postForm.category || !postForm.price || !postForm.imageFile) {
            return; // Should be handled by disabled button, but safe guard
        }

        setIsLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            // 1. Upload Image
            const formData = new FormData();
            formData.append('image', postForm.imageFile);

            const uploadRes = await axios.post(`${API_URL}/api/posts/upload`, formData, config);
            const imageUrl = uploadRes.data;

            // 2. Create Post
            const postData = {
                title: postForm.title,
                description: postForm.description,
                category: postForm.category,
                price: Number(postForm.price.replace(/[^0-9.]/g, '')), // Clean price
                images: [imageUrl], // Array as per schema
            };

            const jsonConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            await axios.post(`${API_URL}/api/posts`, postData, jsonConfig);

            // Success
            setIsLoading(false);
            setShowPostModal(false);
            fetchPosts(); // Refresh list
            setToast('Post published successfully');
            setTimeout(() => setToast(null), 3000);

        } catch (error) {
            console.error(error);
            setIsLoading(false);
            setToast('Error publishing post. Please try again.');
            setTimeout(() => setToast(null), 3000);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'T';
        const names = name.split(' ');
        return names.length >= 2 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
    };

    if (!tailorData) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-[#f5f5f0]">
                <div className="text-slate-600 text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex bg-[#f5f5f0] text-slate-900 overflow-x-hidden">
            {/* Sidebar with Profile Modal */}
            <DashboardSidebar
                tailorData={tailorData}
                onLogout={handleLogout}
                onUpdateTailorData={handleUpdateTailorData}
                showProfileModal={showProfileModal}
                setShowProfileModal={setShowProfileModal}
            />
            {/* Main Content */}
            <main className="flex-1 lg:ml-72 pt-14 lg:pt-0 p-0 md:p-6 lg:p-8 dashboard-main-mobile min-w-0">

                {/* Profile Completion Banner - Feedback */}
                {tailorData && calculateProfileCompletion(tailorData).percentage < 100 && (
                    <div className="mx-6 md:mx-0 mt-6 md:mt-0 mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-fade-in relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                                <span className="font-bold text-sm">{calculateProfileCompletion(tailorData).percentage}%</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Your profile is incomplete</h3>
                                <p className="text-xs text-slate-500">
                                    Fill in missing details to reach 100%.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="px-4 py-2 bg-[#6b4423] hover:bg-[#573619] text-white text-xs font-bold rounded-lg transition-colors"
                        >
                            Update Info
                        </button>
                    </div>
                )}

                {/* Profile Header - Mobile Optimized */}
                <div className="bg-white p-6 md:rounded-2xl border-b md:border border-slate-200 shadow-sm mb-6">
                    <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
                        {/* Profile Image/Initials */}
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-amber-50 shadow-md shrink-0">
                            {tailorData.shopImage ? (
                                <img src={tailorData.shopImage} alt="Shop" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-linear-to-br from-[#6b4423] to-[#8b5a3c] flex items-center justify-center text-white font-bold text-2xl md:text-3xl">
                                    {getInitials(tailorData.name)}
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="text-center md:text-left flex-1 flex flex-col gap-2 md:gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{tailorData.shopName}</h1>

                            <div className="flex items-center justify-center md:justify-start gap-1.5 text-slate-600">
                                <svg className="w-5 h-5 text-[#6b4423] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span className="text-sm font-medium">
                                    {[tailorData.address?.city || tailorData.city, tailorData.address?.state || tailorData.state].filter(Boolean).join(', ') || "Location not added"}
                                </span>
                            </div>

                            <p className="text-base text-slate-700 max-w-lg mx-auto md:mx-0 leading-relaxed">
                                {tailorData.bio || "Professional tailor specializing in custom fittings and modern designs."}
                            </p>
                        </div>
                    </div>

                    {/* --- MOBILE ACTIONS (Edit Profile, + New Post) --- */}
                    <div className="lg:hidden flex gap-3 mt-6 mb-6">
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm active:bg-slate-50 transition-colors"
                        >
                            Edit Profile
                        </button>
                        <button
                            onClick={handleNewPost}
                            className="flex-1 py-3 bg-[#6b4423] text-white rounded-xl font-bold shadow-md active:bg-[#573619] transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            New Post
                        </button>
                    </div>

                    {/* --- DESKTOP ACTIONS (Preserved) --- */}
                    {/* --- DESKTOP ACTIONS (Refactored) --- */}
                    <div className="hidden lg:flex gap-3 mt-8">
                        <button onClick={handleNewPost} className="flex-1 py-3 px-6 bg-[#6b4423] text-white rounded-xl font-bold shadow-md hover:bg-[#573619] transition-colors flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            New Post
                        </button>
                        <button onClick={() => setShowProfileModal(true)} className="flex-1 py-3 px-6 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Edit Profile
                        </button>
                    </div>

                </div>

                {/* --- MOBILE PORTFOLIO GRID --- */}
                <div className="lg:hidden -mx-4 pb-32 border-t border-slate-100 bg-white">
                    {portfolioItems.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <p className="text-sm">No posts yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-0.5">
                            {portfolioItems.map((post) => (
                                <div
                                    key={post._id || post.id}
                                    onClick={() => navigate(`/dashboard/post/${post._id || post.id}`, { state: { post } })}
                                    className="aspect-square bg-slate-100 relative overflow-hidden cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                        {/* Placeholder Icon based on Category */}
                                        <span className="text-slate-300">
                                            {post.category === 'Menswear' ? (
                                                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            ) : (
                                                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                            )}
                                        </span>
                                    </div>
                                    {post.images && post.images.length > 0 && (
                                        <img src={post.images[0]} className="absolute inset-0 w-full h-full object-cover" alt={post.title} />
                                    )}
                                    {/* In a real app: <img src={post.image} className="w-full h-full object-cover" /> */}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- DESKTOP PORTFOLIO GRID (Preserved) --- */}
                <div className="hidden lg:block">
                    <div className="flex justify-between items-center mb-4 px-4 lg:px-0">
                        <h2 className="text-lg font-bold text-slate-800">Portfolio</h2>
                        <Link to="/dashboard/portfolio" className="text-sm font-semibold text-[#6b4423]">Manage →</Link>
                    </div>
                    {/* Instagram-Style Portfolio Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2 lg:px-0 pb-24">
                        {portfolioItems.map((item, index) => (
                            <Link
                                key={item._id || item.id || index}
                                to={`/dashboard/post/${item._id || item.id}`}
                                state={{ post: item }}
                                className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="w-full h-full bg-linear-to-br from-slate-50 to-slate-200 flex items-center justify-center">
                                    <span className="text-slate-300">
                                        {item.category === 'Menswear' ? (
                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        ) : (
                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                        )}
                                    </span>
                                </div>
                                {item.images && item.images.length > 0 && (
                                    <img src={item.images[0]} className="absolute inset-0 w-full h-full object-cover" alt={item.title} />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-2 text-center">
                                    <h3 className="text-white text-sm font-bold mb-1">{item.title}</h3>
                                    <p className="text-white/80 text-xs font-medium">{item.price}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

            </main>

            {/* Profile Edit Modal (Existing) */}
            <ProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                tailorData={tailorData}
                onUpdate={handleUpdateTailorData}
            />

            {/* --- NEW MODALS --- */}



            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg z-100 animate-fade-in-up text-sm font-medium">
                    {toast}
                </div>
            )}

            {/* Success/Error Handling helper */}
            {/* ... logic in handlers ... */}

            {/* 2. Full Screen Post Editor Modal (Responsive) */}
            {showPostModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPostModal(false)}></div>

                    {/* Modal Content */}
                    <div className="relative w-full h-full md:h-auto md:max-h-[85vh] md:max-w-xl bg-white md:rounded-2xl shadow-2xl flex flex-col animate-slide-up md:animate-scale-up overflow-hidden">
                        {/* Editor Header */}
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between safe-area-top shadow-sm z-10 bg-white">
                            <button onClick={() => setShowPostModal(false)} className="text-slate-500 font-medium px-2 py-1">Cancel</button>
                            <h2 className="font-bold text-lg">{isEditing ? 'Edit Post' : 'New Post'}</h2>
                            <button
                                disabled={!postForm.title || !postForm.category || !postForm.price || !postForm.imageFile || isLoading}
                                onClick={handleShare}
                                className={`text-[#6b4423] font-bold px-2 py-1 ${isLoading || !postForm.title || !postForm.category || !postForm.price || !postForm.imageFile ? 'opacity-50' : ''}`}
                            >
                                {isLoading ? 'Sharing...' : (isEditing ? 'Save' : 'Share')}
                            </button>
                        </div>
                        {/* Editor Content */}
                        <div className="flex-1 overflow-y-auto bg-slate-50 relative">
                            {/* Image Preview / Selector */}
                            <div className="aspect-square bg-slate-200 flex items-center justify-center relative group cursor-pointer border-b border-slate-200" onClick={() => document.getElementById('imageUpload').click()}>
                                {postForm.imagePreview ? (
                                    <img src={postForm.imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <p className="font-medium">Tap to select photo</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="imageUpload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageSelect}
                                />
                                {postForm.imagePreview && (
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-white/90 text-slate-800 px-4 py-2 rounded-lg font-bold text-sm shadow-sm">Change Photo</span>
                                    </div>
                                )}
                            </div>

                            {/* Fields */}
                            <div className="p-4 space-y-4 bg-white pb-32">
                                <div className="border-b border-slate-100 pb-2">
                                    <input
                                        type="text"
                                        value={postForm.description}
                                        onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                                        placeholder="Write a caption... (optional)"
                                        className="w-full py-2 text-base placeholder:text-slate-400 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Title *</label>
                                        <input
                                            type="text"
                                            value={postForm.title}
                                            onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                                            placeholder="e.g. Wedding Sherwani"
                                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6b4423] focus:ring-1 focus:ring-[#6b4423]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Category *</label>
                                            <select
                                                value={postForm.category}
                                                onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6b4423]"
                                            >
                                                <option>Menswear</option>
                                                <option>Womenswear</option>
                                                <option>Kidswear</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Price *</label>
                                            <input
                                                type="number"
                                                value={postForm.price}
                                                onChange={(e) => setPostForm({ ...postForm, price: e.target.value })}
                                                placeholder="₹"
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
        </div>
    );
};

export default TailorProfile;
