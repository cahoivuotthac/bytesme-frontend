import { useEffect, useState, useRef } from 'react'
import { useEchoInstance } from '@/providers/EchoProvider'

export function useEchoChannel(
	channelName: string,
	eventName: string,
	isPrivate = true, // Default to private channels for Laravel authentication
	callback: (data: any) => void,
	isEnabled = true // Flag to enable or disable the listener
) {
	const { echo, isConfigured } = useEchoInstance()
	const [isListening, setIsListening] = useState(false)
	const channelRef = useRef<any>(null)

	useEffect(() => {
		if (!isEnabled || !isConfigured || !echo || !channelName || !eventName) return

		try {
			console.log(
				`Attempting to subscribe to ${
					isPrivate ? 'private' : 'public'
				} channel: ${channelName}`
			)

			if (isPrivate) {
				channelRef.current = echo.private(channelName)
			} else {
				channelRef.current = echo.channel(channelName)
			}

			if (channelRef.current) {
				console.log(`🔊 Now listening to ${eventName} on ${channelName}`)
				channelRef.current.listen(eventName, (event: any) => {
					console.log(`🔔 Received notifcation on ${channelName}:`, event)
					callback(event)
				})
				setIsListening(true)
			} else {
				console.error(`❌ Failed to create channel for ${channelName}`)
			}

			// Cleanup listener when component unmounts or dependencies change
			return () => {
				try {
					if (channelRef.current) {
						console.log(
							`🔇 Stopping listener for ${eventName} on ${channelName}`
						)
						channelRef.current.stopListening(eventName)

						// Only leave if we have a valid echo instance
						if (echo) {
							// Note: The proper method name depends on the Echo implementation
							if (typeof echo.leave === 'function') {
								echo.leave(channelName)
							} else if (echo.connector && echo.connector.channels) {
								delete echo.connector.channels[channelName]
							}
						}
					}
				} catch (error) {
					console.error(`Error cleaning up Echo channel ${channelName}:`, error)
				}
			}
		} catch (error) {
			console.error(`Error setting up Echo channel ${channelName}:`, error)
		}
	}, [channelName, eventName, echo, isConfigured, isPrivate, isEnabled])

	return { isListening, channel: channelRef.current }
}
