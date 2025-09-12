'use client';

import { useState, useRef } from 'react';

interface AvatarUploadProps {
  currentAvatar?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

export default function AvatarUpload({ 
  currentAvatar, 
  onUpload, 
  onRemove, 
  size = 'md',
  editable = true 
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      await onUpload(file);
      setPreview(null);
    } catch (error) {
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (onRemove) {
      setUploading(true);
      try {
        await onRemove();
      } finally {
        setUploading(false);
      }
    }
  };

  const displayImage = preview || currentAvatar;

  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center`}>
        {displayImage ? (
          <img 
            src={displayImage} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <i className="fas fa-user text-gray-400"></i>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <i className="fas fa-spinner fa-spin text-white"></i>
          </div>
        )}
      </div>

      {editable && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-paiecash text-white rounded-full flex items-center justify-center hover:bg-paiecash-dark transition-colors"
            disabled={uploading}
          >
            <i className="fas fa-camera text-xs"></i>
          </button>

          {currentAvatar && onRemove && (
            <button
              onClick={handleRemove}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              disabled={uploading}
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </>
      )}
    </div>
  );
}