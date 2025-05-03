import React from 'react'
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	StyleProp,
	ViewStyle,
} from 'react-native'
import { Feather } from '@expo/vector-icons'

interface QuantityControlProps {
	/**
	 * Current quantity value
	 */
	value: number

	/**
	 * Function called when quantity is incremented
	 */
	onIncrement: () => void

	/**
	 * Function called when quantity is decremented
	 */
	onDecrement: () => void

	/**
	 * Minimum allowed quantity (default: 1)
	 */
	minValue?: number

	/**
	 * Maximum allowed quantity (default: 99)
	 */
	maxValue?: number

	/**
	 * Size of the control - affects overall dimensions (default: 'medium')
	 */
	size?: 'small' | 'medium' | 'large'

	/**
	 * Additional styles for the container
	 */
	style?: StyleProp<ViewStyle>

	/**
	 * Color of the buttons (default: '#968B7B')
	 */
	buttonColor?: string

	/**
	 * Color of the text (default: '#383838')
	 */
	textColor?: string

	/**
	 * Background color of the button (default: '#EEF6FD')
	 */
	buttonBackgroundColor?: string
}

/**
 * A quantity selector with increment and decrement buttons
 */
export default function QuantityControl({
	value,
	onIncrement,
	onDecrement,
	minValue = 1,
	maxValue = 99,
	size = 'medium',
	style,
	buttonColor = '#968B7B',
	textColor = '#383838',
	buttonBackgroundColor = '#FFFFFF',
}: QuantityControlProps) {
	// Determine button and text sizes based on the size prop
	const getSizes = () => {
		switch (size) {
			case 'small':
				return {
					buttonSize: 22,
					iconSize: 14,
					textSize: 12,
					textWidth: 20,
				}
			case 'large':
				return {
					buttonSize: 32,
					iconSize: 18,
					textSize: 15,
					textWidth: 28,
				}
			case 'medium':
			default:
				return {
					buttonSize: 26,
					iconSize: 16,
					textSize: 13,
					textWidth: 24,
				}
		}
	}

	const { buttonSize, iconSize, textSize, textWidth } = getSizes()

	const handleDecrement = () => {
		if (value > minValue) {
			onDecrement()
		}
	}

	const handleIncrement = () => {
		if (value < maxValue) {
			onIncrement()
		}
	}

	return (
		<View style={[styles.container, style]}>
			<TouchableOpacity
				style={[
					styles.button,
					{
						width: buttonSize,
						height: buttonSize,
						backgroundColor: buttonBackgroundColor,
						borderColor: buttonColor,
					},
				]}
				onPress={handleDecrement}
				disabled={value <= minValue}
				activeOpacity={0.7}
			>
				<Feather
					name="minus"
					size={iconSize}
					color={value <= minValue ? '#CCCCCC' : buttonColor}
				/>
			</TouchableOpacity>

			<Text
				style={[
					styles.quantityText,
					{
						fontSize: textSize,
						color: textColor,
						width: textWidth,
					},
				]}
			>
				{value}
			</Text>

			<TouchableOpacity
				style={[
					styles.button,
					{
						width: buttonSize,
						height: buttonSize,
						backgroundColor: buttonBackgroundColor,
						borderColor: buttonColor,
					},
				]}
				onPress={handleIncrement}
				disabled={value >= maxValue}
				activeOpacity={0.7}
			>
				<Feather
					name="plus"
					size={iconSize}
					color={value >= maxValue ? '#CCCCCC' : buttonColor}
				/>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	button: {
		borderRadius: 50, // Fully rounded
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
	},
	quantityText: {
		fontFamily: 'Inter-Medium',
		textAlign: 'center',
	},
})
