// Test script to add sample personal expenses for current month
// Run this from the backend directory: node test_data/add_sample_expenses.js

const mongoose = require('mongoose');
const PersonalExpense = require('../models/PersonalExpense');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/splitwise', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const sampleExpenses = [
    {
        userId: '687bfd482915b868e67d3c96', // Your user ID
        description: 'Coffee at Starbucks',
        amount: 250,
        category: 'Food',
        type: 'debit',
        date: new Date('2025-08-05') // Current month
    },
    {
        userId: '687bfd482915b868e67d3c96',
        description: 'Grocery shopping',
        amount: 1500,
        category: 'Groceries',
        type: 'debit',
        date: new Date('2025-08-04')
    },
    {
        userId: '687bfd482915b868e67d3c96',
        description: 'Uber ride',
        amount: 180,
        category: 'Transportation',
        type: 'debit',
        date: new Date('2025-08-03')
    },
    {
        userId: '687bfd482915b868e67d3c96',
        description: 'Movie tickets',
        amount: 800,
        category: 'Entertainment',
        type: 'debit',
        date: new Date('2025-08-02')
    },
    {
        userId: '687bfd482915b868e67d3c96',
        description: 'Salary credit',
        amount: 50000,
        category: 'Income',
        type: 'credit',
        date: new Date('2025-08-01')
    },
    {
        userId: '687bfd482915b868e67d3c96',
        description: 'Electricity bill',
        amount: 2500,
        category: 'Bills',
        type: 'debit',
        date: new Date('2025-08-06')
    },
    {
        userId: '687bfd482915b868e67d3c96',
        description: 'Lunch at restaurant',
        amount: 450,
        category: 'Food',
        type: 'debit',
        date: new Date() // Today
    }
];

async function addSampleExpenses() {
    try {
        console.log('Adding sample personal expenses...');
        
        // Clear existing expenses for this user (optional)
        // await PersonalExpense.deleteMany({ userId: '687bfd482915b868e67d3c96' });
        
        // Add sample expenses
        const result = await PersonalExpense.insertMany(sampleExpenses);
        console.log(`Added ${result.length} sample expenses`);
        
        // Verify the data
        const allExpenses = await PersonalExpense.find({ userId: '687bfd482915b868e67d3c96' });
        console.log(`Total expenses for user: ${allExpenses.length}`);
        
        console.log('Sample expenses added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding sample expenses:', error);
        process.exit(1);
    }
}

addSampleExpenses();
