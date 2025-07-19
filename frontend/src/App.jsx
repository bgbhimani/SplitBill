// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';

// Public Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Private Pages (Placeholder for now - we'll build this next)
import DashboardPage from './pages/DashboardPage';
// import ProfilePage from './pages/ProfilePage';
// import GroupsPage from './pages/GroupsPage';
// import GroupDetailPage from './pages/GroupDetailPage';

function App() {
  return (
    <Router>
      <AuthProvider> {/* Wrap your entire application with AuthProvider */}
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Private Routes - All routes inside this <Route> will be protected */}
          <Route path="/" element={<PrivateRoute />}>
            <Route index element={<DashboardPage />} /> {/* Renders DashboardPage at / */}
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Add other private routes here as you build them: */}
            {/* <Route path="/profile" element={<ProfilePage />} /> */}
            {/* <Route path="/groups" element={<GroupsPage />} /> */}
            {/* <Route path="/groups/:groupId" element={<GroupDetailPage />} /> */}
          </Route>

          {/* Catch-all for 404 Not Found pages (optional for now) */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;