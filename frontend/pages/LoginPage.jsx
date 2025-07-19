// client/src/pages/LoginPage.jsx
import React from 'react';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
      <LoginForm />
    </div>
  );
};

export default LoginPage;