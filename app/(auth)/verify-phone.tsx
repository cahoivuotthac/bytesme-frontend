import React from 'react'
import {
	SafeAreaView,
	View,
	ScrollView,
	// Text,
	Image,
	TouchableOpacity,
	StyleSheet,
} from 'react-native'
import {
	Provider as PaperProvider,
	Button,
	Dialog,
	Portal,
	Text,
	IconButton,
} from 'react-native-paper'
import { router } from 'expo-router'
import { useState, useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { APIClient } from '@/utils/api'
import OTPInput from '@/components/OTPInput'
import NavButton from '@/components/shared/NavButton'

export default (props: any) => {
	const phoneNumber = useLocalSearchParams().phoneNumber as string
	const [countdown, setCountdown] = useState(30)
	const [canResend, setCanResend] = useState(false)
	const [code, setCode] = useState('')
	const [isLoading, setIsLoading] = useState(false)

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

	const handleNextPage = async () => {
		setIsLoading(true)
		APIClient.post('/auth/otp/verify', {
			phone_number: phoneNumber,
			code: code,
		})
			.then((response) => {
				console.log('OTP verified successfully: ', response.data)
				router.push({
					pathname: '/(auth)/signup',
					params: {
						phoneNumber: phoneNumber,
					},
				})
			})
			.catch((error) => {
				console.error('Error verifying OTP: ', error)
				alert('Có lỗi xảy ra, vui lòng thử lại: ' + error.message)
			})
			.finally(() => setIsLoading(false))
	}

	return (
		<PaperProvider>
			<ScrollView style={styles.scrollView}>
				<Image
					source={{
						uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/5CiFLE6MMk/irayyo74_expires_30_days.png',
					}}
					resizeMode={'stretch'}
					style={styles.image4}
				/>
				<Text style={styles.text2}>{'Nhập mã OTP'}</Text>
				<Text style={styles.text3}>{'Mã 4 chữ số '}</Text>

				<OTPInput
					onCodedFilled={(code) => {
						console.log('Code filled: ' + code)
						setCode(code)
					}}
				/>

				<View
					style={{
						flex: 1,
						alignSelf: 'center',
						flexDirection: 'row',
						justifyContent: 'space-between',
						width: '80%',
					}}
				>
					<Text style={styles.resendText}>
						<Text
							style={{
								color: canResend ? '#C67C4E' : '#7C7C7C',
								opacity: canResend ? 1 : 0.8,
							}}
						>
							Gửi lại mã &nbsp;&nbsp;
						</Text>
						{countdown}
					</Text>
					<NavButton
						onPress={handleNextPage}
						direction="next"
						disabled={phoneNumber.length !== 10 || isLoading}
						size={36}
					/>
				</View>
			</ScrollView>
		</PaperProvider>
	)
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	image4: {
		width: 10,
		height: 18,
		marginBottom: 65,
		marginLeft: 25,
	},
	scrollView: {
		flex: 1,
		backgroundColor: '#F8F8F8',
	},
	text2: {
		color: '#181725',
		fontSize: 26,
		fontWeight: 'bold',
		marginBottom: 27,
		marginLeft: 25,
	},
	text3: {
		color: '#7C7C7C',
		fontSize: 16,
		fontWeight: 'bold',
		// marginBottom: 9,
		marginLeft: 24,
		width: 'auto',
	},
	resendText: {
		fontSize: 14,
		color: '#C67C4E',
		fontWeight: 'medium',
		alignItems: 'flex-start',
	},
	countdownText: {
		marginLeft: 10,
		color: '#C67C4E',
		fontSize: 14,
		opacity: 0.8,
		fontWeight: 'regular',
	},
})
