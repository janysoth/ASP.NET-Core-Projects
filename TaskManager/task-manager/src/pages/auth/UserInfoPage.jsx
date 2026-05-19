import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PasswordStrength from '../../components/common/PasswordStrength';
import InputField from '../../components/input/InputField';

import { useAuth } from '../../hooks/useAuth';
import { changePassword } from '../../services/api';

import { USER_PASSWORD_FIELDS } from '../../features/user/userFields';
import { useForm } from '../../hooks/useForm';

const UserInfoPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSubmitted(true);

      // 🚀 ONLY check form engine
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

        setTimeout(async () => {
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

  const renderField = (field) => (
    <div key={field.name}>
      <InputField
        {...field}
        value={formData[field.name]}
        onChange={handleChange(field.name)}
      />

      {/* optional: show strength ONLY for new password */}
      {field.name === 'newPassword' && (
        <PasswordStrength password={formData.newPassword} />
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">User Information</h1>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <p className="font-semibold">Full Name: {user?.fullName}</p>
        <p className="text-gray-600">Email: {user?.email}</p>
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