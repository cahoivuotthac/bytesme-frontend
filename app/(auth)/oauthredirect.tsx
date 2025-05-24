import { useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '@/providers/auth'

export default function OAuthRedirect() {
	const params = useLocalSearchParams()
	const router = useRouter()
	const { finalizeGoogleSignin: googleSignin } = useAuth()

	useEffect(() => {
		router.replace('/(auth)/input-email')
	}, [params])

	return (
		<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
			<ActivityIndicator size="large" color="#C67C4E" />
		</View>
	)
}
