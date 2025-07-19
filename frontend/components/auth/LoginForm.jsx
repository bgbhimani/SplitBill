// client/src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth hook
import { Link } from 'react-router-dom'; // For navigation

const { Title } = Typography;

const LoginForm = () => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth(); // Get login function from context

    const onFinish = async (values) => {
        setLoading(true);
        setError(null);
        try {
            await login(values.email, values.password);
            // Redirection handled by AuthContext
        } catch (err) {
            // Backend error messages come from err.response?.data?.message
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto my-12 p-6 md:p-8 bg-white shadow-lg rounded-lg border border-gray-200">
            <Title level={3} className="text-center mb-6 text-gray-800">Login to Splitwise</Title>
            {error && <Alert message={error} type="error" showIcon className="mb-4" />}
            <Form
                name="login"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                layout="vertical" // Stack labels above inputs
            >
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: 'Please input your Email!' },
                        { type: 'email', message: 'Please enter a valid email address!' }
                    ]}
                >
                    <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Email" size="large" />
                </Form.Item>
                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: 'Please input your Password!' }]}
                >
                    <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="Password" size="large" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} className="w-full text-lg h-auto py-2">
                        Log in
                    </Button>
                </Form.Item>
            </Form>
            <div className="text-center text-gray-600 mt-4">
                Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register now!</Link>
            </div>
        </div>
    );
};

export default LoginForm;