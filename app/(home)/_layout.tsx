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
import BottomBar from '@/components/shared/BottomBar'
import { Dimensions } from 'react-native'

const { width, height } = Dimensions.get('window')

/**
 * Layout for all authenticated screens in the app
 * Includes bottom navigation and handles authentication state
 */
export default function HomeLayout() {
	const { authState, isAuthenticated } = useAuth()
	const pathname = usePathname()

	// Show loading screen while checking auth state
	if (authState.isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#C67C4E" />
			</View>
		)
	}

	// Redirect if not authenticated
	if (!isAuthenticated()) {
		return <Redirect href="/(auth)/input-phone" />
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
