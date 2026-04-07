// pages/UserInfoPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeOffIcon } from '../components/icons/Icons';
import InputField from '../components/input/InputField';
import { useAuth } from '../context/useAuth';
import { changePassword } from '../services/api';
import { formatDate } from '../utils/helpers';

const UserInfoPage = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field, value) => {
    setError('');
    setSuccess('');
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      return setError('New passwords do not match.');
    }

    try {
      setLoading(true);
      await changePassword(
        {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        },
        token
      );

      setSuccess('Password changed successfully. Logging out...');
      setTimeout(async () => {
        await logout();
        navigate('/login', { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">User Information</h1>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <p className="text-gray-800 font-semibold">Full Name: {user?.fullName}</p>
        <p className="text-gray-600">Email: {user?.email}</p>
        <p className="text-gray-500 text-sm">
          Member since: {user?.createdOnUtc ? formatDate(user.createdOnUtc) : 'Unknown'}
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-4">Change Password</h2>
      {error && <div className="mb-4 p-3 rounded bg-red-100 text-red-700">{error}</div>}
      {success && <div className="mb-4 p-3 rounded bg-green-100 text-green-700">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Current Password"
          type="password"
          placeholder="Enter current password"
          value={form.currentPassword}
          onChange={(val) => handleChange('currentPassword', val)}
          showIcon={<EyeIcon className="w-5 h-5" />}
          hideIcon={<EyeOffIcon className="w-5 h-5" />}
        />
        <InputField
          label="New Password"
          type="password"
          placeholder="Enter new password"
          value={form.newPassword}
          onChange={(val) => handleChange('newPassword', val)}
          showIcon={<EyeIcon className="w-5 h-5" />}
          hideIcon={<EyeOffIcon className="w-5 h-5" />}
        />
        <InputField
          label="Confirm New Password"
          type="password"
          placeholder="Confirm new password"
          value={form.confirmPassword}
          onChange={(val) => handleChange('confirmPassword', val)}
          showIcon={<EyeIcon className="w-5 h-5" />}
          hideIcon={<EyeOffIcon className="w-5 h-5" />}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default UserInfoPage;