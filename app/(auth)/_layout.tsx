import { View } from '@/components/Themed'
import { Stack } from 'expo-router'

export default function AuthLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="input-phone"
				options={{
					title: 'Give me your phone number now',
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="verify-phone"
				options={{
					title: 'Verify your phone number',
					headerShown: false,
				}}
			/>
		</Stack>
	)
}
