import { router } from 'expo-router'
import React from 'react'
import {
	TouchableOpacity,
	StyleSheet,
	StyleProp,
	ViewStyle,
} from 'react-native'

interface NextIconProps {
	/**
	 * Function to call when button is pressed
	 */
	onPress?: () => void

	direction: 'back' | 'next'

	/**
	 * Size of the button (width and height)
	 * @default 48
	 */
	size?: number

	/**
	 * Background color of the button
	 * @default '#C67C4E'
	 */
	backgroundColor?: string

	/**
	 * Color of the arrow icon
	 * @default '#FFFFFF'
	 */
	iconColor?: string

	/**
	 * Custom styles for the container
	 */
	style?: StyleProp<ViewStyle>

	/**
	 * Whether the button is disabled
	 * @default false
	 */
	disabled?: boolean
}

/**
 * A circular button with an arrow pointing right
 */
export default function NextIcon({
	onPress,
	direction = 'back',
	size = 48,
	backgroundColor = '#C67C4E',
	iconColor = '#FFFFFF',
	style,
	disabled = false,
}: NextIconProps) {
	if (!onPress && direction === 'back') {
		onPress = () => router.back()
	}

	return (
		<TouchableOpacity
			style={[
				styles.container,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor: disabled ? '#E2E2E2' : backgroundColor,
					opacity: disabled ? 0.5 : 0.8,
				},
				style,
			]}
			onPress={onPress}
			disabled={disabled}
		>
			{direction === 'back' ? (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
				>
					<title>arrow_left_fill</title>
					<g id="arrow_left_fill" fill="none" fill-rule="nonzero">
						<path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01-.184-.092Z" />
						<path
							fill={disabled ? '#999999' : iconColor}
							d="M3.283 10.94a1.5 1.5 0 0 0 0 2.12l5.656 5.658a1.5 1.5 0 1 0 2.122-2.122L7.965 13.5H19.5a1.5 1.5 0 0 0 0-3H7.965l3.096-3.096a1.5 1.5 0 1 0-2.122-2.121L3.283 10.94Z"
						/>
					</g>
				</svg>
			) : (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
				>
					<title>arrow_right_fill</title>
					<g id="arrow_right_fill" fill="none" fill-rule="nonzero">
						<path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01-.184-.092Z" />
						<path
							fill={disabled ? '#999999' : iconColor}
							d="m15.06 5.283 5.657 5.657a1.5 1.5 0 0 1 0 2.12l-5.656 5.658a1.5 1.5 0 0 1-2.122-2.122l3.096-3.096H4.5a1.5 1.5 0 0 1 0-3h11.535L12.94 7.404a1.5 1.5 0 0 1 2.122-2.121Z"
						/>
					</g>
				</svg>
			)}
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	icon: {
		width: 20,
		height: 20,
	},
})
