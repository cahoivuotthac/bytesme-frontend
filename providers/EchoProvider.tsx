import React, { createContext, useContext, useEffect, useState } from 'react'
import Pusher from 'pusher-js/react-native'
import Echo from 'laravel-echo'
import { useAuth } from './auth'

// Cheat
if (typeof global.document === 'undefined') {
	// @ts-ignore
	global.document = {}
}
if (typeof global.window === 'undefined') {
	// @ts-ignore
	global.window = global
}

// Create context to store the Echo instance
const EchoContext = createContext<{
	echo: Echo<any> | null
	isConfigured: boolean
}>({
	echo: null,
	isConfigured: false,
})

export function EchoProvider({ children }: { children: React.ReactNode }) {
	const [echo, setEcho] = useState<Echo<any> | null>(null)
	const [isConfigured, setIsConfigured] = useState(false)
	const { authState } = useAuth()

	useEffect(() => {
		if (!authState.authToken) {
			console.warn('No auth token available, wait a bit more.')
			return
		}
		if (!Pusher.isReady) {
			console.warn('Pusher is not ready yet, waiting for auth token...')
			return
		}

		try {
			// Make Pusher available globally (required by Laravel Echo)
			// ;(window as any).Pusher = Pusher

			console.log('Attempting to connect to WebSocket server with config:', {
				wsHost: '127.0.0.1',
				wsPort: 8080,
				key: 'jv2d8id8cncc3h2xbsm5',
				authToken: authState.authToken,
			})

			const echoInstance = new Echo({
				broadcaster: 'reverb',
				Pusher,
				key: 'jv2d8id8cncc3h2xbsm5',
				wsHost: '127.0.0.1',
				wsPort: 8080, // Your Reverb server port
				httpHost: '127.0.0.1',
				httpPort: 8080,
				forceTLS: false,
				disableStats: true,
				enabledTransports: ['ws'],
				// cluster: 'mt1',
				// Fixed: Point to your backend server
				authEndpoint: 'http://localhost:8000/broadcasting/auth', // Laravel backend endpoint
				auth: {
					headers: {
						Accept: 'application/json',
						Authorization:
							// 'Bearer ' + (localStorage.getItem('auth_token') || ''),
							authState.authToken || '',
					},
				},
			})

			// Test connection
			if ('pusher' in echoInstance.connector) {
				echoInstance.connector.pusher.connection.bind('connected', () => {
					console.log('🎉 Successfully connected to WebSocket server!')
				})

				echoInstance.connector.pusher.connection.bind('error', (err: any) => {
					console.error('⚠️ WebSocket connection error:', err)
				})
			}

			setEcho(echoInstance)
			setIsConfigured(true)
			console.log('Echo configured successfully with direct Pusher integration')
		} catch (error) {
			console.error('Failed to configure Echo:', error)
		}

		// Cleanup function
		return () => {
			if (echo) {
				// No built-in disconnect method, but we can try to clean up
				try {
					echo.connector.pusher.disconnect()
				} catch (e) {
					console.log('Echo cleanup error:', e)
				}
			}
		}
	}, [authState.authToken])

	return (
		<EchoContext.Provider value={{ echo, isConfigured }}>
			{children}
		</EchoContext.Provider>
	)
}

export const useEchoInstance = () => useContext(EchoContext)
