import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserInfo.css';

export const UserInfo: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    if (window.confirm('Вы действительно хотите выйти?')) {
      logout();
    }
  };

  return (
    <div className="user-info">
      <div className="user-details">
        <span className="username">{user.username}</span>
        <span className={`role role-${user.role}`}>
          {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
        </span>
      </div>
      <button 
        onClick={handleLogout}
        className="logout-button"
        title="Выйти"
      >
        Выход
      </button>
    </div>
  );
};
