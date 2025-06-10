import React, { useEffect } from 'react'
import { Slot } from 'expo-router'
import { useFonts } from 'expo-font'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { AuthProvider } from '@/providers/auth'
import { LocaleProvider } from '@/providers/locale'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { EchoProvider } from '@/providers/EchoProvider'
import { BottomBarControlProvider } from '@/providers/BottomBarControlProvider'

export default function RootLayout() {
	const [fontsLoaded, error] = useFonts({
		SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
		'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
		'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
		'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
		'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
		...FontAwesome.font,
	})

	// Handle font loading error
	useEffect(() => {
		if (error) throw error
	}, [error])

	// Wait for fonts to load
	if (!fontsLoaded) {
		return null
	}

	return (
		<SafeAreaProvider>
			<LocaleProvider>
				<AuthProvider>
					<EchoProvider>
						<BottomBarControlProvider>
							<Slot />
						</BottomBarControlProvider>
					</EchoProvider>
				</AuthProvider>
			</LocaleProvider>
		</SafeAreaProvider>
	)
}
