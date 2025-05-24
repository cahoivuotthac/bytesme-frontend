import { useEffect } from 'react'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { Button, StyleSheet, TouchableOpacity, Image, Text } from 'react-native'
import { Platform } from 'expo-modules-core'
import Constants from 'expo-constants'

WebBrowser.maybeCompleteAuthSession()

interface GoogleLoginButtonProps {
	onLogin: (idToken: string) => void
}

export default function GoogleLoginButton({ onLogin }: GoogleLoginButtonProps) {
	// const clientId = Constants.expoConfig?.extra?.oauth?.googleAndroidClientId
	const clientId =
		'895067022871-dfo8nkljsl5vcl80h0rk0ifbcdmnckb9.apps.googleusercontent.com'
	// alert('Google client id: ' + clientId)
	const [request, response, promptAsync] = Google.useAuthRequest({
		clientId,
	})

	useEffect(() => {
		if (response?.type === 'success') {
			const { id_token } = response.params
			onLogin(id_token) // Send this token to your backend
		}
	}, [response])

	return (
		<TouchableOpacity
			style={[styles.socialButton, styles.googleButton]}
			onPress={() => promptAsync()}
		>
			<Image
				source={require('@/assets/icons/google-white.png')}
				style={styles.socialIcon}
				resizeMode="contain"
			/>
			<Text style={styles.socialButtonText}>Đăng nhập với Facebook</Text>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
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
})
