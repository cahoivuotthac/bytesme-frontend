import React, { useState, useRef, useEffect } from 'react'
import {
	SafeAreaView,
	View,
	ScrollView,
	Text,
	Image,
	TouchableOpacity,
	StyleSheet,
	Platform,
	Dimensions,
	StatusBar,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import DishDecoration from '@/components/shared/DishDecoration'
import NavButton from '@/components/shared/NavButton'
import { APIClient } from '@/utils/api'
import { useAlert } from '@/hooks/useAlert'
import { useTranslation } from '@/providers/locale'
import { useAuth } from '@/providers/auth'
import OTPInputView from '@twotalltotems/react-native-otp-input'
import Button from '@/components/ui/Button'

const { width, height } = Dimensions.get('window')

const RESEND_COOLDOWN_SECONDS = 30

export default function VerifyResetOTPScreen() {
	const params = useLocalSearchParams()
	const { email } = params as { email: string }
	const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS)
	const [canResend, setCanResend] = useState(false)
	const [code, setCode] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const { verifyEmail } = useAuth()
	const { showError, showSuccess, AlertComponent } = useAlert()
	const { t } = useTranslation()
	const OTP_DIGITS_COUNT = 4

	useEffect(() => {
		let timer: NodeJS.Timeout
		if (countdown > 0) {
			timer = setInterval(() => {
				setCountdown((prev) => prev - 1)
			}, 1000)
		} else {
			setCanResend(true)
		}
		return () => clearInterval(timer)
	}, [countdown])

	const handleVerifyEmail = async () => {
		if (!code || code.length !== OTP_DIGITS_COUNT) {
			showError(t('enterOTP'))
			return
		}
		setIsLoading(true)
		try {
			await verifyEmail(email, code, 'reset_password')
			showSuccess(t('otpSuccess'), () =>
				router.push({
					pathname: '/(auth)/reset-password',
					params: { email },
				})
			)
		} catch (error: any) {
			console.error('Error verifying email:', error)
			showError(error?.response?.data?.message || t('invalidOTP'))
		} finally {
			setIsLoading(false)
		}
	}

	const handleResendOTP = async () => {
		if (!canResend) return
		setIsLoading(true)
		try {
			await APIClient.post('/auth/otp/gen', { email })
			showSuccess(t('newOTPSent'))
			setCountdown(30)
			setCanResend(false)
		} catch (error: any) {
			console.error('Error resending OTP:', error)
			showError(error?.response?.data?.message || t('errorRetry'))
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}
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
			{/* Cake-3 outside the background decoration */}
			<View style={styles.cake3Container}>
				<DishDecoration
					imageSource={require('@/assets/signin-decorations/cake-3.png')}
					size={width * 0.5}
				/>
			</View>
			{/* Spacer to prevent content overlap */}
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
				<Text style={styles.heading}>{t('typeOtpCode')}</Text>
				<Text style={styles.subheading}>
					{t('codeSentToYourEmail')
						.replace('{digits}', OTP_DIGITS_COUNT.toString())
						.replace('{mail}', email)}
				</Text>
				{/* OTP input */}
				<View style={styles.otpContainer}>
					<OTPInputView
						pinCount={OTP_DIGITS_COUNT}
						onCodeChanged={setCode}
						style={styles.otpBox}
						codeInputFieldStyle={styles.otpTextField}
						codeInputHighlightStyle={styles.otpTextFieldFocused}
						autoFocusOnLoad={false}
					/>
				</View>
				{/* Resend code and next button */}
				<View style={styles.actionContainer}>
					<TouchableOpacity
						onPress={handleResendOTP}
						disabled={!canResend || isLoading}
					>
						<Text
							style={[
								styles.resendText,
								{
									color: canResend ? '#C67C4E' : '#7C7C7C',
									opacity: canResend ? 1 : 0.8,
								},
							]}
						>
							{t('resendOtpCode')} {countdown > 0 ? `(${countdown}s)` : ''}
						</Text>
					</TouchableOpacity>
					<NavButton
						onPress={handleVerifyEmail}
						direction="next"
						disabled={code.length !== OTP_DIGITS_COUNT || isLoading}
						size={48}
					/>
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
		height: height * 0.3, // Reduced height to 25% of screen height
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
		width: '50%',
		height: '50%',
		top: height * 0.2, // Position at bottom of gradient
		alignSelf: 'center', // Center horizontally
		zIndex: 10, // Ensure it's above other elements
		backgroundColor: 'transparent', // Make background transparent
		borderColor: 'transparent',
		shadowOpacity: 0,
	},
	cake3Spacer: {
		height: 30,
		width: '100%',
		marginTop: height * 0.35,
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
		textAlign: 'left',
		lineHeight: 24,
	},
	phoneHighlight: {
		color: '#2F2D2C',
		fontWeight: 'bold',
	},
	otpContainer: {
		marginBottom: 30,
		alignItems: 'center',
	},
	otpBox: {
		width: '60%',
		height: 60,
		marginVertical: 16,
	},
	otpTextField: {
		backgroundColor: '#F5F5F5',
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#E8E8E8',
		color: '#2F2D2C',
		fontSize: 20,
		fontWeight: 'bold',
		height: 56,
	},
	otpTextFieldFocused: {
		borderColor: '#C67C4E',
		borderWidth: 2,
	},
	resendContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 30,
	},
	resendText: {
		fontSize: 14,
		color: '#7C7C7C',
	},
	resendAction: {
		fontSize: 14,
		fontWeight: '600',
		color: '#C67C4E',
	},
	resendDisabled: {
		color: '#BDBDBD',
	},
	verifyButton: {
		width: '80%',
		marginHorizontal: 'auto',
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
	verifyButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: 'bold',
	},
	actionContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '80%',
		marginHorizontal: 'auto',
	},
})
