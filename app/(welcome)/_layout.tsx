import { Stack } from 'expo-router'
import { Redirect } from 'expo-router'
import { useAuth } from '@/providers/auth'

export default function WelcomeLayout() {
	const { authState } = useAuth()

	if (!authState.isAuthenticated) {
		return <Redirect href="/(auth)/input-phone" />
	}

	return (
		<Stack>
			<Stack.Screen name="input-address" />
		</Stack>
	)
}
