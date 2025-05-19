import { useEffect, useState, useRef } from 'react'
import { useEchoInstance } from '@/providers/EchoProvider'

export function useEchoChannel(
	channelName: string,
	eventName: string,
	isPrivate = true, // Default to private channels for Laravel authentication
	callback: (data: any) => void
) {
	const { echo, isConfigured } = useEchoInstance()
	const [isListening, setIsListening] = useState(false)
	const channelRef = useRef<any>(null)

	useEffect(() => {
		if (!isConfigured || !echo || !channelName || !eventName) return

		try {
			// Create the channel - ensure proper format
			let channel

			console.log(
				`Attempting to subscribe to ${
					isPrivate ? 'private' : 'public'
				} channel: ${channelName}`
			)

			if (isPrivate) {
				channel = echo.private(channelName)
			} else {
				channel = echo.channel(channelName)
			}

			if (channel) {
				channelRef.current = channel
				console.log(`🔊 Now listening to ${eventName} on ${channelName}`)
				setIsListening(true)
			} else {
				console.error(`❌ Failed to create channel for ${channelName}`)
			}

			channelRef.current.listen(eventName, (event: any) => {
				console.log('Received test event on public channel:', event)
				console.log(`🔔 Received notifcation on ${channelName}:`, event)
				callback(event)
			})

			// Cleanup listener when component unmounts or dependencies change
			return () => {
				try {
					if (channelRef.current) {
						console.log(
							`🔇 Stopping listener for ${eventName} on ${channelName}`
						)
						channel.stopListening(eventName)

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
	}, [channelName, eventName, echo, isConfigured, isPrivate])

	return { isListening }
}
