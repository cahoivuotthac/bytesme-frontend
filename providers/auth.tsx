import { createContext, useState, useContext, useEffect } from 'react'
import { APIClient } from '@/utils/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from '@/providers/locale'
import { AxiosError } from 'axios'

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
	verifyEmail: (
		email: string,
		code: string,
		intent?: 'signin/signup' | 'reset_password'
	) => Promise<{ isNewUser: boolean }>
	signin: (email: string, password: string) => Promise<void>
	logout: () => Promise<void>
	signup: (userData: any) => Promise<void>
	refreshUser: () => Promise<void>
	resetPassword: (phoneNumber: string, newPassword: string) => Promise<void>
	finalizeGoogleSignin: ({
		accessToken,
		idToken,
		onDuplicateUser,
		onMissingPhoneNumber,
	}: {
		accessToken: string
		idToken: string
		onDuplicateUser: () => void
		onMissingPhoneNumber: () => void
	}) => Promise<void>
	finalizeFacebookSignin: () => Promise<void>
	requestOtpForEmail: (
		email: string,
		isPasswordReset: boolean,
		handlers: {
			onUserAlreadyExists?: () => any
			onRateLimitExceeded?: () => any
			onOtpSent?: () => any
			onError?: (error: any) => any
		}
	) => Promise<void>
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
	const { t } = useTranslation()

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
				console.log('Current user:', response.data)
				// Refresh-user on start
				setAuthState({
					...authState,
					user: response.data,
				})
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

	const verifyEmail = async (
		email: string,
		code: string,
		intent: 'signin/signup' | 'reset_password' = 'signin/signup'
	): Promise<{ isNewUser: boolean }> => {
		let response
		let newAuthState
		let isNewUser = true
		const defaultRequestData = {
			email: email,
			code,
		}

		try {
			if (intent === 'signin/signup') {
				response = await APIClient.post('/auth/otp/verify', defaultRequestData)

				const { user, token } = response.data
				// Is signin
				if (token) {
					alert('Has token: ' + token)
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
					is_password_reset: true,
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
			console.log('New user data:', response.data)
			if (response.status === 200) {
				const newAuthState = {
					...authState,
					user: response.data,
					isLoading: false,
				}
				setAuthState(newAuthState)
				await persistAuthState(newAuthState) // persist
			}
		} catch (error) {
			console.error('Error refreshing user data:', error)
		}
	}

	const resetPassword = async (email: string, newPassword: string) => {
		try {
			if (!authState.resetPasswordToken) {
				throw new Error('No reset token available')
			}

			const response = await APIClient.post('/auth/reset-password', {
				email,
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
			APIClient.defaults.headers.common['Authorization'] = bearerToken
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

	const finalizeGoogleSignin = async ({
		accessToken,
		idToken,
		onDuplicateUser,
		onMissingPhoneNumber,
	}: {
		accessToken: string
		idToken: string
		onDuplicateUser: () => void
		onMissingPhoneNumber: () => void
	}) => {
		try {
			// const authUrl = await getSocialSigninLink('google')
			const response = await APIClient.post('/auth/signin/google/callback', {
				access_token: accessToken,
			})

			const { user, token } = response.data
			if (!token) {
				throw new Error(
					"What the fuck is the server doing, there's no auth token after signin with google"
				)
			}

			// Log the fuck in
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
		} catch (err) {
			if (err instanceof AxiosError) {
				if (
					(err as any).response.status === 422 &&
					(err as any).response.data.code === 'user_exists'
				) {
					onDuplicateUser()
				} else if (
					(err as any).response.status === 422 &&
					(err as any).response.data.code === 'missing_phone_number'
				) {
					onMissingPhoneNumber()
				}
			}

			throw err
		}
	}

	const finalizeFacebookSignin = async () => {}

	const requestOtpForEmail = async (
		email: string,
		isPasswordReset: boolean,
		handlers: {
			onUserAlreadyExists?: () => any
			onRateLimitExceeded?: () => any
			onOtpSent?: () => any
			onError?: (error: any) => any
		}
	) => {
		try {
			await APIClient.post('/auth/otp/gen', {
				email,
				is_password_reset: isPasswordReset,
			})

			if (handlers.onOtpSent) {
				handlers.onOtpSent()
			}
		} catch (error: any) {
			if (error instanceof AxiosError) {
				const axiosError = error as AxiosError
				if (axiosError.response?.status === 429) {
					handlers.onRateLimitExceeded ? handlers.onRateLimitExceeded() : null
				} else if (axiosError.response?.status === 409) {
					handlers.onUserAlreadyExists ? handlers.onUserAlreadyExists() : null
				} else {
					handlers.onError ? handlers.onError(error) : null
				}
			} else {
				handlers.onError ? handlers.onError(error) : null
			}
		}
	}

	// Context value
	const contextValue: AuthContextType = {
		authState,
		verifyEmail,
		signin,
		logout,
		signup,
		refreshUser,
		resetPassword,
		isAuthenticated,
		finalizeGoogleSignin,
		finalizeFacebookSignin,
		requestOtpForEmail,
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
