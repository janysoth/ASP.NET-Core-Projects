import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/api'; // Import the logout function

const TodosPage = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('token'); // Clear token from localStorage
    navigate('/login');
  };

  return (
    <div>
      <button onClick={handleLogout} className="p-2 bg-red-600 text-white rounded">
        Logout
      </button>
      {/* Other Todo functionality here */}
    </div>
  );
};

export default TodosPage;