import { useEffect } from 'react'
import * as AuthSession from 'expo-auth-session'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { Button, StyleSheet, TouchableOpacity, Image, Text } from 'react-native'
import { Platform } from 'expo-modules-core'
import Constants from 'expo-constants'
import { useTranslation } from '@/providers/locale'

WebBrowser.maybeCompleteAuthSession()

interface GoogleLoginButtonProps {
	onLoginSuccess: ({
		idToken,
		accessToken,
	}: {
		idToken: string
		accessToken: string
	}) => void
}

export default function GoogleLoginButton({
	onLoginSuccess,
}: GoogleLoginButtonProps) {
	const { t } = useTranslation()
	// const clientId = Constants.expoConfig?.extra?.oauth?.googleAndroidClientId
	const clientId =
		'895067022871-dfo8nkljsl5vcl80h0rk0ifbcdmnckb9.apps.googleusercontent.com'
	// alert('Google client id: ' + clientId)
	const [request, response, promptAsync] = Google.useAuthRequest({
		androidClientId: clientId,
		responseType: 'code',
		// redirectUri: AuthSession.makeRedirectUri({
		// 	// scheme: 'myapp',
		// 	// path: 'oauthredirect'
		// 	// native: 'com.bytesmes.frontend://input-phone',

		// })
	})

	useEffect(() => {
		if (response?.type === 'success') {
			const { access_token, id_token } = response.params
			console.log(
				'google oath response params entries: ',
				Object.entries(response.params)
			)
			onLoginSuccess({
				accessToken: access_token,
				idToken: id_token,
			}) // Send this token to backend
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
			<Text style={styles.socialButtonText}>{t('loginWithGoogle')}</Text>
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
