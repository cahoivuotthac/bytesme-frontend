import React, { useEffect } from 'react'
import { Stack, Slot } from 'expo-router'
import { useColorScheme, ActivityIndicator, View } from 'react-native'
import { useFonts } from 'expo-font'
import FontAwesome from '@expo/vector-icons/FontAwesome'

import {
	ThemeProvider,
	DarkTheme,
	DefaultTheme,
} from '@react-navigation/native'
import { AuthProvider, useAuth } from '@/providers/auth'
import { LocaleProvider } from '@/providers/locale'

export default function RootLayout() {
	const [loaded, error] = useFonts({
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
	if (!loaded) {
		return null
	}

	return (
		<LocaleProvider>
			<AuthProvider>
				{/* Important: Use Slot instead of custom navigator logic at root level */}
				<Slot />
			</AuthProvider>
		</LocaleProvider>
	)
}
