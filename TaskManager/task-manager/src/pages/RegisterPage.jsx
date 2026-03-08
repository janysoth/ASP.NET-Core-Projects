import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { EmailIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../components/icons/Icons';
import InputField from '../components/input/InputField';

import { register as registerApi } from '../services/api';
import { validateEmail, validateFullName, validatePassword } from '../utils/validation';

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitted(true);
    setError('');

    const nameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (nameError || emailError || passwordError) return;

    try {
      await registerApi({ fullName, email, password });
      navigate('/login');
    } catch (error) {
      console.error("Registration error:", error.response?.data);

      setError("Registration failed. Please try again.");
      console.error("Registration error:", error);
    }
  };


  const isDisabled =
    validateEmail(email) !== '' ||
    validatePassword(password) !== '' ||
    validateFullName(fullName) !== '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-100">

      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">

        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Create Account
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <InputField
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            icon={<UserIcon />}
            value={fullName}
            onChange={setFullName}
            validate={validateFullName}
            showError={submitted}
          />

          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            icon={<EmailIcon />}
            value={email}
            onChange={setEmail}
            validate={validateEmail}
            showError={submitted}
          />

          <InputField
            label="Password"
            type="password"
            placeholder="Create a password"
            icon={<LockIcon />}
            value={password}
            onChange={setPassword}
            showIcon={<EyeIcon />}
            hideIcon={<EyeOffIcon />}
            validate={validatePassword}
            showError={submitted}
          />

          <button
            type="submit"
            disabled={isDisabled}
            className={`w-full py-3 font-semibold rounded-md transition
              ${isDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
          >
            Register
          </button>

        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
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

export default RegisterPage;