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
    process.env.REACT_APP_API_URL ||
    'http://localhost:5000';

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
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">User Information</h1>

      <div className="mb-6 p-6 bg-gray-50 rounded-xl border">
        <div className="flex items-center gap-4">
          <Avatar
            size="xl"
            fullName={user?.fullName}
            profileImageUrl={profileImageUrl}
          />

          <div className="min-w-0">
            <p className="text-xl font-semibold text-gray-800 truncate">
              {user?.fullName}
            </p>

            <p
              className="text-gray-600 truncate"
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
              className="mt-3 text-sm px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {imageLoading
                ? 'Uploading...'
                : 'Change Profile Image'}
            </button>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Change Password</h2>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {USER_PASSWORD_FIELDS.map(renderField)}

        <button
          type="submit"
          disabled={loading || hasErrors}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default UserInfoPage;