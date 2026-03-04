import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { login as loginApi } from '../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ use context login

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await loginApi({ email, password });

      // Adjust based on your backend response shape
      const { accessToken, user } = response.data;

      // ✅ Call AuthContext login
      login({
        token: accessToken,
        user: user
      });

      navigate('/todos');

    } catch (error) {
      setError('Invalid credentials. Please try again.');
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center">Login</h2>

        {error && <p className="text-red-500">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-4 p-2 border border-gray-300 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-4 p-2 border border-gray-300 rounded"
        />

        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;