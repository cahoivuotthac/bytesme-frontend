import React, { useRef, useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import OTPInputView from '@twotalltotems/react-native-otp-input'

type OTPInputProps = {
	onCodedFilled: (code: string) => any
	containerStyle?: Record<string, any>
	codeInputFieldStyle?: Record<string, any>
	codeInputHighlightStyle?: Record<string, any>
	autoFocusOnLoad?: boolean
}

const OTPInput = ({
	onCodedFilled,
	codeInputFieldStyle,
	codeInputHighlightStyle,
	containerStyle,
}: OTPInputProps) => {
	const otpRef = useRef(null)
	const [countdown, setCountdown] = useState(30)

	if (!containerStyle || Object.keys(containerStyle).length === 0) {
		containerStyle = styles.otpContainer
	}

	if (!codeInputFieldStyle || Object.keys(codeInputFieldStyle).length === 0) {
		codeInputFieldStyle = styles.underlineStyleBase
	}

	if (
		!codeInputHighlightStyle ||
		Object.keys(codeInputHighlightStyle).length === 0
	) {
		codeInputHighlightStyle = styles.underlineStyleHighLighted
	}

	return (
		<View style={styles.container}>
			{/* <Text style={styles.title}>Enter OTP</Text> */}
			<OTPInputView
				style={styles.otpContainer}
				pinCount={4}
				autoFocusOnLoad
				codeInputFieldStyle={styles.underlineStyleBase}
				codeInputHighlightStyle={styles.underlineStyleHighLighted}
				onCodeFilled={onCodedFilled}
			/>
		</View>
	)
}

export default OTPInput

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		paddingTop: 60,
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: '#002B5B',
		marginBottom: 20,
	},
	otpContainer: {
		width: '80%',
		height: 100,
	},
	underlineStyleBase: {
		width: 40,
		height: 45,
		borderBottomWidth: 2,
		borderColor: '#7C7C7C',
		borderRadius: 4,
		fontSize: 22,
		color: 'black',
	},
	underlineStyleHighLighted: {
		borderColor: '#FB0050',
	},
	// resendRow: {
	// 	flexDirection: 'row',
	// 	justifyContent: 'space-between',
	// },
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
