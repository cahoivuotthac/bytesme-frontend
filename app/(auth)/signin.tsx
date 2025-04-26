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
import { router, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import DishDecoration from '@/components/shared/DishDecoration'
import NavButton from '@/components/shared/NavButton'
import EyeIcon from '@/components/shared/EyeIcon'
import { useAuth } from '@/providers/auth'
import { useAlert } from '@/hooks/useAlert'
import { useTranslation } from '@/providers/locale'

const { width, height } = Dimensions.get('window')

export default function LoginScreen() {
	const { phoneNumber } = useLocalSearchParams()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [passwordVisible, setPasswordVisible] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const { signin } = useAuth()
	const { AlertComponent, showError } = useAlert()
	const { t } = useTranslation()

	const handleSignin = async () => {
		// Validation
		if (!email || !password) {
			showError('Vui lòng điền đầy đủ thông tin')
			return
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email)) {
			showError('Email không hợp lệ')
			return
		}

		setIsLoading(true)

		try {
			await signin(email, password)
			// On success, router will automatically navigate to protected routes
			router.replace('/(home)/product')
		} catch (error: any) {
			console.error('Login error:', error)
			showError(error.message || t('errorRetry'))
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* Include the AlertComponent in the render */}
			{AlertComponent}

			<StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

			{/* Background decoration at the top - REDUCED HEIGHT */}
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

				{/* Cake images - Adjusted for better fit */}
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

			{/* Cake-3 with adjusted position */}
			<View style={styles.cake3Container}>
				<DishDecoration
					imageSource={require('@/assets/signin-decorations/cake-3.png')}
					size={width * 0.4} /* Reduced size */
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
				<Text style={styles.heading}>Đăng nhập</Text>
				<Text style={styles.subheading}>Nhập thông tin tài khoản của bạn</Text>

				{/* Login form container with subtle shadow */}
				<View style={styles.formContainer}>
					{/* Email input */}
					<View style={styles.formGroup}>
						<Text style={styles.label}>Email</Text>
						<View style={styles.inputContainer}>
							<TextInput
								style={styles.input}
								placeholder="example@email.com"
								placeholderTextColor="#999"
								keyboardType="email-address"
								autoCapitalize="none"
								value={email}
								onChangeText={setEmail}
							/>
						</View>
					</View>

					{/* Password input */}
					<View style={styles.formGroup}>
						<Text style={styles.label}>Mật khẩu</Text>
						<View style={styles.inputContainer}>
							<TextInput
								style={styles.input}
								placeholder="••••••••"
								placeholderTextColor="#999"
								secureTextEntry={!passwordVisible}
								value={password}
								onChangeText={setPassword}
							/>
							<EyeIcon
								isVisible={passwordVisible}
								onToggle={() => setPasswordVisible(!passwordVisible)}
							/>
						</View>
					</View>
				</View>

				{/* Forgot Password */}
				<TouchableOpacity
					style={styles.forgotPasswordContainer}
					onPress={() => router.push('/(auth)/forget-password')}
				>
					<Text style={styles.forgotPasswordText}>{t('forgetPassword')}</Text>
				</TouchableOpacity>

				{/* Login Button */}
				<TouchableOpacity
					style={styles.loginButton}
					onPress={handleSignin}
					disabled={isLoading}
				>
					<Text style={styles.loginButtonText}>
						{isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
					</Text>
				</TouchableOpacity>

				{/* Sign Up Option */}
				<View style={styles.signUpContainer}>
					<Text style={styles.signUpText}>
						Chưa có tài khoản?{' '}
						<Text
							style={styles.signUpLink}
							onPress={() => router.push('/(auth)/input-phone')}
						>
							Đăng ký
						</Text>
					</Text>
				</View>

				{/* Decorative dish at bottom */}
				<View style={styles.bottomDecoration}>
					<DishDecoration
						imageSource={require('@/assets/signin-decorations/cake-3.png')}
						size={80}
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
		height: height * 0.25, // Further reduced height to 25% of screen height
		zIndex: 0,
	},
	pinkOutline: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		borderBottomLeftRadius: 60, // Slightly reduced border radius
		borderBottomRightRadius: 60,
		borderWidth: 3,
		borderColor: '#EDC8C9', // Subtle pink color for the outline
		zIndex: 1,
	},
	bgGradient: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		borderBottomLeftRadius: 60, // Matching the outline radius
		borderBottomRightRadius: 60,
	},
	cake1Image: {
		position: 'absolute',
		width: '40%', // Reduced size
		height: '50%',
		top: height * 0.01,
		left: width * 0.02,
		zIndex: 2,
	},
	cake2Image: {
		position: 'absolute',
		width: '40%', // Reduced size
		height: '50%',
		top: height * 0.05, // Adjusted position
		right: width * 0.03,
		zIndex: 2,
	},
	// Cake3Container with adjusted position
	cake3Container: {
		position: 'absolute',
		width: '40%', // Reduced width
		height: '40%', // Reduced height
		top: height * 0.15, // Positioned lower on the screen
		alignSelf: 'center',
		zIndex: 10,
		backgroundColor: 'transparent',
		borderColor: 'transparent',
		shadowOpacity: 0,
	},
	cake3Spacer: {
		height: 30, // Further reduced height
		width: '100%',
		marginTop: height * 0.25, // Same as the height of the background decoration
	},
	scrollView: {
		flex: 1,
		zIndex: 1,
	},
	contentContainer: {
		paddingBottom: 30,
		paddingTop: 10, // Reduced top padding
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
		marginBottom: 15,
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
	forgotPasswordContainer: {
		alignSelf: 'flex-end',
		marginRight: 25,
		marginBottom: 30,
	},
	forgotPasswordText: {
		fontSize: 14,
		color: '#C67C4E',
		fontWeight: '600',
	},
	loginButton: {
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
	loginButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: 'bold',
	},
	signUpContainer: {
		marginTop: 30,
		alignItems: 'center',
	},
	signUpText: {
		fontSize: 14,
		color: '#2F2D2C',
	},
	signUpLink: {
		color: '#C67C4E',
		fontWeight: '600',
	},
	bottomDecoration: {
		alignItems: 'center',
		marginTop: 40,
	},
})
