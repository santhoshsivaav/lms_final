import React, { useContext, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { SubscriptionContext } from '../../context/SubscriptionContext';
import { COLORS } from '../../utils/theme';
import FormInput from '../../components/FormInput';
import Button from '../../components/Button';

const ProfileScreen = ({ navigation }) => {
    const { user, logout, isLoading: authLoading } = useContext(AuthContext);
    const { hasActiveSubscription } = useContext(SubscriptionContext);

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [downloadQuality, setDownloadQuality] = useState('HD');

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout }
            ]
        );
    };

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        try {
            setLoading(true);

            // In a real app, you would call an API to update the profile
            // For now, we'll just simulate a delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            Alert.alert('Success', 'Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const renderProfileHeader = () => (
        <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                </View>
                {hasActiveSubscription && (
                    <View style={styles.premiumBadge}>
                        <Ionicons name="star" size={12} color="#fff" />
                    </View>
                )}
            </View>

            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>

            {hasActiveSubscription && (
                <View style={styles.subscriptionBadge}>
                    <Text style={styles.subscriptionText}>Premium Member</Text>
                </View>
            )}
        </View>
    );

    const renderProfileForm = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                {!isEditing && (
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Ionicons name="create-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {isEditing ? (
                <View style={styles.formContainer}>
                    <FormInput
                        label="Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your name"
                    />

                    <FormInput
                        label="Email"
                        value={email}
                        editable={false}
                        style={styles.disabledInput}
                    />

                    <View style={styles.buttonRow}>
                        <Button
                            title="Cancel"
                            onPress={() => {
                                setName(user?.name || '');
                                setIsEditing(false);
                            }}
                            type="secondary"
                            style={styles.buttonMargin}
                        />
                        <Button
                            title="Save"
                            onPress={handleSaveProfile}
                            loading={loading}
                        />
                    </View>
                </View>
            ) : (
                <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Name</Text>
                        <Text style={styles.infoValue}>{user?.name || 'Not set'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Member Since</Text>
                        <Text style={styles.infoValue}>
                            {user?.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : 'Not available'}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );

    const renderSettings = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Push Notifications</Text>
                    <Text style={styles.settingDescription}>
                        Receive notifications about new courses and updates
                    </Text>
                </View>
                <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: '#d0d0d0', true: COLORS.primary }}
                    thumbColor="#fff"
                />
            </View>

            <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Download Quality</Text>
                    <Text style={styles.settingDescription}>
                        Choose video quality for downloads
                    </Text>
                </View>
                <View style={styles.qualitySelector}>
                    {['SD', 'HD', '4K'].map(quality => (
                        <TouchableOpacity
                            key={quality}
                            style={[
                                styles.qualityOption,
                                downloadQuality === quality && styles.selectedQuality
                            ]}
                            onPress={() => setDownloadQuality(quality)}
                        >
                            <Text
                                style={[
                                    styles.qualityText,
                                    downloadQuality === quality && styles.selectedQualityText
                                ]}
                            >
                                {quality}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    const renderActions = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Subscription')}
            >
                <View style={styles.actionInfo}>
                    <Ionicons name="card-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.actionText}>Manage Subscription</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#7f8c8d" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionInfo}>
                    <Ionicons name="help-circle-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.actionText}>Help & Support</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#7f8c8d" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionInfo}>
                    <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.actionText}>Terms & Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#7f8c8d" />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={handleLogout}
            >
                <View style={styles.actionInfo}>
                    <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
                    <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    if (authLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <ScrollView style={styles.content}>
                {renderProfileHeader()}
                {renderProfileForm()}
                {renderSettings()}
                {renderActions()}
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
        flex: 1,
    },
    profileHeader: {
        backgroundColor: '#fff',
        padding: 24,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    premiumBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#f1c40f',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 12,
    },
    subscriptionBadge: {
        backgroundColor: '#f1c40f',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    subscriptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 16,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    infoContainer: {
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
    },
    infoLabel: {
        width: 100,
        fontSize: 16,
        color: '#7f8c8d',
    },
    infoValue: {
        flex: 1,
        fontSize: 16,
        color: '#2c3e50',
    },
    formContainer: {
        marginBottom: 16,
    },
    disabledInput: {
        backgroundColor: '#f5f5f5',
        opacity: 0.7,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    buttonMargin: {
        marginRight: 12,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        color: '#2c3e50',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    qualitySelector: {
        flexDirection: 'row',
    },
    qualityOption: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#ecf0f1',
        marginLeft: 8,
    },
    selectedQuality: {
        backgroundColor: COLORS.primary,
    },
    qualityText: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    selectedQualityText: {
        color: '#fff',
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
    },
    actionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 16,
        color: '#2c3e50',
        marginLeft: 12,
    },
    logoutButton: {
        borderBottomWidth: 0,
    },
    logoutText: {
        color: COLORS.danger,
    },
});

export default ProfileScreen; 