import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SubscriptionContext } from '../../context/SubscriptionContext';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../utils/theme';
import { RAZORPAY_KEY_ID } from '../../utils/config';
import Button from '../../components/Button';

// Mock subscription plans (in a real app, these would come from the API)
const SUBSCRIPTION_PLANS = [
    {
        _id: 'basic',
        name: 'Basic Plan',
        price: 499,
        duration: 1, // months
        features: [
            'Access to all courses',
            'HD video quality',
            'Watch on mobile and tablet',
        ],
        color: '#3498db',
    },
    {
        _id: 'premium',
        name: 'Premium Plan',
        price: 999,
        duration: 3, // months
        features: [
            'Access to all courses',
            '4K video quality',
            'Watch on all devices',
            'Offline downloads',
            'Priority support',
        ],
        color: '#9b59b6',
    }
];

const SubscriptionScreen = ({ navigation }) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState(SUBSCRIPTION_PLANS);

    const { user } = useContext(AuthContext);
    const {
        subscriptionStatus,
        createSubscriptionOrder,
        verifyPayment,
        cancelSubscription,
        fetchSubscriptionStatus,
        hasActiveSubscription,
        isLoading: isSubscriptionLoading
    } = useContext(SubscriptionContext);

    useEffect(() => {
        // Fetch subscription plans from the server
        const fetchPlans = async () => {
            try {
                const response = await fetch('/subscriptions/plans');
                const data = await response.json();
                if (data && data.length > 0) {
                    setPlans(data);
                }
            } catch (error) {
                console.error('Error fetching subscription plans:', error);
                // Fallback to mock plans if API fails
            }
        };

        fetchPlans();
    }, []);

    const handleSubscribe = async (planId) => {
        try {
            setLoading(true);

            // Create Razorpay order
            const order = await createSubscriptionOrder(planId);

            if (!order || !order.orderId) {
                Alert.alert('Error', 'Failed to create subscription order');
                return;
            }

            // Configure payment options
            const options = {
                description: `Subscription for ${plans.find(p => p._id === planId)?.name}`,
                image: 'https://your-app-logo-url.png',
                currency: order.currency,
                key: RAZORPAY_KEY_ID,
                amount: order.amount * 100, // Amount in paise
                name: 'LMS App',
                order_id: order.orderId,
                prefill: {
                    email: user?.email,
                    contact: user?.phone || '',
                    name: user?.name || ''
                },
                theme: { color: COLORS.primary }
            };

            // Open Razorpay payment window
            if (Platform.OS === 'web') {
                // Handle web payments
                window.location.href = `${options.payment_url}?order_id=${options.order_id}`;
            } else {
                // For native apps, you would use react-native-razorpay
                // This is a simplified example of what you might do
                Alert.alert(
                    'Razorpay Integration',
                    'In a real app, this would open the Razorpay payment window. For now, we will simulate a successful payment.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Simulate Success',
                            onPress: () => {
                                // Simulate successful payment verification
                                const mockPaymentData = {
                                    razorpay_order_id: order.orderId,
                                    razorpay_payment_id: 'pay_' + Math.random().toString(36).slice(2),
                                    razorpay_signature: 'sig_' + Math.random().toString(36).slice(2),
                                    planId
                                };

                                // Verify payment
                                handlePaymentSuccess(mockPaymentData);
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Subscription error:', error);
            Alert.alert('Error', 'Failed to process subscription');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = async (paymentData) => {
        try {
            setLoading(true);
            const result = await verifyPayment(paymentData);

            if (result.success) {
                Alert.alert('Success', 'Your subscription is now active!');
                await fetchSubscriptionStatus(); // Refresh subscription status
            } else {
                Alert.alert('Error', 'Payment verification failed');
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            Alert.alert('Error', 'Failed to verify payment');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        Alert.alert(
            'Cancel Subscription',
            'Are you sure you want to cancel your subscription?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const result = await cancelSubscription();

                            if (result) {
                                Alert.alert('Success', 'Your subscription has been cancelled');
                                await fetchSubscriptionStatus(); // Refresh subscription status
                            } else {
                                Alert.alert('Error', 'Failed to cancel subscription');
                            }
                        } catch (error) {
                            console.error('Cancellation error:', error);
                            Alert.alert('Error', 'Failed to cancel subscription');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderActiveSubscription = () => (
        <View style={styles.activeSubscriptionContainer}>
            <View style={styles.activeSubscriptionHeader}>
                <Ionicons name="checkmark-circle" size={40} color={COLORS.success} />
                <Text style={styles.activeSubscriptionTitle}>Active Subscription</Text>
            </View>

            <View style={styles.subscriptionDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Plan:</Text>
                    <Text style={styles.detailValue}>
                        {subscriptionStatus?.subscription?.plan === 'basic' ? 'Basic Plan' : 'Premium Plan'}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Start Date:</Text>
                    <Text style={styles.detailValue}>
                        {formatDate(subscriptionStatus?.subscription?.startDate)}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expiry Date:</Text>
                    <Text style={styles.detailValue}>
                        {formatDate(subscriptionStatus?.subscription?.endDate)}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, styles.activeStatus]}>
                        Active
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSubscription}
            >
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
        </View>
    );

    const renderPlanCard = (plan) => (
        <TouchableOpacity
            key={plan._id}
            style={[
                styles.planCard,
                selectedPlan === plan._id && styles.selectedPlanCard,
                { borderColor: plan.color }
            ]}
            onPress={() => setSelectedPlan(plan._id)}
            disabled={loading}
        >
            <View style={[styles.planHeader, { backgroundColor: plan.color }]}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>₹{plan.price}</Text>
                <Text style={styles.planDuration}>for {plan.duration} month{plan.duration > 1 ? 's' : ''}</Text>
            </View>

            <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={20} color={plan.color} />
                        <Text style={styles.featureText}>{feature}</Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subscription</Text>
            </View>

            <ScrollView style={styles.content}>
                {isSubscriptionLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : hasActiveSubscription ? (
                    renderActiveSubscription()
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>Choose a Plan</Text>
                        <Text style={styles.sectionDescription}>
                            Subscribe to access all courses and premium features
                        </Text>

                        <View style={styles.plansContainer}>
                            {plans.map(renderPlanCard)}
                        </View>

                        <Button
                            title="Subscribe Now"
                            onPress={() => handleSubscribe(selectedPlan)}
                            disabled={!selectedPlan || loading}
                            loading={loading}
                            style={styles.subscribeButton}
                        />
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#2c3e50',
    },
    sectionDescription: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 20,
    },
    plansContainer: {
        marginBottom: 24,
    },
    planCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    selectedPlanCard: {
        borderWidth: 3,
        elevation: 4,
        shadowOpacity: 0.2,
    },
    planHeader: {
        padding: 16,
        alignItems: 'center',
    },
    planName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    planPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    planDuration: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.8,
    },
    planFeatures: {
        padding: 16,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#2c3e50',
    },
    subscribeButton: {
        marginBottom: 24,
    },
    activeSubscriptionContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
    },
    activeSubscriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    activeSubscriptionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginLeft: 10,
    },
    subscriptionDetails: {
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    detailLabel: {
        width: 100,
        fontSize: 16,
        color: '#7f8c8d',
    },
    detailValue: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#2c3e50',
    },
    activeStatus: {
        color: COLORS.success,
        fontWeight: 'bold'
    },
    cancelButton: {
        backgroundColor: '#dc3545',
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
        alignItems: 'center'
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
    backButton: {
        padding: 10,
    },
});

export default SubscriptionScreen; 