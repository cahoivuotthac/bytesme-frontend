import { Redirect } from 'expo-router'
import { Text } from 'react-native'

export default function Index() {
	return <Redirect href="/(home)/product" />
	// return <Text>This shit sucks</Text>
}
