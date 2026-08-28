import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmailIcon } from '../../components/icons/Icons';
import InputField from '../../components/inputs/InputField';
import { forgotPassword } from '../../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitted(true);
    setError('');
    setMessage('');

    if (!email.trim()) {
      return setError('Email is required.');
    }

    try {
      setLoading(true);

      await forgotPassword({
        email: email.trim(),
      });

      setMessage('If that email exists, a reset link has been sent.');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to send reset link.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = !email.trim() || loading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Forgot Password
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 text-green-700 p-3 mb-4 rounded-lg text-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={setEmail}
            icon={<EmailIcon />}
            showError={submitted}
          />

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full py-3 font-semibold rounded-md transition-all duration-200 ${isSubmitDisabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md text-white active:scale-[0.98]'
              }`}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Back to{' '}
          <Link
            to="/login"
            className="text-indigo-600 font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;