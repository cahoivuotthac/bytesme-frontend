import React, { useContext } from 'react'
import {
	StyleSheet,
	View,
	Text,
	SafeAreaView,
	Dimensions,
	TouchableOpacity,
	Image,
	Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@/providers/locale'

const { width, height } = Dimensions.get('window')

export default function OrderPlacedScreen() {
	const router = useRouter()
	const { t } = useTranslation()

	// Navigate to order tracking page
	const navigateToOrderTracking = () => {
		router.push({ pathname: '/order/tracking' })
	}

	// Navigate back to home/menu
	const navigateToHome = () => {
		router.replace('/(home)/product')
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* Success content */}
			<View style={styles.contentContainer}>
				{/* Success checkmark circle */}
				<View style={styles.successCircleOuter}>
					<View style={styles.successCircleInner}>
						<Ionicons name="checkmark" size={36} color="#FFFFFF" />
					</View>
				</View>

				{/* Skillet/pan icon */}
				<View style={styles.iconContainer}>
					<Image
						source={require('@/assets/icons/checkout/skillet.png')}
						style={styles.skilletIcon}
						resizeMode="contain"
					/>
				</View>

				{/* Success texts */}
				<Text style={styles.titleText}>{t('orderCompleted')}</Text>
				<Text style={styles.messageText}>{t('orderReceivedMessage')}</Text>

				{/* Action buttons */}
				<View style={styles.buttonsContainer}>
					<TouchableOpacity
						style={styles.trackButton}
						onPress={navigateToOrderTracking}
						activeOpacity={0.8}
					>
						<Ionicons
							name="timer-outline"
							size={22}
							color="#FFFFFF"
							style={styles.buttonIcon}
						/>
						<Text style={styles.trackButtonText}>{t('trackOrder')}</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.menuButton}
						onPress={navigateToHome}
						activeOpacity={0.8}
					>
						{/* <Ionicons
							name="restaurant-outline"
							size={22}
							color="#964B00"
							style={styles.buttonIcon}
						/> */}
						<Image
							source={require('@/assets/icons/checkout/cookie-brown.png')}
							style={styles.buttonIcon}
							resizeMode="contain"
						></Image>
						<Text style={styles.menuButtonText}>{t('backToMenu')}</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	contentContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
		marginBottom: 80, // Space for bottom navigation
	},
	successCircleOuter: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: '#FFD1DC', // Light pink outer circle
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 40,
	},
	successCircleInner: {
		width: 70,
		height: 70,
		borderRadius: 35,
		backgroundColor: '#FF9EC9', // Darker pink inner circle
		justifyContent: 'center',
		alignItems: 'center',
	},
	iconContainer: {
		width: 120,
		height: 120,
		marginBottom: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},
	skilletIcon: {
		width: '100%',
		height: '100%',
		tintColor: '#C67C4E',
	},
	titleText: {
		fontFamily: 'Inter-Medium',
		fontSize: 32,
		color: '#27214D',
		marginBottom: 12,
		textAlign: 'center',
	},
	messageText: {
		fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto Condensed',
		fontSize: 18,
		color: '#27214D',
		textAlign: 'center',
		marginBottom: 48,
		lineHeight: 24,
		paddingHorizontal: 16,
	},
	buttonsContainer: {
		width: '100%',
		gap: 16,
		alignItems: 'center',
	},
	trackButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#311403', // Dark brown color
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 26,
		width: '80%',
		alignSelf: 'center',
	},
	trackButtonText: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 16,
		color: '#FFFFFF',
	},
	menuButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'transparent', // Light orange color
		alignSelf: 'center',
		width: '80%',
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 26,
	},
	menuButtonText: {
		fontFamily: 'Inter-Medium',
		fontSize: 16,
		color: '#964B00', // Brown text color
	},
	buttonIcon: {
		marginRight: 8,
	},
})
