import React, { useState } from 'react'
import {
	SafeAreaView,
	View,
	ScrollView,
	Image,
	Text,
	TouchableOpacity,
	StyleSheet,
	TextInput,
	Platform,
	Dimensions,
	StatusBar,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import DishDecoration from '@/components/shared/DishDecoration'
import NavButton from '@/components/shared/NavButton'
import EyeIcon from '@/components/shared/EyeIcon'
import { APIClient } from '@/utils/api'
import { useAlert } from '@/hooks/useAlert'
import { useAuth } from '@/providers/auth'
import { useTranslation } from '@/providers/locale'
import * as Font from 'expo-font'
import {
	isEmailFormatValid,
	isPasswordFormatValid,
} from '@/utils/input-validation'

const { width, height } = Dimensions.get('window')

export default function SignupScreen() {
	const { phoneNumber } = useLocalSearchParams()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [passwordVisible, setPasswordVisible] = useState(false)
	const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const { AlertComponent, showAlert, showError, showSuccess } = useAlert()
	const [fontsLoaded] = Font.useFonts({
		'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
	})
	const { refreshUser, signup: register } = useAuth()
	const { t } = useTranslation()

	const handleSignUp = async () => {
		// Validation
		if (!email || !password || !confirmPassword) {
			showError('Vui lòng điền đầy đủ thông tin')
			return
		}

		if (password !== confirmPassword) {
			showError('Mật khẩu không khớp')
			return
		}

		// Validate email format
		if (!isEmailFormatValid(email)) {
			showError('Email không hợp lệ')
			return
		}

		if (!isPasswordFormatValid(password)) {
			showError(t('invalidPassword'))
			return
		}

		setIsLoading(true)

		try {
			await register({
				phone_number: phoneNumber,
				email,
				password,
				password_confirmation: confirmPassword,
			})

			showSuccess('Đăng ký thành công!', () => router.push('/input-address'))
		} catch (error: any) {
			console.error('Error during signup:', error)

			// Show more detailed error messages
			const errorMessage = error.message
			if (errorMessage) {
				showError(`Đăng ký thất bại: ${errorMessage}`)
			} else {
				showError(t('errorRetry'))
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* Include the AlertComponent in the render */}
			{AlertComponent}

			<StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

			{/* Header decoration */}
			<View style={styles.headerDecoration}>
				<Image
					source={require('@/assets/signin-decorations/cake-2.png')}
					style={styles.headerImage}
					resizeMode="cover"
				/>
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.contentContainer}
				bounces={false}
			>
				{/* Back button */}
				<View style={styles.backButtonContainer}>
					<NavButton
						onPress={() => router.navigate('/(auth)/input-phone')}
						direction="back"
						size={36}
						// backgroundColor="#F7F8FB"
					/>
				</View>

				{/* Heading */}
				<Text style={styles.heading}>Đăng ký</Text>
				<Text style={styles.subheading}>
					Nhập thông tin của bạn để tiếp tục
				</Text>

				{/* Registration form container with subtle shadow */}
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

					{/* Confirm Password input */}
					<View style={styles.formGroup}>
						<Text style={styles.label}>Xác nhận mật khẩu</Text>
						<View style={styles.inputContainer}>
							<TextInput
								style={styles.input}
								placeholder="••••••••"
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

				{/* Terms and Conditions */}
				<Text style={styles.termsText}>
					By continuing you agree to our{' '}
					<Text style={{ color: '#00AA00' }}>Terms of Service</Text>
					{'\n'}
					and <Text style={{ color: '#00AA00' }}>Privacy Policy</Text>.
				</Text>

				{/* Sign Up Button */}
				<TouchableOpacity
					style={styles.signupButton}
					onPress={handleSignUp}
					disabled={isLoading}
				>
					<Text style={styles.signupButtonText}>
						{isLoading ? 'Đang xử lý...' : 'Tạo tài khoản'}
					</Text>
				</TouchableOpacity>

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
	headerDecoration: {
		position: 'absolute',
		top: 0,
		right: 0,
		width: width * 0.4,
		height: height * 0.15,
		overflow: 'hidden',
		opacity: 0.8,
	},
	headerImage: {
		width: '100%',
		height: '100%',
	},
	scrollView: {
		flex: 1,
	},
	contentContainer: {
		paddingBottom: 70,
		paddingTop: 20,
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
		fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto Condensed',
		color: '#7C7C7C',
		paddingHorizontal: 25,
		marginBottom: 30,
	},
	formContainer: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		marginHorizontal: 20,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.06,
		shadowRadius: 10,
		elevation: 2,
	},
	formGroup: {
		marginBottom: 20,
	},
	label: {
		color: '#7C7C7C',
		fontSize: 16,
		fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto Condensed',
		marginBottom: 10,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: '#E2E2E2',
		paddingBottom: 10,
	},
	input: {
		flex: 1,
		fontSize: 18,
		fontFamily: 'Inter-Regular',
		fontWeight: '500',
		color: '#030303',
	},
	termsText: {
		marginTop: 30,
		marginBottom: 30,
		fontSize: 14,
		fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto Condensed',
		lineHeight: 18,
		color: '#030303',
		paddingHorizontal: 25,
		textAlign: 'center',
	},
	signupButton: {
		backgroundColor: 'rgba(251, 0, 80, 0.8)',
		borderRadius: 100,
		paddingVertical: 15,
		marginHorizontal: 25,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#FB0050',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 4,
	},
	signupButtonText: {
		color: '#FFFFFF',
		fontSize: 18,
		fontWeight: 'bold',
	},
	bottomDecoration: {
		alignSelf: 'center',
		marginTop: 40,
		opacity: 0.8,
	},
})
