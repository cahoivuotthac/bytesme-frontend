import React from 'react'
import {
	SafeAreaView,
	View,
	ScrollView,
	Image,
	TouchableOpacity,
	StyleSheet,
	Platform,
	Dimensions,
} from 'react-native'
import { Provider as PaperProvider, Text } from 'react-native-paper'
import { router } from 'expo-router'
import { useState, useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { APIClient } from '@/utils/api'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/providers/auth'
import { useAlert } from '@/hooks/useAlert'
import { useTranslation } from '@/providers/locale'
import DishDecoration from '@/components/shared/DishDecoration'
import OTPInputView from '@twotalltotems/react-native-otp-input'
import NavButton from '@/components/shared/NavButton'
import { isEmailFormatValid } from '@/utils/input-validation'

const { width, height } = Dimensions.get('window')

export default () => {
	const {
		email,
	}: {
		email: string
	} = useLocalSearchParams()
	const [countdown, setCountdown] = useState(30)
	const [canResend, setCanResend] = useState(false)
	const [code, setCode] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const { verifyEmail, authState } = useAuth()
	const { showError, AlertComponent } = useAlert()
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

		if (!isEmailFormatValid(email)) {
			showError(t('invalidEmail'))
			return
		}

		setIsLoading(true)
		try {
			await verifyEmail(email, code)
			console.log('Auth state after verify email:', authState)
			router.replace({
				pathname: '/(auth)/signup',
				params: { email },
			})
		} catch (error: any) {
			console.error('Error verifying email: ', error)
			showError(error.message || t('errorRetry'))
		} finally {
			setIsLoading(false)
		}
	}

	const handleResendOTP = async () => {
		if (!canResend) return

		setIsLoading(true)
		try {
			await APIClient.post('/auth/otp/gen', {
				email,
			})

			setCountdown(30)
			setCanResend(false)
		} catch (error) {
			console.error('Error resending OTP: ', error)
			showError(t('errorResendingOtp'))
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<PaperProvider>
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
						<NavButton
							onPress={() => {
								router.back()
							}}
							direction="back"
							size={36}
						/>
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
							disabled={code.length !== 4 || isLoading}
							size={48}
						/>
					</View>
				</ScrollView>
			</SafeAreaView>
		</PaperProvider>
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
		height: height * 0.3,
		zIndex: 0,
	},
	pinkOutline: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		borderBottomLeftRadius: 80,
		borderBottomRightRadius: 80,
		borderWidth: 3,
		borderColor: '#EDC8C9',
		zIndex: 1,
	},
	bgGradient: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		borderBottomLeftRadius: 80,
		borderBottomRightRadius: 80,
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

	cake1Image: {
		position: 'absolute',
		width: '50%',
		height: '50%',
		top: height * 0.01,
		left: width * 0.02,
		zIndex: 2,
	},
	cake2Image: {
		position: 'absolute',
		width: '50%',
		height: '50%',
		top: height * 0.1,
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
		paddingBottom: 50,
		paddingTop: 80,
	},
	backButtonContainer: {
		marginLeft: 25,
		marginBottom: 20,
	},
	heading: {
		fontSize: 26,
		fontWeight: 'bold',
		fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
		color: '#030303',
		marginBottom: 15,
		paddingHorizontal: 25,
	},
	subheading: {
		fontSize: 16,
		color: '#7C7C7C',
		paddingHorizontal: 25,
		fontFamily: 'Inter-Regular',
		marginBottom: 30,
	},
	actionContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 25,
		marginTop: 20,
	},
	resendText: {
		fontSize: 16,
		fontWeight: '500',
		fontFamily: 'Roboto Condensed',
	},
})
