import React, { useEffect } from 'react'
import { Stack, usePathname, useSegments, router, Redirect } from 'expo-router'
import {
	View,
	StyleSheet,
	Platform,
	StatusBar,
	ActivityIndicator,
} from 'react-native'
import { useAuth } from '@/providers/auth'
import { useBottomBarVisibility } from '@/providers/BottomBarVisibilityProvider'
import BottomBar from '@/components/shared/BottomBar'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'

function handleRegistrationError(errorMessage: string) {
	alert(errorMessage)
	throw new Error(errorMessage)
}

async function registerForPushNotificationsAsync() {
	if (Platform.OS === 'android') {
		Notifications.setNotificationChannelAsync('default', {
			name: 'default',
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: '#FF231F7C',
		})
	}

	const { status: existingStatus } = await Notifications.getPermissionsAsync()
	let finalStatus = existingStatus
	if (existingStatus !== 'granted') {
		const { status } = await Notifications.requestPermissionsAsync()
		finalStatus = status
	}
	if (finalStatus !== 'granted') {
		handleRegistrationError(
			'Permission not granted to get push token for push notification!'
		)
		return
	}
	const projectId =
		Constants?.expoConfig?.extra?.eas?.projectId ??
		Constants?.easConfig?.projectId
	if (!projectId) {
		handleRegistrationError('Project ID not found')
	}
	try {
		const pushTokenString = (
			await Notifications.getExpoPushTokenAsync({
				projectId,
			})
		).data
		console.log(pushTokenString)
		return pushTokenString
	} catch (e: unknown) {
		handleRegistrationError(`${e}`)
	}
}

/**
 * Layout for all authenticated screens in the app
 * Includes bottom navigation and handles authentication state
 */
export default function HomeLayout() {
	const { authState, isAuthenticated } = useAuth()
	const pathname = usePathname()
	const { isVisible } = useBottomBarVisibility()

	// Show loading screen while checking auth state
	if (authState.isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#C67C4E" />
			</View>
		)
	}

	// Register for push notifications
	// useEffect(() => {
	// 	if (authState.isLoading || !isAuthenticated()) {
	// 		return
	// 	}

	// 	registerForPushNotificationsAsync()
	// 		.then(async (pushToken: string | undefined) => {
	// 			console.log('Push notification token registered:', pushToken)

	// 			// Send the push token to the server
	// 			if (pushToken) {
	// 				// TODO: Implement sending pushToken to your backend here
	// 			}
	// 		})
	// 		.catch((error) => {
	// 			console.error('Error registering for push notifications:', error)
	// 		})
	// // Add isAuthenticated to dependencies to ensure effect runs when auth changes
	// }, [authState])

	// Redirect if not authenticated
	if (!isAuthenticated()) {
		return <Redirect href="/(auth)/input-email" />
	}

	// Determine if we should show the bottom bar on this screen
	const shouldShowBottomBar = () => {
		const noBottomBarPaths = [
			'/checkout',
			'/payment',
			'/order/tracking',
			'/product/details',
		]
		return !noBottomBarPaths.some((path) => pathname.includes(path))
	}

	// Calculate bottom padding for screens with bottom bar
	const getContentStyle = () => {
		return shouldShowBottomBar()
			? { paddingBottom: Platform.OS === 'ios' ? 90 : 70 }
			: {}
	}

	return (
		<View style={styles.container}>
			<StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

			<Stack
				screenOptions={{
					headerShown: false,
					// Remove the bottom padding so content extends under the bottom bar
					contentStyle: {
						backgroundColor: '#FFFFFF',
					},
					animation: 'slide_from_right',
					animationDuration: 200,
					animationTypeForReplace: 'push',
				}}
			>
				{/* Main app screens */}
				<Stack.Screen name="product/index" />
				<Stack.Screen name="product/[id]" />
				<Stack.Screen name="product/categories/index" />
				<Stack.Screen name="product/categories/[categoryId]" />
				<Stack.Screen name="cart/index" />
				<Stack.Screen name="order/checkout" />
				<Stack.Screen name="order/voucher" />
				<Stack.Screen name="order/index" />
				<Stack.Screen name="order/[id]" />
				<Stack.Screen name="order/tracking/[id]" />
				<Stack.Screen name="order/success" />
				<Stack.Screen name="profile/index" />
				<Stack.Screen name="profile/edit" />
				<Stack.Screen name="profile/addresses/index" />
				<Stack.Screen name="profile/addresses/add" />
				<Stack.Screen name="profile/addresses/[id]" />
				<Stack.Screen name="profile/settings" />
				<Stack.Screen name="notifications/index" />
				<Stack.Screen name="notifications/[id]" />
			</Stack>

			{/* Render BottomBar conditionally based on current screen */}
			{shouldShowBottomBar() && (
				<>
					<View style={styles.spacerStyle} />
					<BottomBar style={styles.bottomBarStyle} />
				</>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
	},
	bottomBarStyle: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		zIndex: 100,
		width: '100%',
	},
	spacerStyle: {
		// height: Platform.OS === 'ios' ? 5 : 3,
		// height: height * 0.05,
		backgroundColor: '#000000',
		width: '100%',
		position: 'absolute',
		// bottom: Platform.OS === 'ios' ? 90 : 70,
		zIndex: 99,
	},
})
