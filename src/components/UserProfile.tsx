import React, { useState } from 'react';
import {
  X,
  User,
  Building,
  Mail,
  Phone,
  Award,
  Save,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import { type UserProfile as UserProfileType } from '../types';

export interface UserProfileModalProps {
  userProfile: UserProfileType;
  onClose: () => void;
  onSaveProfile: (profile: UserProfileType) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userProfile,
  onClose,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<UserProfileType>({ ...userProfile });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#123B5D] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#18A999] text-white flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Contractor Profile &amp; Credentials</h3>
              <p className="text-[11px] text-white/80">
                Manage your PRC engineering license, PCAB contractor credentials, and contact details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs bg-white text-[#263238]">
          <div className="flex items-center gap-4 p-3.5 bg-[#EAF7FA] rounded-xl border border-slate-200">
            <img
              src={formData.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'}
              alt={formData.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#18A999] shadow-xs shrink-0"
            />
            <div className="min-w-0">
              <h4 className="font-bold text-[#123B5D] text-sm truncate">{formData.name}</h4>
              <p className="text-[11px] text-[#263238]/70 truncate">{formData.title || formData.role}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#18A999] border border-[#18A999]/30">
                  {formData.accessLevel}
                </span>
                <span className="text-[10px] text-[#263238]/60 font-mono">
                  {formData.prcLicense || formData.licenseNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-[#123B5D] mb-1">Full Name &amp; Title *</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#18A999] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-[#263238] font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-[#18A999]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#123B5D] mb-1">Professional Role *</label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 text-[#18A999] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-[#263238] font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:border-[#18A999]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-[#123B5D] mb-1">PRC License No. *</label>
              <div className="relative">
                <Award className="w-3.5 h-3.5 text-[#18A999] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={formData.prcLicense || ''}
                  onChange={(e) => setFormData({ ...formData, prcLicense: e.target.value })}
                  placeholder="e.g. PRC-CE-0149204"
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-[#263238] font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none focus:border-[#18A999]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#123B5D] mb-1">PCAB License Number</label>
              <input
                type="text"
                value={formData.licenseNumber || ''}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="e.g. PCAB License #84920-AAA"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-[#263238] font-mono font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-[#18A999]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-[#123B5D] mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#18A999] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-[#263238] font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-[#18A999]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#123B5D] mb-1">Phone Hotline *</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-[#18A999] absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+63 917 000 0000"
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-[#263238] font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-[#18A999]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#123B5D] mb-1">Contractor / Firm Name</label>
            <div className="relative">
              <Building className="w-3.5 h-3.5 text-[#18A999] absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.companyName || formData.company || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value, company: e.target.value })}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-[#263238] font-bold bg-slate-50 focus:bg-white focus:outline-none focus:border-[#18A999]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#123B5D] mb-1">Official Office Address</label>
            <textarea
              rows={2}
              value={formData.companyAddress || ''}
              onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-[#263238] bg-slate-50 focus:bg-white focus:outline-none focus:border-[#18A999]"
            />
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-lg bg-[#EAF7FA] border border-[#18A999]/30 text-[#123B5D] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#18A999]" />
              <span className="font-bold">Profile credentials saved successfully!</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#EAF7FA] rounded-xl font-bold text-[#123B5D] hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#18A999] hover:bg-[#148f81] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const UserProfile = UserProfileModal;
export default UserProfileModal;
