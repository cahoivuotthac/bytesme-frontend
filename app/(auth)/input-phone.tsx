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
	ActivityIndicator,
	Platform,
	Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { APIClient } from '@/utils/api'
import { LinearGradient } from 'expo-linear-gradient'
import DishDecoration from '@/components/shared/DishDecoration'
import NavButton from '@/components/shared/NavButton'

const { width, height } = Dimensions.get('window')

export default function InputPhoneScreen() {
	const [phoneNumber, setPhoneNumber] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const handleNextPage = async () => {
		// Validate phone number (Vietnamese phone numbers typically have 10 digits)
		if (phoneNumber.length !== 10) {
			alert('Vui lòng nhập số điện thoại hợp lệ')
			return
		}

		setIsLoading(true)

		try {
			// Send OTP code
			const response = await APIClient.post('/auth/otp/gen', {
				phone_number: phoneNumber,
			})

			console.log('OTP sent successfully:', response.data)

			// Navigate to verification page
			router.push({
				pathname: '/(auth)/verify-phone',
				params: { phoneNumber },
			})
		} catch (error) {
			console.error('Error sending OTP:', error)
			alert('Có lỗi xảy ra, vui lòng thử lại')
		} finally {
			setIsLoading(false)
		}
	}

	const handleGoogleLogin = () => {
		// Implement Google login
		alert('Google login not implemented yet')
	}

	const handleFacebookLogin = () => {
		// Implement Facebook login
		alert('Facebook login not implemented yet')
	}

	const handlePasswordLogin = () => {
		// Navigate to password login screen
		alert('Password login not implemented yet')
	}

	return (
		<SafeAreaView style={styles.container}>
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
					size={width * 0.5}
				/>
			</View>

			{/* Add an empty View as a spacer to prevent content from going under cake-3 */}
			<View style={styles.cake3Spacer} />

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.contentContainer}
				bounces={false} // Prevent bouncing to avoid overlap
			>
				{/* Back button (uncomment if needed) */}
				{/* <View style={styles.backButtonContainer}>
					<BackIcon onPress={() => router.back()} />
				</View> */}
				{/* Heading */}
				<Text style={styles.heading}>Nhập số điện thoại</Text>
				{/* Phone input field */}
				<View style={styles.inputContainer}>
					<Image
						source={require('@/assets/icons/phone-rounded.png')}
						style={styles.phoneIcon}
						resizeMode="contain"
					/>
					<TextInput
						style={styles.input}
						placeholder="Số điện thoại"
						placeholderTextColor="#999"
						keyboardType="phone-pad"
						value={phoneNumber}
						onChangeText={setPhoneNumber}
						maxLength={10}
					/>
					<NavButton
						onPress={handleNextPage}
						direction="next"
						disabled={phoneNumber.length !== 10 || isLoading}
						size={36}
					/>
				</View>

				{/* Optional divider line */}
				{/* <View style={styles.divider} /> */}

				{/* Login with password */}
				<TouchableOpacity
					style={styles.passwordLoginButton}
					onPress={handlePasswordLogin}
				>
					<Text style={styles.passwordLoginText}>Đăng nhập bằng mật khẩu</Text>
				</TouchableOpacity>

				{/* Or divider */}
				<View style={styles.orContainer}>
					<View style={styles.orDivider} />
					<Text style={styles.orText}>Hoặc</Text>
					<View style={styles.orDivider} />
				</View>

				{/* Google login button */}
				<TouchableOpacity
					style={[styles.socialButton, styles.googleButton]}
					onPress={handleGoogleLogin}
				>
					<Image
						source={require('@/assets/icons/google-white.png')}
						style={styles.socialIcon}
						resizeMode="contain"
					/>
					<Text style={styles.socialButtonText}>Đăng nhập với Google</Text>
				</TouchableOpacity>
				{/* Facebook login button */}
				<TouchableOpacity
					style={[styles.socialButton, styles.facebookButton]}
					onPress={handleFacebookLogin}
				>
					<Image
						source={require('@/assets/icons/facebook-white.png')}
						style={styles.socialIcon}
						resizeMode="contain"
					/>
					<Text style={styles.socialButtonText}>Đăng nhập với Facebook</Text>
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
		height: height * 0.4, // 40% of screen height
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
		top: height * 0.25, // Position at bottom of gradient
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
	phoneIcon: {
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
