import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

// Create the context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userToken, setUserToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            const token = await AsyncStorage.getItem('token');
            if (userData && token) {
                setUser(JSON.parse(userData));
                setUserToken(token);
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name, email, password, preferredCategories) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await authService.register({
                name,
                email,
                password,
                preferredCategories
            });

            if (response.success) {
                const { token, user: userData } = response.data;
                console.log('Registration response:', response.data); // Debug log
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                await AsyncStorage.setItem('token', token);
                setUser(userData);
                setUserToken(token);
                return true;
            } else {
                setError(response.message);
                return false;
            }
        } catch (error) {
            console.error('Registration error:', error);
            setError(error.message || 'An error occurred during registration');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (token, userData) => {
        try {
            setIsLoading(true);
            setError(null);

            // Set the user data and token
            setUser(userData);
            setUserToken(token);
            return true;
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message || 'An error occurred during login');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('token');
            setUser(null);
            setUserToken(null);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserPreferences = async (preferredCategories) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await authService.updatePreferences({ preferredCategories });

            if (response.success) {
                const updatedUser = { ...user, preferredCategories };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                return true;
            } else {
                setError(response.message);
                return false;
            }
        } catch (error) {
            console.error('Update preferences error:', error);
            setError(error.message || 'An error occurred while updating preferences');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userToken,
                isLoading,
                error,
                register,
                login,
                logout,
                updateUserPreferences
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}; 