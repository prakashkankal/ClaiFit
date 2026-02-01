import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileCompletionModal = ({ isOpen, onClose, completionData, tailorData }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const { percentage, missingFields } = completionData;

    const handleCompleteProfile = () => {
        onClose();
        navigate('/dashboard/profile', { state: { openEditModal: true } });
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="bg-linear-to-r from-[#6b4423] to-[#8b5a3c] p-6 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                        <span className="text-2xl font-bold">{percentage}%</span>
                    </div>
                    <h2 className="text-xl font-bold">Complete Your Profile</h2>
                    <p className="text-white/80 text-sm mt-1">
                        Finish setting up your shop to start receiving orders.
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-100 w-full">
                    <div
                        className="h-full bg-green-500 transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
                        <h3 className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Missing Information
                        </h3>
                        <ul className="space-y-1">
                            {missingFields.slice(0, 4).map((field, idx) => (
                                <li key={idx} className="text-sm text-slate-700 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                    {field}
                                </li>
                            ))}
                            {missingFields.length > 4 && (
                                <li className="text-xs text-slate-500 italic pl-3.5">
                                    + {missingFields.length - 4} more
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleCompleteProfile}
                            className="w-full py-3 bg-[#6b4423] text-white font-bold rounded-xl shadow-lg hover:bg-[#573619] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            Complete Profile Now
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors"
                        >
                            I'll do this later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCompletionModal;
