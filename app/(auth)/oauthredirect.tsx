import { useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '@/providers/auth'

export default function OAuthRedirect() {
	const params = useLocalSearchParams()
	const router = useRouter()
	const { finalizeGoogleSignin: googleSignin } = useAuth()

	useEffect(() => {
		// Google will redirect with ?code=... or ?id_token=... etc.
		// const idToken = params.id_token as string | undefined
		// const accessToken = params.access_token as string | undefined
		// console.log('OAuthRedirect params: ', params)
		// // Call your auth context to handle Google login
		// if (idToken) {
		// 	// If we have a token, we can proceed
		// 	router.replace('/(auth)/input-email')
		// }

		router.replace('/(auth)/input-email')
	}, [params])

	return (
		<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
			<ActivityIndicator size="large" color="#C67C4E" />
		</View>
	)
}
