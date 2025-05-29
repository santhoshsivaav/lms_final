import api from './api';

export const subscriptionService = {
    // Get subscription plans
    getSubscriptionPlans: async () => {
        try {
            const response = await api.get('/subscriptions/plans');
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : { message: 'Network error' };
        }
    },

    // Create a subscription order
    createOrder: async (planId) => {
        try {
            const response = await api.post('/subscriptions/subscribe', { planId });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : { message: 'Network error' };
        }
    },

    // Verify payment
    verifyPayment: async (paymentData) => {
        try {
            const response = await api.post('/subscriptions/verify', paymentData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : { message: 'Network error' };
        }
    },

    // Get subscription status
    getSubscriptionStatus: async () => {
        try {
            const response = await api.get('/subscriptions/status');
            console.log('Raw subscription status response:', response); // Debug log
            return response.data;
        } catch (error) {
            console.error('Error fetching subscription status:', error);
            throw error;
        }
    },

    // Cancel subscription
    cancelSubscription: async () => {
        try {
            const response = await api.post('/subscriptions/cancel');
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : { message: 'Network error' };
        }
    }
}; 