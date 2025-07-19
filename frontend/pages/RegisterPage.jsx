// client/src/pages/RegisterPage.jsx
import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-cyan-100 flex items-center justify-center">
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;