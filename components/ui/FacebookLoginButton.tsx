import * as React from 'react'
import * as AuthSession from 'expo-auth-session'
import { Button, TouchableOpacity, Image, Text, StyleSheet } from 'react-native'
import { Platform } from 'expo-modules-core'
import Constants from 'expo-constants'

interface FacebookLoginButtonProps {
	onLogin: (accessToken: string) => void
}

export default function FacebookLoginButton({
	onLogin,
}: FacebookLoginButtonProps) {
	const discovery = {
		authorizationEndpoint: 'https://www.facebook.com/v10.0/dialog/oauth',
		tokenEndpoint: 'https://graph.facebook.com/v10.0/oauth/access_token',
	}

	const clientId = Constants.expoConfig?.extra?.oauth?.facebookAppId
	const [request, response, promptAsync] = AuthSession.useAuthRequest(
		{
			clientId: clientId,
			redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
			scopes: ['public_profile', 'email'],
			responseType: 'token',
		},
		discovery
	)

	React.useEffect(() => {
		if (response?.type === 'success') {
			const { access_token } = response.params
			onLogin(access_token) // Send this token to your backend
		}
	}, [response])

	return (
		<TouchableOpacity
			style={[styles.socialButton, styles.facebookButton]}
			onPress={() => promptAsync()}
		>
			<Image
				source={require('@/assets/icons/facebook-white.png')}
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
})
