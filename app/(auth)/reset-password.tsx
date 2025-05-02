import React, { useEffect, useState } from 'react'
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
import { router, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import DishDecoration from '@/components/shared/DishDecoration'
import NavButton from '@/components/shared/NavButton'
import EyeIcon from '@/components/shared/EyeIcon'
import { APIClient } from '@/utils/api'
import { useAlert } from '@/hooks/useAlert'
import { useTranslation } from '@/providers/locale'
import { useAuth } from '@/providers/auth'

const { width, height } = Dimensions.get('window')

export default function ResetPasswordScreen() {
	let { phoneNumber } = useLocalSearchParams()
	if (Array.isArray(phoneNumber) && phoneNumber.length > 0) {
		phoneNumber = phoneNumber[0]
	}

	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [passwordVisible, setPasswordVisible] = useState(false)
	const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isReadyToNavigate, setIsReadyToNavigate] = useState(false)

	const { AlertComponent, showError, showSuccess } = useAlert()
	const { t } = useTranslation()
	const { resetPassword, isAuthenticated } = useAuth()

	useEffect(() => {
		if (!isAuthenticated() || !isReadyToNavigate) return
		console.log('isAuthenticated state: ', isAuthenticated())
		router.replace('/(home)/product')
	}, [isReadyToNavigate])

	// Validate password strength
	const isValidPassword = (password: string) => {
		// Minimum 8 characters, at least 1 letter and 1 number
		const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
		return regex.test(password)
	}

	const handleResetPassword = async () => {
		// Validation
		if (!newPassword || !confirmPassword) {
			showError(t('enterAllInfo'))
			return
		}

		// Check password strength
		if (!isValidPassword(newPassword)) {
			showError(t('invalidPassword'))
			return
		}

		// Check passwords match
		if (newPassword !== confirmPassword) {
			showError(t('passwordsDontMatch'))
			return
		}

		setIsLoading(true)

		try {
			await resetPassword(phoneNumber as string, newPassword)

			// Show success message
			showSuccess(t('resetSuccess'), () => setIsReadyToNavigate(true))
		} catch (error: any) {
			console.error('Error resetting password:', error)
			showError(error.messag || t('errorRetry'))
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
				<Text style={styles.subheading}>{t('createNewPassword')}</Text>

				{/* Password form container */}
				<View style={styles.formContainer}>
					{/* Password input */}
					<View style={styles.formGroup}>
						<Text style={styles.label}>{t('newPassword')}</Text>
						<View style={styles.inputContainer}>
							<TextInput
								style={styles.input}
								placeholder={t('passwordPlaceholder')}
								placeholderTextColor="#999"
								secureTextEntry={!passwordVisible}
								value={newPassword}
								onChangeText={setNewPassword}
							/>
							<EyeIcon
								isVisible={passwordVisible}
								onToggle={() => setPasswordVisible(!passwordVisible)}
							/>
						</View>
					</View>

					{/* Confirm Password input */}
					<View style={styles.formGroup}>
						<Text style={styles.label}>{t('confirmPassword')}</Text>
						<View style={styles.inputContainer}>
							<TextInput
								style={styles.input}
								placeholder={t('passwordPlaceholder')}
								placeholderTextColor="#999"
								secureTextEntry={!confirmPasswordVisible}
								value={confirmPassword}
								onChangeText={setConfirmPassword}
							/>
							<EyeIcon
								isVisible={confirmPasswordVisible}
								onToggle={() =>
									setConfirmPasswordVisible(!confirmPasswordVisible)
								}
							/>
						</View>
					</View>
				</View>

				{/* Password hint */}
				<Text style={styles.passwordHint}>{t('passwordRequirements')}</Text>

				{/* Reset Button */}
				<TouchableOpacity
					style={[styles.resetButton, isLoading && styles.disabledButton]}
					onPress={handleResetPassword}
					disabled={isLoading}
				>
					<Text style={styles.resetButtonText}>
						{isLoading ? t('processing') : t('resetPassword')}
					</Text>
				</TouchableOpacity>
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
	formContainer: {
		paddingHorizontal: 25,
		marginBottom: 10,
		backgroundColor: '#FFFFFF',
	},
	formGroup: {
		marginBottom: 20,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#2F2D2C',
		marginBottom: 8,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#DEDEDE',
		borderRadius: 14,
		paddingHorizontal: 15,
		height: 58,
		backgroundColor: '#FFFFFF',
	},
	input: {
		flex: 1,
		fontSize: 14,
		color: '#2F2D2C',
		fontFamily: 'Inter-Regular',
	},
	passwordHint: {
		fontSize: 12,
		color: '#7C7C7C',
		marginBottom: 30,
		paddingHorizontal: 25,
		fontStyle: 'italic',
	},
	resetButton: {
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
	resetButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: 'bold',
	},
})
