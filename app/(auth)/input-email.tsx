import React, { useState } from 'react'
import {
	SafeAreaView,
	View,
	ScrollView,
	Text,
	Image,
	TextInput,
	StyleSheet,
	ActivityIndicator,
	Platform,
	Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { APIClient } from '@/utils/api'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from '@/providers/locale'
import { useAuth } from '@/providers/auth'
import { useAlert } from '@/hooks/useAlert'
import { isEmailFormatValid } from '@/utils/input-validation'
import { AxiosError } from 'axios'
import DishDecoration from '@/components/shared/DishDecoration'
import NavButton from '@/components/shared/NavButton'
import GoogleLoginButton from '@/components/ui/GoogleLoginButton'
import FacebookLoginButton from '@/components/ui/FacebookLoginButton'

const { width, height } = Dimensions.get('window')

export default function InputEmailScreen() {
	const [email, setEmail] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const { t } = useTranslation()
	const { finalizeGoogleSignin } = useAuth()
	const { showError } = useAlert()
	const { AlertComponent, showInfo } = useAlert()
	const { requestOtpForEmail } = useAuth()

	const onGoogleLoginSuccess = async ({
		accessToken,
		idToken,
	}: {
		accessToken: string
		idToken: string
	}) => {
		const onDuplicateUser = () => {
			// Handle duplicate user case
			showError(t('userAlreadyExists'))
		}

		const onMissingPhoneNumber = () => {
			// Handle missing phone number case
			showError(t('socialMissingPhoneNumber'))
		}

		try {
			await finalizeGoogleSignin({
				idToken,
				accessToken,
				onDuplicateUser,
				onMissingPhoneNumber,
			})
			console.log('Made request to back-end to log user in with google')
		} catch (err) {
			console.error('Error at onGoogleLoginSuccess:', err)
			showError(t('socialSigninError'))
		}
	}

	const onFacebookLoginSuccess = async (accessToken: string) => {
		// Implement Facebook login
		// alert('Facebook login not implemented yet')
		alert('Access token: ' + accessToken)
	}

	const handleNextPage = async () => {
		// Validate phone number (Vietnamese phone numbers typically have 10 digits)
		if (!isEmailFormatValid(email)) {
			showInfo(t('pleaseTypeValidEmail'))
			return
		}

		setIsLoading(true)

		try {
			// Request verification code
			console.log('Requesting OTP for email:', email)
			await requestOtpForEmail(email, false, {
				onOtpSent: () => {
					console.log('OTP sent successfully')

					// Navigate to verification page
					router.push({
						pathname: '/(auth)/verify-email',
						params: { email },
					})
				},
				onUserAlreadyExists: () => {
					// Navigate to signin page
					router.push({
						pathname: '/(auth)/signin',
						params: { email },
					})
				},
				onRateLimitExceeded: () => {
					// Handle rate limit exceeded
					showInfo(t('pleaseWaitBeforeRequetingEmailVerification'))
					return
				},
				onError: (error) => {
					showError('errorSendingOtp')
					console.log('Error sending OTP:', error)
				},
			})
		} finally {
			setIsLoading(false)
		}
	}

	// const handleSocialLogin = () => {
	// 	// Implement Facebook login
	// 	alert('Facebook login not implemented yet')
	// }

	const handlePasswordSignin = () => {
		// Navigate to password login screen
		console.log('Navigating to password login screen')
		router.push({
			pathname: '/(auth)/signin',
		})
	}

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}

			<View style={styles.backgroundDecoration} pointerEvents="none">
				{/* Pink border outline */}
				<View style={styles.pinkOutline} pointerEvents="none" />

				{/* Brown gradient background */}
				<LinearGradient
					colors={['#EDE9E0', '#C67C4E']}
					style={styles.bgGradient}
					start={{ x: 0.5, y: 0 }}
					end={{ x: 0.5, y: 1 }}
					pointerEvents="none" // Required for non-ui-block
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
				<View style={styles.cake3Container} pointerEvents="none">
					<DishDecoration
						imageSource={require('@/assets/signin-decorations/cake-3.png')}
						size={width * 0.5}
					/>
				</View>
			</View>

			{/* Add an empty View as a spacer to prevent content from going under cake-3 */}
			<View style={styles.cake3Spacer} />

			<ScrollView
				style={styles.scrollView}
				// contentContainerStyle={styles.contentContainer}
				// bounces={false} // Prevent bouncing to avoid overlap
			>
				{/* Heading */}
				<Text style={styles.heading}>{t('enterYourEmail')}</Text>
				{/* Phone input field */}
				<View style={styles.inputContainer}>
					<Image
						source={require('@/assets/icons/mail-bold.png')}
						style={styles.mailIcon}
						resizeMode="contain"
					/>
					<TextInput
						style={styles.input}
						placeholder={t('emailPlaceholder')}
						placeholderTextColor="#999"
						keyboardType="email-address"
						value={email}
						onChangeText={setEmail}
						// maxLength={10}
						// blurOnSubmit={false}
						returnKeyType="done"
						// autoFocus
					/>
					<NavButton
						onPress={handleNextPage}
						direction="next"
						disabled={email.length < 1 || isLoading}
						size={36}
					/>
				</View>

				{/* Optional divider line */}
				{/* <View style={styles.divider} /> */}

				{/* Signing with password (obvious now, obsolete) */}
				{/* <TouchableOpacity
					style={styles.passwordLoginButton}
					onPress={handlePasswordSignin}
				>
					<Text style={styles.passwordLoginText}>
						{t('signinWithPassword')}
					</Text>
				</TouchableOpacity> */}

				{/*  --- Or --- divider */}
				<View style={styles.orContainer}>
					<View style={styles.orDivider} />
					<Text style={styles.orText}>Hoặc</Text>
					<View style={styles.orDivider} />
				</View>

				{/* Google/ Facebook login section */}
				{isLoading ? (
					<ActivityIndicator size="large" color="#C67C4E" />
				) : (
					<>
						<GoogleLoginButton onLoginSuccess={onGoogleLoginSuccess} />
						<FacebookLoginButton onLogin={onFacebookLoginSuccess} />
					</>
				)}
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
		height: height * 0.3, // 40% of screen height
		zIndex: 0,
	},
	pinkOutline: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		borderBottomLeftRadius: 80,
		borderBottomRightRadius: 80,
		borderWidth: 3,
		borderColor: '#EDC8C9', // Subtle pink color for the outline
		zIndex: 1,
	},
	bgGradient: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		borderBottomLeftRadius: 80,
		borderBottomRightRadius: 80,
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
	// Move cake3Container outside the backgroundDecoration
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
	// Add spacer to prevent content from overlapping with cake-3
	cake3Spacer: {
		height: 70, // Half of the cake3 height
		width: '100%',
		marginTop: height * 0.4, // Same as the height of the background decoration
	},
	scrollView: {
		flex: 1,
		zIndex: 1,
	},
	contentContainer: {
		paddingBottom: 50,
		paddingTop: 80, // Add padding to create space below the cake-3
	},
	heading: {
		fontSize: 26,
		fontWeight: 'bold',
		fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
		color: '#030303',
		marginBottom: 30,
		paddingHorizontal: 25,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 15,
		paddingHorizontal: 25,
		marginHorizontal: 25,
		backgroundColor: '#FFF',
		borderRadius: 14,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.05,
		shadowRadius: 3.84,
		elevation: 2,
		marginBottom: 20,
	},
	mailIcon: {
		width: 26,
		height: 26,
		marginRight: 15,
		tintColor: '##09244B',
	},
	input: {
		flex: 1,
		fontFamily: 'Inter-Regular',
		fontSize: 16,
		color: '#030303',
		marginRight: 10,
	},
	divider: {
		height: 1,
		backgroundColor: '#E2E2E2',
		marginHorizontal: 25,
		marginVertical: 20,
	},
	passwordLoginButton: {
		alignSelf: 'flex-end',
		marginRight: 25,
		marginBottom: 20,
	},
	passwordLoginText: {
		color: '#C67C4E',
		fontSize: 16,
		marginRight: 25,
		fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto Condensed',
	},
	orContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 25,
		marginVertical: 20,
	},
	orDivider: {
		flex: 1,
		height: 1,
		backgroundColor: '#E2E2E2',
	},
	orText: {
		color: '#828282',
		fontSize: 14,
		fontWeight: 'bold',
		paddingHorizontal: 15,
		fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto Condensed',
	},
	socialButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 15,
		marginHorizontal: 25,
		borderRadius: 30,
		marginBottom: 15,
	},
	googleButton: {
		backgroundColor: '#EB4747',
	},
	facebookButton: {
		backgroundColor: '#4A66AC',
	},
	socialIcon: {
		width: 24,
		height: 24,
		marginRight: 15,
	},
	socialButtonText: {
		color: '#FFFFFF',
		fontSize: 18,
		fontWeight: 'bold',
		fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
	},
	backButtonContainer: {
		position: 'absolute',
		top: 20,
		left: 20,
		zIndex: 10,
	},
})
