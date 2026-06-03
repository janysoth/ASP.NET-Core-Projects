import React from 'react';
import Avatar from '../common/Avatar';

const ProfileCard = ({
  user,
  profileImageUrl,
  imageLoading,
  fileInputRef,
  onChooseImage,
  onImageChange,
}) => {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm border">
      <h2 className="text-xl font-semibold text-slate-900">
        Profile
      </h2>

      <div className="mt-6 flex flex-col items-center text-center">
        <Avatar
          size="xl"
          fullName={user?.fullName}
          profileImageUrl={profileImageUrl}
        />

        <h3 className="mt-4 text-2xl font-bold text-slate-900">
          {user?.fullName || 'User'}
        </h3>

        <p
          className="mt-1 max-w-full truncate text-slate-500"
          title={user?.email}
        >
          {user?.email}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={onChooseImage}
          disabled={imageLoading}
          className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {imageLoading ? 'Uploading...' : 'Change Profile Image'}
        </button>

        <p className="mt-3 text-xs text-slate-500">
          JPG, PNG, JPEG, or WEBP.
        </p>
      </div>
    </section>
  );
};

export default ProfileCard;