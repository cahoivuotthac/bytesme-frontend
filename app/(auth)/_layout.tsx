import { Stack } from 'expo-router'

export default function AuthLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="input-email"
				options={{
					title: 'Give me your email now',
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="verify-email"
				options={{
					title: 'Verify your phone number',
					headerShown: false,
				}}
			/>
			<Stack.Screen name="signup" options={{ headerShown: false }} />
			<Stack.Screen name="signin" options={{ headerShown: false }} />
			<Stack.Screen name="forget-password" options={{ headerShown: false }} />
			<Stack.Screen name="verify-reset-otp" options={{ headerShown: false }} />
			<Stack.Screen name="reset-password" options={{ headerShown: false }} />
		</Stack>
	)
}
