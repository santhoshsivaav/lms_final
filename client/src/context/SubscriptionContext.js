import React, { createContext, useState, useEffect, useContext } from 'react';
import { subscriptionService } from '../api/subscriptionService';
import { AuthContext } from './AuthContext';

// Create the context
export const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [error, setError] = useState(null);

  const { userToken } = useContext(AuthContext);

  // Check subscription status when user token changes
  useEffect(() => {
    if (userToken) {
      fetchSubscriptionStatus();
      fetchSubscriptionPlans();
    } else {
      setSubscriptionStatus(null);
    }
  }, [userToken]);

  // Fetch subscription status
  const fetchSubscriptionStatus = async () => {
    if (!userToken) return;

    setIsLoading(true);
    try {
      const response = await subscriptionService.getSubscriptionStatus();
      console.log('Subscription status response:', response); // Debug log
      setSubscriptionStatus(response);
    } catch (error) {
      setError(error.message || 'Failed to fetch subscription status');
      console.error('Subscription status error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch subscription plans
  const fetchSubscriptionPlans = async () => {
    try {
      const plans = await subscriptionService.getSubscriptionPlans();
      setSubscriptionPlans(plans);
    } catch (error) {
      console.error('Subscription plans error:', error);
    }
  };

  // Create a subscription order
  const createSubscriptionOrder = async (planId) => {
    setIsLoading(true);
    setError(null);

    try {
      const order = await subscriptionService.createOrder(planId);
      return order;
    } catch (error) {
      setError(error.message || 'Failed to create subscription order');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify subscription payment
  const verifyPayment = async (paymentData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await subscriptionService.verifyPayment(paymentData);
      await fetchSubscriptionStatus(); // Refresh subscription status
      return result;
    } catch (error) {
      setError(error.message || 'Payment verification failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await subscriptionService.cancelSubscription();
      await fetchSubscriptionStatus(); // Refresh subscription status
      return true;
    } catch (error) {
      setError(error.message || 'Failed to cancel subscription');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isLoading,
        subscriptionStatus,
        subscriptionPlans,
        error,
        fetchSubscriptionStatus,
        createSubscriptionOrder,
        verifyPayment,
        cancelSubscription,
        hasActiveSubscription: subscriptionStatus?.isActive === true,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}; 