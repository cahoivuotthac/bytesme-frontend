import React, { useState } from 'react'
import {
	SafeAreaView,
	View,
	ScrollView,
	Text,
	Image,
	TouchableOpacity,
	TextInput,
	StyleSheet,
	Platform,
	Dimensions,
	StatusBar,
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import DishDecoration from '@/components/shared/DishDecoration'
import NavButton from '@/components/shared/NavButton'
import { APIClient } from '@/utils/api'
import { useAlert } from '@/hooks/useAlert'
import { useTranslation } from '@/providers/locale'

const { width, height } = Dimensions.get('window')

export default function ForgetPasswordScreen() {
	const [phoneNumber, setPhoneNumber] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const { AlertComponent, showError, showSuccess } = useAlert()
	const { t } = useTranslation()

	const handleSendOTP = async () => {
		// Validate phone number (Vietnamese phone numbers typically have 10 digits)
		if (phoneNumber.length !== 10) {
			showError(t('invalidPhone'))
			return
		}

		setIsLoading(true)

		try {
			// Request to send a password reset OTP
			await APIClient.post('/auth/otp/gen', {
				phone_number: phoneNumber,
				is_password_reset: 'true',
			})

			// Success message
			showSuccess(t('otpSent'))

			// Navigate to OTP verification page for password reset
			router.push({
				pathname: '/(auth)/verify-reset-otp',
				params: { phoneNumber },
			})
		} catch (error: any) {
			console.error('Error sending OTP:', error)
			showError(error?.response?.data?.message || t('errorRetry'))
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* Include the AlertComponent in the render */}
			{AlertComponent}

			<StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

			{/* Background decoration at the top */}
			<View style={styles.backgroundDecoration}>
				{/* Pink border outline */}
				<View style={styles.pinkOutline} />

				{/* Brown gradient background */}
				<LinearGradient
					colors={['#EDE9E0', '#C67C4E']}
					style={styles.bgGradient}
					start={{ x: 0.5, y: 0 }}
					end={{ x: 0.5, y: 1 }}
				/>

				{/* Cake images */}
				<Image
					source={require('@/assets/signin-decorations/cake-1.png')}
					style={styles.cake1Image}
					resizeMode="cover"
				/>

				<Image
					source={require('@/assets/signin-decorations/cake-2.png')}
					style={styles.cake2Image}
					resizeMode="cover"
				/>
			</View>

			{/* Cake-3 moved outside the background decoration to be a fixed element */}
			<View style={styles.cake3Container}>
				<DishDecoration
					imageSource={require('@/assets/signin-decorations/cake-3.png')}
					size={width * 0.4}
				/>
			</View>

			{/* Reduced spacer height */}
			<View style={styles.cake3Spacer} />

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.contentContainer}
				bounces={false}
			>
				{/* Back button */}
				<View style={styles.backButtonContainer}>
					<NavButton onPress={() => router.back()} direction="back" size={36} />
				</View>

				{/* Heading */}
				<Text style={styles.heading}>{t('passwordReset')}</Text>
				<Text style={styles.subheading}>{t('enterPhoneForOTP')}</Text>

				{/* Phone input field */}
				<View style={styles.inputContainer}>
					<Image
						source={require('@/assets/icons/phone-rounded.png')}
						style={styles.phoneIcon}
						resizeMode="contain"
					/>
					<TextInput
						style={styles.input}
						placeholder={t('phone')}
						placeholderTextColor="#999"
						keyboardType="phone-pad"
						value={phoneNumber}
						onChangeText={setPhoneNumber}
						maxLength={10}
					/>
				</View>

				{/* Submit Button */}
				<TouchableOpacity
					style={[styles.submitButton, isLoading && styles.disabledButton]}
					onPress={handleSendOTP}
					disabled={isLoading || phoneNumber.length !== 10}
				>
					<Text style={styles.submitButtonText}>
						{isLoading ? t('processing') : t('sendOTP')}
					</Text>
				</TouchableOpacity>

				{/* Back to login */}
				<View style={styles.backToLoginContainer}>
					<Text style={styles.backToLoginText}>
						{t('rememberPassword')}{' '}
						<Text
							style={styles.backToLoginLink}
							onPress={() => router.push('/(auth)/signin')}
						>
							{t('signIn')}
						</Text>
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	// Background decoration styling
	backgroundDecoration: {
		position: 'absolute',
		width: width,
		height: height * 0.25, // Reduced height to 25% of screen height
		zIndex: 0,
	},
	pinkOutline: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		borderBottomLeftRadius: 60,
		borderBottomRightRadius: 60,
		borderWidth: 3,
		borderColor: '#EDC8C9', // Subtle pink color for the outline
		zIndex: 1,
	},
	bgGradient: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		borderBottomLeftRadius: 60,
		borderBottomRightRadius: 60,
	},
	cake1Image: {
		position: 'absolute',
		width: '40%',
		height: '50%',
		top: height * 0.01,
		left: width * 0.02,
		zIndex: 2,
	},
	cake2Image: {
		position: 'absolute',
		width: '40%',
		height: '50%',
		top: height * 0.05,
		right: width * 0.03,
		zIndex: 2,
	},
	cake3Container: {
		position: 'absolute',
		width: '40%',
		height: '40%',
		top: height * 0.15,
		alignSelf: 'center',
		zIndex: 10,
		backgroundColor: 'transparent',
		borderColor: 'transparent',
		shadowOpacity: 0,
	},
	cake3Spacer: {
		height: 30,
		width: '100%',
		marginTop: height * 0.25,
	},
	scrollView: {
		flex: 1,
		zIndex: 1,
	},
	contentContainer: {
		paddingBottom: 30,
		paddingTop: 10,
	},
	backButtonContainer: {
		marginLeft: 20,
		marginBottom: 20,
	},
	heading: {
		fontSize: 28,
		fontWeight: 'bold',
		fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
		color: '#030303',
		marginBottom: 12,
		paddingHorizontal: 25,
	},
	subheading: {
		fontSize: 16,
		color: '#7C7C7C',
		marginBottom: 30,
		paddingHorizontal: 25,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 15,
		paddingHorizontal: 25,
		marginHorizontal: 25,
		marginBottom: 30,
		backgroundColor: '#FFF',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#DEDEDE',
		height: 58,
	},
	phoneIcon: {
		width: 26,
		height: 26,
		marginRight: 15,
		tintColor: '#09244B',
	},
	input: {
		flex: 1,
		fontFamily: 'Inter-Regular',
		fontSize: 16,
		color: '#030303',
	},
	submitButton: {
		backgroundColor: '#C67C4E',
		borderRadius: 16,
		height: 56,
		marginHorizontal: 25,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 25,
		shadowColor: '#C67C4E',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
	},
	disabledButton: {
		backgroundColor: '#E0E0E0',
		shadowOpacity: 0.1,
	},
	submitButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: 'bold',
	},
	backToLoginContainer: {
		marginTop: 30,
		alignItems: 'center',
	},
	backToLoginText: {
		fontSize: 14,
		color: '#2F2D2C',
	},
	backToLoginLink: {
		color: '#C67C4E',
		fontWeight: '600',
	},
})
