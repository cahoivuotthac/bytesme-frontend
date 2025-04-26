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
import OTPInput from '@/components/OTPInput'
import NavButton from '@/components/shared/NavButton'
import AlertDialog from '@/components/shared/AlertDialog'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width, height } = Dimensions.get('window')

export type Intent = 'signin' | 'signup' | 'reset-password'

export default () => {
	const {
		phoneNumber,
		intent,
	}: {
		phoneNumber: string
		intent: Intent
	} = useLocalSearchParams()
	const [countdown, setCountdown] = useState(30)
	const [canResend, setCanResend] = useState(false)
	const [code, setCode] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const { verifyPhone, authState } = useAuth()
	const { showError, AlertComponent } = useAlert()
	const { t } = useTranslation()

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

	const handleSendOTP = async () => {
		if (!code || code.length !== 4) {
			alert('Vui lòng nhập mã OTP')
			return
		}

		setIsLoading(true)
		try {
			await verifyPhone(phoneNumber, code)
			const hasSession = (await AsyncStorage.getItem('has_session')) === 'true'
			if (hasSession) {
				router.replace('/(home)/product')
			} else {
				router.replace({
					pathname: '/(auth)/signup',
					params: {
						phoneNumber: phoneNumber,
					},
				})
			}
		} catch (error: any) {
			console.error('Error verifying phone number: ', error)
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
				phone_number: phoneNumber,
			})

			setCountdown(30)
			setCanResend(false)
		} catch (error) {
			console.error('Error resending OTP: ', error)
			alert('Không thể gửi lại mã OTP. Vui lòng thử lại sau.')
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
					<Text style={styles.heading}>Nhập mã OTP</Text>
					<Text style={styles.subheading}>
						Mã 4 chữ số được gửi đến {phoneNumber}
					</Text>

					{/* OTP input */}
					<View style={styles.otpContainer}>
						<OTPInput
							onCodedFilled={(code) => {
								console.log('Code filled: ' + code)
								setCode(code)
							}}
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
								Gửi lại mã {countdown > 0 ? `(${countdown}s)` : ''}
							</Text>
						</TouchableOpacity>

						<NavButton
							onPress={handleSendOTP}
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
		height: height * 0.4,
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
		top: height * 0.25,
		alignSelf: 'center',
		zIndex: 10,
		backgroundColor: 'transparent',
		borderColor: 'transparent',
		shadowOpacity: 0,
	},
	cake3Spacer: {
		height: 70,
		width: '100%',
		marginTop: height * 0.4,
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
	otpContainer: {
		marginHorizontal: 25,
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
