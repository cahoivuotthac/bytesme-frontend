import { createContext, useState, useContext, useEffect } from 'react'
import { Alert } from 'react-native'
import { APIClient } from '@/utils/api'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAlert } from '@/hooks/useAlert'
import { useTranslation } from './locale'

// Define the structure of our auth state
type AuthState = {
	isAuthenticated: boolean
	isLoading: boolean
	user: any | null
}

// Define the shape of the context
type AuthContextType = {
	// getAuthState: () => Promise<AuthState>
	// setAuthState: (authState: AuthState) => Promise<void>
	authState: AuthState
	verifyPhone: (phoneNumber: string, code: string) => Promise<boolean>
	signin: (email: string, password: string) => Promise<boolean>
	logout: () => Promise<void>
	signup: (userData: any) => Promise<boolean>
	refreshUser: () => Promise<void>
	resetPassword: (phoneNumber: string, newPassword: string) => Promise<void>
}

// Default auth state
const defaultAuthState: AuthState = {
	isAuthenticated: false,
	isLoading: true,
	user: null,
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component that wraps your app and makes auth object available to any child component
export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { t } = useTranslation()
	const [authState, setAuthState] = useState<AuthState>(defaultAuthState)

	// Function to check if a session exists
	useEffect(() => {
		const checkSession = async () => {
			try {
				const response = await APIClient.get('/auth/user')

				if (response.status === 200) {
					const userData = response.data
					setAuthState({
						isAuthenticated: true,
						isLoading: false,
						user: userData,
					})
					console.log('Session exists, userData:', userData)
				} else if (response.status === 401) {
					// User is not authenticated
					console.log('Session expired or not authenticated')
					// router.navigate('/(auth)/input-phone')
				} else {
					// No valid session
					setAuthState({
						...defaultAuthState,
						isLoading: false,
					})
				}
			} catch (error) {
				console.error('Error checking session:', error)
				setAuthState({
					...defaultAuthState,
					isLoading: false,
				})
			}
		}

		checkSession()
	}, [])

	// Login function
	const signin = async (email: string, password: string): Promise<boolean> => {
		try {
			const response = await APIClient.post('/auth/signin', {
				email,
				password,
			})

			if (response.status === 200) {
				// Store authentication state in memory
				setAuthState({
					isAuthenticated: true,
					isLoading: false,
					user: response.data.user,
				})

				// Store a simple flag to indicate the user has logged in before
				await AsyncStorage.setItem('has_session', 'true')

				return true
			} else {
				// Handle error based on Laravel response
				throw new Error(response.data.message || 'Invalid credentials')
			}
		} catch (error: any) {
			throw new Error(error.message)
		}
	}

	// Logout function
	const logout = async (): Promise<void> => {
		try {
			// Call Laravel logout endpoint
			await APIClient.post('/auth/logout')
		} catch (error) {
			console.error('Logout API error:', error)
		} finally {
			// Clear flag and reset state
			await AsyncStorage.removeItem('has_session')
			setAuthState({
				...defaultAuthState,
				isLoading: false,
			})
		}
	}

	// Register function
	const signup = async (userData: any): Promise<boolean> => {
		try {
			const response = await APIClient.post('/auth/signup', userData)

			if (response.status === 200 || response.status === 201) {
				// If registration automatically logs in user
				if (response.data.user) {
					setAuthState({
						isAuthenticated: true,
						isLoading: false,
						user: response.data.user,
					})

					await AsyncStorage.setItem('has_session', 'true')
				}
				return true
			} else {
				// Handle validation errors from Laravel
				console.error('Registration API error: ', response.data.message)
				throw new Error(response.data.message)
			}
		} catch (error: any) {
			console.error('Registration error: ', error)
			throw new Error(error?.response?.data?.message || error.message)
		}
	}

	const getAuthState = async (): Promise<AuthState> => {
		const storedAuthState = await AsyncStorage.getItem('authState')
		if (storedAuthState) {
			return JSON.parse(storedAuthState)
		}
		return defaultAuthState
	}

	const verifyPhone = async (
		phoneNumber: string,
		code: string
	): Promise<boolean> => {
		try {
			const response = await APIClient.post('/auth/otp/verify', {
				phone_number: phoneNumber,
				code,
			})

			if (response.status === 200) {
				// Store authentication state in memory
				if (response.data.user) {
					setAuthState({
						isAuthenticated: true,
						isLoading: false,
						user: response.data.user,
					})

					await AsyncStorage.setItem('has_session', 'true')
				}
				return true
			} else {
				throw new Error(response.data.message)
			}
		} catch (error: any) {
			console.error('Error verifying OTP: ', error)
			throw new Error(error?.response?.data?.message || error.message)
		}
	}

	// Refresh user data
	const refreshUser = async (): Promise<void> => {
		if (!(await getAuthState()).isAuthenticated) return

		try {
			const response = await APIClient.get('/auth/user')

			if (response.status === 200) {
				setAuthState({
					user: response.data.user,
					isAuthenticated: true,
					isLoading: false,
				})
			}
		} catch (error) {
			console.error('Error refreshing user data:', error)
		}
	}

	const resetPassword = async (phoneNumber: string, newPassword: string) => {
		// Implement password reset logic
		try {
			const response = await APIClient.post('/auth/reset-password', {
				phone_number: phoneNumber,
				new_password: newPassword,
			})

			setAuthState({
				isAuthenticated: true,
				isLoading: false,
				user: response.data.user || null,
			})
		} catch (error: any) {
			console.error('Error resetting password:', error)
			throw new Error(error?.response?.data?.message)
		}
	}

	// Context value
	const contextValue: AuthContextType = {
		authState,
		verifyPhone,
		signin,
		logout,
		signup,
		refreshUser,
		resetPassword,
	}

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	)
}

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
