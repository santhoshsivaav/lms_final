import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../api/authService';

// Create the context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    // Check if user is logged in on app start
    useEffect(() => {
        const bootstrapAsync = async () => {
            try {
                // Get token from secure storage
                const token = await SecureStore.getItemAsync('authToken');

                if (token) {
                    // Verify token and get user profile
                    const userProfile = await authService.getProfile();
                    setUser(userProfile);
                    setUserToken(token);
                }
            } catch (e) {
                // Token is invalid or expired
                await SecureStore.deleteItemAsync('authToken');
                setUser(null);
                setUserToken(null);
            } finally {
                setIsLoading(false);
            }
        };

        bootstrapAsync();
    }, []);

    // Login function
    const login = async (email, password) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.login({ email, password });
            const { token, user } = response;

            // Save token to secure storage
            await SecureStore.setItemAsync('authToken', token);

            setUserToken(token);
            setUser(user);
            return true;
        } catch (error) {
            setError(error.message || 'Login failed');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Register function
    const register = async (name, email, password) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.register({ name, email, password });
            const { token, user } = response;

            // Save token to secure storage
            await SecureStore.setItemAsync('authToken', token);

            setUserToken(token);
            setUser(user);
            return true;
        } catch (error) {
            setError(error.message || 'Registration failed');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Logout function
    const logout = async () => {
        setIsLoading(true);

        try {
            // Remove token from secure storage
            await SecureStore.deleteItemAsync('authToken');
            setUserToken(null);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isLoading,
                userToken,
                user,
                error,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}; 