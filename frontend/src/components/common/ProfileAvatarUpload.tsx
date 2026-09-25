import React, { useRef, useState, useEffect } from 'react';
import { Camera, Trash2, Loader2, UploadCloud } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';

interface ProfileAvatarUploadProps {
  currentAvatar?: string;
  name?: string;
  roleTitle?: string;
  isEditing?: boolean;
}

export const ProfileAvatarUpload: React.FC<ProfileAvatarUploadProps> = ({
  currentAvatar,
  name,
  roleTitle,
  isEditing = true,
}) => {
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(currentAvatar);

  useEffect(() => {
    setAvatarSrc(currentAvatar);
  }, [currentAvatar]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    // Validate format
    const validFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validFormats.includes(file.type.toLowerCase())) {
      setErrorMsg('Invalid image format. Supported formats: PNG, JPG, JPEG, WEBP.');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.post('/auth/avatar', formData);
      const newAvatarUrl = res.data?.data?.avatarUrl;
      if (newAvatarUrl) {
        setAvatarSrc(newAvatarUrl);
      }

      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
      queryClient.invalidateQueries({ queryKey: ['recruiterProfile'] });
      queryClient.invalidateQueries({ queryKey: ['adminProfile'] });
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          'Failed to upload profile picture. Please try again.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!avatarSrc) return;
    setErrorMsg(null);
    setIsUploading(true);

    try {
      await api.delete('/auth/avatar');
      setAvatarSrc(undefined);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
      queryClient.invalidateQueries({ queryKey: ['recruiterProfile'] });
      queryClient.invalidateQueries({ queryKey: ['adminProfile'] });
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          'Failed to remove profile picture. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const initial = name?.trim() ? name.trim()[0].toUpperCase() : 'U';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar Display */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-3xl sm:text-4xl shadow-md border-2 border-slate-200 dark:border-slate-700 select-none">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={name || 'Profile Picture'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initial}</span>
            )}
          </div>

          {/* Quick upload overlay on hover when editing */}
          {isEditing && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Change Profile Picture"
              className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[11px] font-semibold">Change</span>
            </button>
          )}

          {/* Floating Camera Badge */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !isEditing}
            title={isEditing ? 'Upload photo' : 'Click Edit Profile to change photo'}
            className={`absolute -bottom-2 -right-2 p-2 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all ${
              isEditing
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:scale-105'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-75'
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Info & Action Controls */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Profile Photo & Avatar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload a clear PNG, JPG, or WEBP portrait (max 5MB). Yeh photo aapke Navbar aur
              profile me sab jagah automatically show hogi.
            </p>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
          />

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !isEditing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors ${
                isEditing
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              <span>{avatarSrc ? 'Update Photo' : 'Upload Photo'}</span>
            </button>

            {avatarSrc && isEditing && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}

            {!isEditing && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                (Click &quot;Edit Profile&quot; to change photo)
              </span>
            )}
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium pt-1">
              {errorMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
