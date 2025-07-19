import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Make sure your Tailwind CSS directives are in here
import 'antd/dist/reset.css'; // For Ant Design v5.x (the current stable)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);