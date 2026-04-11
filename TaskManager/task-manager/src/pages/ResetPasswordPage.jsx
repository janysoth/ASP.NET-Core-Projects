import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EyeIcon, EyeOffIcon } from '../components/icons/Icons';
import InputField from '../components/input/InputField';
import { resetPassword } from '../services/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({
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

    if (!email || !token) {
      return setError('Reset link is invalid.');
    }

    if (form.newPassword !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }

    try {
      setLoading(true);

      await resetPassword({
        email,
        token,
        newPassword: form.newPassword,
      });

      setSuccess('Password reset successful. Redirecting to login...');

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to reset password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled =
    !form.newPassword ||
    !form.confirmPassword ||
    loading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Reset Password
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-700 p-3 mb-4 rounded-lg text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="New Password"
            type="password"
            placeholder="Enter new password"
            value={form.newPassword}
            onChange={(val) => handleChange('newPassword', val)}
            showIcon={<EyeIcon />}
            hideIcon={<EyeOffIcon />}
          />

          <InputField
            label="Confirm Password"
            type="password"
            placeholder="Confirm new password"
            value={form.confirmPassword}
            onChange={(val) => handleChange('confirmPassword', val)}
            showIcon={<EyeIcon />}
            hideIcon={<EyeOffIcon />}
          />

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full py-3 font-semibold rounded-md transition-all duration-200 ${isSubmitDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md text-white active:scale-[0.98]'
              }`}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;