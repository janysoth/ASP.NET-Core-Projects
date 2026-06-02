import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Avatar from '../../components/common/Avatar';
import PasswordStrength from '../../components/common/PasswordStrength';
import InputField from '../../components/input/InputField';
import { USER_PASSWORD_FIELDS } from '../../features/user/userFields';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import {
  changePassword,
  updateProfileImage,
} from '../../services/api';

const UserInfoPage = () => {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const backendUrl =
    process.env.REACT_APP_API_URL || 'http://localhost:5295';

  const form = useForm(USER_PASSWORD_FIELDS, () => ({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }));

  const {
    formData,
    hasErrors,
    handleChange,
    setSubmitted,
  } = form;

  const profileImageUrl = user?.profileImageUrl
    ? `${backendUrl}${user.profileImageUrl}`
    : '';

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSubmitted(true);
      setError('');
      setSuccess('');

      if (hasErrors) return;

      try {
        setLoading(true);

        await changePassword(
          {
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          },
          token
        );

        setSuccess('Password changed successfully.');

        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1200);
      } catch (err) {
        setError(
          err.response?.data?.error || 'Failed to change password.'
        );
      } finally {
        setLoading(false);
      }
    },
    [formData, hasErrors, token, navigate, setSubmitted]
  );

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const payload = new FormData();
      payload.append('file', file);

      try {
        setImageLoading(true);
        setError('');
        setSuccess('');

        const response = await updateProfileImage(payload, token);

        updateUser(response.data.user);
        setSuccess('Profile image updated successfully.');
      } catch (err) {
        setError(
          err.response?.data?.error ||
          err.error ||
          'Failed to update profile image.'
        );
      } finally {
        setImageLoading(false);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [token, updateUser]
  );

  const renderField = (field) => (
    <div key={field.name}>
      <InputField
        {...field}
        value={formData[field.name]}
        onChange={handleChange(field.name)}
      />

      {field.name === 'newPassword' && (
        <PasswordStrength password={formData.newPassword} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Account Settings
          </h1>
          <p className="mt-1 text-slate-600">
            Manage your profile information and password.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">

          {/* Profile Card */}
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
                onChange={handleImageChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleChooseImage}
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

          {/* Account Details */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border">
            <h2 className="text-xl font-semibold text-slate-900">
              Account Information
            </h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Full Name</p>
                <p className="mt-1 font-medium text-slate-900">
                  {user?.fullName || 'Not available'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Email</p>
                <p
                  className="mt-1 truncate font-medium text-slate-900"
                  title={user?.email}
                >
                  {user?.email || 'Not available'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">User ID</p>
                <p className="mt-1 break-all text-sm font-medium text-slate-900">
                  {user?.id || 'Not available'}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Change Password */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">
              Change Password
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Use a strong password that includes uppercase, lowercase, number, and special character.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {USER_PASSWORD_FIELDS.map(renderField)}

            <button
              type="submit"
              disabled={loading || hasErrors}
              className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default UserInfoPage;