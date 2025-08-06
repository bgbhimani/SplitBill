import React, { useState, useEffect } from 'react';
import { personalExpensesAPI } from '../../services/api';
import { mlServices } from '../../services/mlAPI';

const AddPersonalExpenseModal = ({ isOpen, onClose, onExpenseAdded }) => {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0], // Today's date
        category: '',
        type: 'debit', // Default to debit (expense)
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [predictingCategory, setPredictingCategory] = useState(false);
    const [suggestedCategory, setSuggestedCategory] = useState('');

    const predefinedCategories = [
        'Groceries',
        'Vegetable',
        'Food',
        'Taxi',
        'Fuel',
        'Rent',
        'Electricit',
        'Water',
        'Internet',
        'Other',
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto-predict category when description changes
        if (name === 'description' && value.trim().length > 2) {
            predictCategory(value.trim());
        }
    };

    const predictCategory = async (description) => {
        try {
            setPredictingCategory(true);
            const response = await mlServices.predictCategory(description);
            setSuggestedCategory(response.predicted_category);
        } catch (error) {
            console.error('Failed to predict category:', error);
            setSuggestedCategory('');
        } finally {
            setPredictingCategory(false);
        }
    };

    const applySuggestedCategory = () => {
        setFormData(prev => ({
            ...prev,
            category: suggestedCategory
        }));
        setSuggestedCategory('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.description.trim() || !formData.amount || !formData.type) {
            setError('Please fill in all required fields');
            return;
        }

        if (parseFloat(formData.amount) <= 0) {
            setError('Amount must be greater than 0');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const expenseData = {
                ...formData,
                amount: parseFloat(formData.amount)
            };

            await personalExpensesAPI.addPersonalExpense(expenseData);

            // Reset form
            setFormData({
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                category: '',
                type: 'debit',
                notes: ''
            });

            onExpenseAdded();
        } catch (error) {
            console.error('Error adding personal expense:', error);
            setError(error.response?.data?.message || 'Failed to add expense');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            category: '',
            type: 'debit',
            notes: ''
        });
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Add Personal Transaction</h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description *
                            </label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter transaction description"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (₹) *
                            </label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                                Transaction Type *
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select transaction type</option>
                                <option value="debit">💸 Debit (Expense/Money Out)</option>
                                <option value="credit">💰 Credit (Income/Money In)</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                                {predictingCategory && (
                                    <span className="text-blue-500 text-xs ml-2">🤖 Predicting...</span>
                                )}
                            </label>
                            
                            {/* AI Suggestion Banner */}
                            {suggestedCategory && !formData.category && (
                                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-blue-700">
                                            🤖 AI suggests: <strong>{suggestedCategory}</strong>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={applySuggestedCategory}
                                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select a category</option>
                                {predefinedCategories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Additional notes (optional)"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    formData.type === 'credit' 
                                        ? 'bg-green-600 hover:bg-green-700' 
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {loading ? 'Adding...' : `Add ${formData.type === 'credit' ? 'Credit' : 'Debit'}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddPersonalExpenseModal;
