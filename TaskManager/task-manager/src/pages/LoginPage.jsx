import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { EmailIcon, EyeIcon, EyeOffIcon, LockIcon } from '../components/icons/Icons';
import InputField from '../components/input/InputField';

import { useAuth } from '../context/useAuth';
import { login as loginApi } from '../services/api';

import { validateEmail, validatePassword } from '../utils/validation';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitted(true);
    setError('');

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) return;

    try {
      const response = await loginApi({
        email: email.trim(),
        password: password.trim(),
      });

      const { accessToken, user } = response.data;

      login({ token: accessToken, user });

      navigate('/todos');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  const isDisabled = !email || !password;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-100">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">

        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Welcome Back
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

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
            placeholder="Enter your password"
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
              } `}
          >
            Login
          </button>

        </form>

        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-indigo-600 font-medium hover:underline"
          >
            Register
          </Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;