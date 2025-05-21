import NavButton from '@/components/shared/NavButton'
import { Stack, usePathname } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from '@/providers/locale'
import { useMemo } from 'react'

export default function ProfileLayout() {
	const { t } = useTranslation()
	const pathname = usePathname()

	// Determine the header title based on the current route
	const headerTitle = useMemo(() => {
		if (pathname.includes('/wishlist')) {
			return t('favorites')
		} else if (pathname.includes('/cart')) {
			return t('cart')
		} else {
			return t('profile') // Default fallback
		}
	}, [pathname, t])

	const noTopNavbarPath = [
		'/profile',
		'/edit-profile',
		// '/profile/notifications',
	]
	const shouldShowTopNavbar = () => {
		return !noTopNavbarPath.some((path) => pathname.includes(path))
	}

	return (
		<View style={styles.container}>
			{/* Top navbar with dynamic title */}
			{shouldShowTopNavbar() && (
				<View style={styles.header}>
					<NavButton direction="back" size={32} />
					<Text style={styles.headerTitle}>{headerTitle}</Text>
					<View style={styles.placeholderView} />
				</View>
			)}
			<Stack
				screenOptions={{
					headerShown: false,
					animation: 'slide_from_right',
					animationDuration: 200,
					animationTypeForReplace: 'push',
				}}
			>
				<Stack.Screen name="wishlist"></Stack.Screen>
				<Stack.Screen name="cart"></Stack.Screen>
			</Stack>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#F4F4F4',
		backgroundColor: '#FFFFFF',
	},
	headerTitle: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 18,
		color: '#383838',
	},
	placeholderView: {
		width: 40,
	},
})
