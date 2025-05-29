import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { courseService } from '../../api/courseService';
import { AuthContext } from '../../context/AuthContext';
import { SubscriptionContext } from '../../context/SubscriptionContext';
import { COLORS } from '../../utils/theme';

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [courses, setCourses] = useState([]);
    const [featuredCourses, setFeaturedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const { user } = useContext(AuthContext);
    const { hasActiveSubscription } = useContext(SubscriptionContext);

    const fetchCourses = async () => {
        try {
            setError(null);
            const data = await courseService.getAllCourses();

            // Sort courses by date (newest first)
            const sortedCourses = [...data].sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            setCourses(sortedCourses);

            // Get featured courses (could be based on rating or manually selected)
            const featured = sortedCourses
                .filter(course => course.rating >= 4)
                .slice(0, 5);

            setFeaturedCourses(featured);
        } catch (err) {
            setError('Failed to load courses. Please try again.');
            console.error('Error fetching courses:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCourses();
    };

    const handleCoursePress = (course) => {
        navigation.navigate('CourseDetail', { courseId: course._id });
    };

    const renderCourseCard = ({ item }) => (
        <TouchableOpacity
            style={styles.courseCard}
            onPress={() => handleCoursePress(item)}
        >
            <Image
                source={{ uri: item.thumbnail || 'https://via.placeholder.com/300x200' }}
                style={styles.courseImage}
                resizeMode="cover"
            />
            <View style={styles.courseInfo}>
                <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.courseDescription} numberOfLines={2}>{item.description}</Text>
                <View style={styles.courseMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.metaText}>{item.totalDuration || 0} mins</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={16} color="#666" />
                        <Text style={styles.metaText}>{item.totalStudents || 0} students</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderAboutSection = () => (
        <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About Us</Text>
            <View style={styles.aboutContent}>
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80' }}
                    style={styles.aboutImage}
                    resizeMode="cover"
                />
                <Text style={styles.aboutTitle}>Welcome to Our Learning Platform</Text>
                <Text style={styles.aboutDescription}>
                    We are dedicated to providing high-quality education through our comprehensive online courses.
                    Our platform offers expert-led courses designed to help you achieve your learning goals.
                </Text>
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>100+</Text>
                        <Text style={styles.statLabel}>Courses</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>50k+</Text>
                        <Text style={styles.statLabel}>Students</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>95%</Text>
                        <Text style={styles.statLabel}>Success Rate</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome back,</Text>
                        <Text style={styles.userName}>{user?.name || 'Student'}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Ionicons name="person-circle-outline" size={32} color="#fff" />
                    </TouchableOpacity>
                </View>

                {renderAboutSection()}

                <View style={styles.categoriesSection}>
                    <Text style={styles.sectionTitle}>Popular Categories</Text>
                    <View style={styles.categoriesGrid}>
                        {['Web Development', 'Mobile Apps', 'Data Science', 'Design'].map((category, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.categoryCard}
                                onPress={() => navigation.navigate('CategoryCourses', { category })}
                            >
                                <Ionicons
                                    name={['code', 'phone-portrait', 'analytics', 'color-palette'][index]}
                                    size={24}
                                    color={COLORS.primary}
                                />
                                <Text style={styles.categoryTitle}>{category}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: COLORS.primary,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.8,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileButton: {
        padding: 8,
    },
    aboutSection: {
        padding: 20,
        backgroundColor: '#fff',
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 20,
    },
    aboutContent: {
        alignItems: 'center',
    },
    aboutImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 20,
    },
    aboutTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
        textAlign: 'center',
    },
    aboutDescription: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
    categoriesSection: {
        padding: 20,
        marginTop: 20,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    categoryTitle: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        textAlign: 'center',
    },
});

export default HomeScreen; 