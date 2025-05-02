import { Stack } from 'expo-router'
import { Redirect } from 'expo-router'
import { useAuth } from '@/providers/auth'
import { useTranslation } from '@/providers/locale'

export default function WelcomeLayout() {
	const { authState } = useAuth()
	const { t } = useTranslation()

	if (!authState.isAuthenticated) {
		// Redirect to phone input screen if not authenticated
		return <Redirect href="/(auth)/input-phone" />
	}

	return (
		<Stack>
			<Stack.Screen 
				name="input-address" 
				options={{ 
					title: t('deliveryLocation'),
					headerShown: true
				}} 
			/>
		</Stack>
	)
}
