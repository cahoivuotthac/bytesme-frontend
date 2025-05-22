import { View, Dimensions, Platform } from 'react-native'

// Use this component in screens where content might be overlapped by the bottom navigation bar
export default function BottomSpacer({ height }: { height?: number }) {
	// Make the spacer height match the bottom tab bar height plus safe area
	if (!height) {
		height = Platform.OS === 'ios' ? 80 : 60
	}

	return <View style={{ height }} />
}
