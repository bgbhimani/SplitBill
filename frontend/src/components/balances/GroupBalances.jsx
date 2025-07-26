import React, { useState, useEffect } from 'react';
import { groupsAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const GroupBalances = ({ groupId, group }) => {
  const [balances, setBalances] = useState([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('balances');
  const { showError } = useNotification();

  useEffect(() => {
    if (groupId) {
      fetchBalancesAndDebts();
    }
  }, [groupId]);

  const fetchBalancesAndDebts = async () => {
    try {
      setLoading(true);
      const [balancesResponse, debtsResponse] = await Promise.all([
        groupsAPI.getGroupBalances(groupId),
        groupsAPI.getSimplifiedDebts(groupId)
      ]);
      
      setBalances(balancesResponse.data);
      setSimplifiedDebts(debtsResponse.data);
    } catch (err) {
      showError('Failed to fetch balance information');
    } finally {
      setLoading(false);
    }
  };

  const getUserById = (userId) => {
    return group?.members?.find(member => member._id === userId);
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Group Balances</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'balances'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Balances
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'settlements'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Settlements
          </button>
        </div>
      </div>

      {activeTab === 'balances' && (
        <div className="space-y-3">
          {balances.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No expenses yet, so everyone is settled up!</p>
            </div>
          ) : (
            balances.map(balance => {
              const user = getUserById(balance.userId);
              const isPositive = balance.balance > 0;
              const isZero = Math.abs(balance.balance) < 0.01;
              
              return (
                <div key={balance.userId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">@{user?.username}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {isZero ? (
                      <span className="text-sm text-gray-500 font-medium">Settled up</span>
                    ) : (
                      <div className={`text-sm font-medium ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? 'Gets back' : 'Owes'} ₹{Math.abs(balance.balance).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'settlements' && (
        <div className="space-y-3">
          {simplifiedDebts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="text-green-600 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">All settled up!</h3>
              <p className="text-gray-600">Everyone in this group is settled up.</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Simplified settlements:</span> Instead of everyone paying everyone, 
                  here's the minimum number of transactions needed to settle all debts.
                </p>
              </div>
              
              {simplifiedDebts.map((debt, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-yellow-50">
                  <div className="flex items-center space-x-4">
                    {/* From user */}
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-medium">
                        {debt.from?.firstName?.charAt(0)}{debt.from?.lastName?.charAt(0)}
                      </div>
                      <div className="ml-2">
                        <p className="text-sm font-medium text-gray-900">
                          {debt.from?.firstName} {debt.from?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">@{debt.from?.username}</p>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex items-center space-x-2">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">₹{debt.amount?.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">owes</div>
                      </div>
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    
                    {/* To user */}
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
                        {debt.to?.firstName?.charAt(0)}{debt.to?.lastName?.charAt(0)}
                      </div>
                      <div className="ml-2">
                        <p className="text-sm font-medium text-gray-900">
                          {debt.to?.firstName} {debt.to?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">@{debt.to?.username}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors">
                    Record Payment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupBalances;
