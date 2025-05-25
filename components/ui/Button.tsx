import React from 'react'
import {
	TouchableOpacity,
	Text,
	StyleSheet,
	ActivityIndicator,
	TouchableOpacityProps,
	StyleProp,
	TextStyle,
	ViewStyle,
} from 'react-native'
import Colors from '@/constants/Colors'

interface ButtonProps extends TouchableOpacityProps {
	/**
	 * Text to display in the button
	 */
	text: string

	/**
	 * Whether the button is in a loading state
	 * @default false
	 */
	loading?: boolean

	/**
	 * Text color of the button
	 * @default '#FCFCFC' (white)
	 */
	textColor?: string

	/**
	 * Background color of the button
	 * @default '#C67C4E' (coffee brown)
	 */
	backgroundColor?: string

	/**
	 * Border radius of the button
	 * @default 19
	 */
	borderRadius?: number

	/**
	 * Additional styles for the button container
	 */
	style?: StyleProp<ViewStyle>

	/**
	 * Additional styles for the button text
	 */
	textStyle?: StyleProp<TextStyle>
}

/**
 * A primary button component
 */
export default function Button({
	text,
	onPress,
	loading = false,
	textColor = '#FCFCFC',
	backgroundColor = Colors.light.buttonPrimary,
	borderRadius = 19,
	disabled = false,
	style,
	textStyle,
	...rest
}: ButtonProps) {
	return (
		<TouchableOpacity
			style={[
				styles.button,
				{
					backgroundColor: disabled ? '#A9A9A9' : backgroundColor,
					borderRadius,
				},
				loading && styles.buttonDisabled,
				style,
			]}
			onPress={onPress}
			disabled={loading || disabled}
			activeOpacity={0.8}
			{...rest}
		>
			{loading ? (
				<ActivityIndicator size="small" color={textColor} />
			) : (
				<Text style={[styles.buttonText, { color: textColor }, textStyle]}>
					{text}
				</Text>
			)}
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	button: {
		paddingVertical: 16,
		paddingHorizontal: 24,
		alignItems: 'center',
		justifyContent: 'center',
		width: 'auto',
		marginHorizontal: 'auto',
		height: 56,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 2,
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 16,
		fontWeight: '600',
		backgroundColor: 'transparent',
	},
})
