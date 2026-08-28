import React from 'react';

import Avatar from '../common/Avatar';

const ImageUploadField = ({
  file,
  preview,
  fullName,
  onChange,
}) => {
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];

    if (!selected) return;

    onChange(selected);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar
        fullName={fullName}
        profileImageUrl={preview}
        size="xl"
      />

      <label className="cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div
          className="
            rounded-lg
            bg-[var(--app-primary)]
            px-4
            py-2
            text-white
            transition
            hover:bg-[var(--app-primary-hover)]
          "
        >
          Upload Profile Picture
        </div>
      </label>

      <p className="text-center text-sm text-[var(--app-text-muted)]">
        JPG, PNG, WEBP supported
      </p>
    </div>
  );
};

export default ImageUploadField;