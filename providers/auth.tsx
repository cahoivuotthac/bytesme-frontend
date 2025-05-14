import { createContext, useState, useContext, useEffect } from 'react'
import { APIClient } from '@/utils/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Define the structure of our auth state
type AuthState = {
	isLoading: boolean
	user: any | null
	authToken: string | null
	resetPasswordToken: string | null
}

// Define the shape of the context
type AuthContextType = {
	authState: AuthState
	isAuthenticated: () => boolean
	verifyPhone: (
		phoneNumber: string,
		code: string,
		intent?: 'signin/signup' | 'reset_password'
	) => Promise<{ isNewUser: boolean }>
	signin: (email: string, password: string) => Promise<void>
	logout: () => Promise<void>
	signup: (userData: any) => Promise<void>
	refreshUser: () => Promise<void>
	resetPassword: (phoneNumber: string, newPassword: string) => Promise<void>
}

// Default auth state
const defaultAuthState: AuthState = {
	isLoading: true,
	user: null,
	authToken: null,
	resetPasswordToken: null,
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component that wraps your app and makes auth object available to any child component
export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [authState, setAuthState] = useState<AuthState>(defaultAuthState)

	// Function to check if a session exists
	useEffect(() => {
		const authStateUpdateOnStartup = async () => {
			const storedAuthState = JSON.parse(
				(await AsyncStorage.getItem('authState')) || '{}'
			) as AuthState

			console.log('Stored auth state:', storedAuthState)

			// Is user authenticated?
			let isAuthenticated =
				Object.keys(storedAuthState).length > 0 || !!storedAuthState.authToken

			// Set the bearer token in axios headers
			APIClient.defaults.headers.common['Authorization'] =
				storedAuthState.authToken

			// Make request to check if token still authenticated
			let response
			try {
				response = await APIClient.get('/auth/user')
				console.log('Auth token retrieved from storage is still valid')
			} catch (error: any) {
				if (error?.response?.status === 401) {
					console.error('Token retrieved from storage have expired:', error)
				}
				isAuthenticated = false
			} finally {
				if (isAuthenticated) {
					setAuthState(storedAuthState)
				} else {
					delete APIClient.defaults.headers.common['Authorization']
					setAuthState({
						...defaultAuthState,
						isLoading: false,
					})
				}
			}
		}

		authStateUpdateOnStartup()
	}, [])

	// Login function
	const signin = async (email: string, password: string): Promise<void> => {
		let response
		try {
			response = await APIClient.post('/auth/signin', {
				email,
				password,
			})

			const { user, token } = response.data
			if (!token) {
				throw new Error('No token received from server after login')
			}
			console.log('Response.data:', response.data)

			const bearerToken = `Bearer ${token}`
			APIClient.defaults.headers.common['Authorization'] = bearerToken
			const newAuthState = {
				isLoading: false,
				user: user,
				authToken: bearerToken,
				resetPasswordToken: null,
			}
			setAuthState(newAuthState)
			await persistAuthState(newAuthState)

			console.log('Saved auth state:', await AsyncStorage.getItem('authState'))
		} catch (error: any) {
			throw new Error(error?.response?.data?.message || error.message)
		}
	}

	// Logout function
	const logout = async (): Promise<void> => {
		let response
		try {
			response = await APIClient.post('/auth/logout')
		} catch (error: any) {
			throw new Error(error?.response?.data?.message || error.message)
		} finally {
			// Clear flag and reset state whatsoever
			delete APIClient.defaults.headers.common['Authorization']
			setAuthState({
				...defaultAuthState,
				isLoading: false,
			})
			await AsyncStorage.removeItem('authState')
		}
	}

	const signup = async (userData: any) => {
		let response
		try {
			response = await APIClient.post('/auth/signup', userData)

			const { user, token } = response.data
			if (!token) {
				throw new Error('No token received from server after registration')
			}

			const bearerToken = `Bearer ${token}`
			APIClient.defaults.headers.common['Authorization'] = bearerToken
			const newAuthState = {
				isLoading: false,
				user: user,
				authToken: bearerToken,
				resetPasswordToken: null,
			}
			setAuthState(newAuthState)
			await persistAuthState(newAuthState)
		} catch (error: any) {
			console.error('Registration error: ', error)
			throw new Error(error?.response?.data?.message || error.message)
		}
	}

	const verifyPhone = async (
		phoneNumber: string,
		code: string,
		intent: 'signin/signup' | 'reset_password' = 'signin/signup'
	): Promise<{ isNewUser: boolean }> => {
		let response
		let newAuthState
		let isNewUser = true
		const defaultRequestData = {
			phone_number: phoneNumber,
			code,
		}

		try {
			if (intent === 'signin/signup') {
				response = await APIClient.post('/auth/otp/verify', defaultRequestData)

				const { user, token } = response.data
				// Is signin
				if (token) {
					isNewUser = false
					const bearerToken = `Bearer ${token}`
					APIClient.defaults.headers.common['Authorization'] = bearerToken
					newAuthState = {
						isLoading: false,
						user: user,
						authToken: bearerToken,
						resetPasswordToken: null,
					}
				} else {
					delete APIClient.defaults.headers.common['Authorization']
					newAuthState = {
						...defaultAuthState,
						isLoading: false,
					}
				}
			} else {
				response = await APIClient.post('/auth/otp/verify', {
					...defaultRequestData,
					is_password_reset: 'true',
				})

				if (!response.data.reset_token) {
					throw new Error('No reset token received from server')
				}

				newAuthState = {
					...defaultAuthState,
					isLoading: false,
					resetPasswordToken: response.data.reset_token,
				}
			}

			setAuthState(newAuthState)
			await persistAuthState(newAuthState)

			return { isNewUser }
		} catch (error: any) {
			console.error('Error verifying OTP: ', error)
			throw new Error(error?.response?.data?.message || error.message)
		}
	}

	// Refresh user data
	const refreshUser = async (): Promise<void> => {
		try {
			const response = await APIClient.get('/auth/user')

			if (response.status === 200) {
				setAuthState({
					...defaultAuthState,
					user: response.data.user,
					isLoading: false,
				})
			}
		} catch (error) {
			console.error('Error refreshing user data:', error)
		}
	}

	const resetPassword = async (phoneNumber: string, newPassword: string) => {
		try {
			if (!authState.resetPasswordToken) {
				throw new Error('No reset token available')
			}

			const response = await APIClient.post('/auth/reset-password', {
				phone_number: phoneNumber,
				new_password: newPassword,
				reset_token: authState.resetPasswordToken,
			})

			const { user, token } = response.data
			if (!token) {
				throw new Error('No token received from server after password reset')
			}
			const bearerToken = `Bearer ${token}`
			const newAuthState = {
				isLoading: false,
				user: user,
				authToken: bearerToken,
				resetPasswordToken: null,
			}
			setAuthState(newAuthState)
			await persistAuthState(newAuthState)
		} catch (error: any) {
			console.error('Error resetting password:', error)
			throw new Error(error?.response?.data?.message)
		}
	}

	const persistAuthState = async (newAuthState: AuthState) => {
		try {
			await AsyncStorage.setItem('authState', JSON.stringify(newAuthState))
		} catch (error) {
			console.error('Error persisting auth state:', error)
		}
	}

	const isAuthenticated = (): boolean => {
		return authState.authToken !== null
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
		isAuthenticated,
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
