import React, { useEffect, useState } from 'react';

import UserAvatar from './UserAvatar';

const AvatarUploader = ({
  fullName = '',
  value = null,
  onChange,
}) => {
  const [preview, setPreview] = useState('');

  // =========================
  // Preview
  // =========================
  useEffect(() => {
    if (!value) {
      setPreview('');
      return;
    }

    const imageUrl = URL.createObjectURL(value);

    setPreview(imageUrl);

    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [value]);

  // =========================
  // Handle Upload
  // =========================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    onChange(file);
  };

  // =========================
  // Remove Image
  // =========================
  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">

      {/* Avatar Preview */}
      <UserAvatar
        fullName={fullName}
        image={preview}
        size="lg"
      />

      {/* Upload */}
      <label className="cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition">
          Upload Photo
        </div>
      </label>

      {/* Remove */}
      {value && (
        <button
          type="button"
          onClick={handleRemove}
          className="text-sm text-red-600 hover:underline"
        >
          Remove Photo
        </button>
      )}
    </div>
  );
};

export default AvatarUploader;