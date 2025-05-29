import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/main/HomeScreen';
import CourseDetailScreen from '../screens/main/CourseDetailScreen';
import VideoPlayerScreen from '../screens/main/VideoPlayerScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import SearchScreen from '../screens/main/SearchScreen';
import MyCoursesScreen from '../screens/main/MyCoursesScreen';
import CoursesScreen from '../screens/main/CoursesScreen';

// Context
import { AuthContext } from '../context/AuthContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else if (route.name === 'Subscription') {
                        iconName = focused ? 'card' : 'card-outline';
                    } else if (route.name === 'MyCourses') {
                        iconName = focused ? 'book' : 'book-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#3498db',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ headerShown: false }}
            />
            <Tab.Screen
                name="MyCourses"
                component={MyCoursesScreen}
                options={{
                    headerShown: false,
                    title: 'My Courses'
                }}
            />
            <Tab.Screen
                name="Subscription"
                component={SubscriptionScreen}
                options={{ headerShown: false }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ headerShown: false }}
            />
        </Tab.Navigator>
    );
};

// Main App Navigator
const AppNavigator = () => {
    const { userToken, isLoading } = useContext(AuthContext);

    // Show loading screen if checking authentication
    if (isLoading) {
        return null; // Or a loading component
    }

    return (
        <SubscriptionProvider>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {userToken ? (
                    // User is signed in
                    <>
                        <Stack.Screen name="Main" component={MainTabNavigator} />
                        <Stack.Screen name="Courses" component={CoursesScreen} />
                        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
                        <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
                    </>
                ) : (
                    // User is not signed in
                    <>
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </SubscriptionProvider>
    );
};

export default AppNavigator; 