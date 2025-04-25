import FontAwesome from '@expo/vector-icons/FontAwesome'
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack, Redirect } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import 'react-native-reanimated'
import { ActivityIndicator, View } from 'react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { LocaleProvider } from '@/providers/i18n'

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from 'expo-router'

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: '(auth)',
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
	const [loaded, error] = useFonts({
		SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
		'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
		'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
		'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
		'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
		...FontAwesome.font,
	})

	// Expo Router uses Error Boundaries to catch errors in the navigation tree.
	useEffect(() => {
		if (error) throw error
	}, [error])

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync()
		}
	}, [loaded])

	if (!loaded) {
		return null
	}

	return (
		<LocaleProvider>
			<AuthProvider>
				<RootLayoutNav />
			</AuthProvider>
		</LocaleProvider>
	)
}

function RootLayoutNav() {
	const colorScheme = useColorScheme()
	const { authState } = useAuth()
	const { isLoading, isAuthenticated } = authState

	// Show a loading indicator while checking authentication status
	if (isLoading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" color="#0000ff" />
			</View>
		)
	}

	return (
		<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
			<Stack>
				{isAuthenticated ? (
					<></>
				) : (
					<>
						<Stack.Screen name="(auth)" options={{ headerShown: false }} />
						{/* Redirect to sign in if not on an auth screen */}
						{/* <Stack.Screen
							name="(tabs)"
							redirect={true}
							options={{
								headerShown: false,
							}} */}
						{/* /> */}
					</>
				)}
			</Stack>
		</ThemeProvider>
	)
}
