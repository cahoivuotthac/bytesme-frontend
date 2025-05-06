import React from 'react'
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface CheckboxProps {
	isChecked: boolean
	onToggle: () => void
	size?: number
	checkColor?: string
	uncheckedColor?: string
	checkedBgColor?: string
	uncheckedBgColor?: string
	style?: ViewStyle
}

const Checkbox: React.FC<CheckboxProps> = ({
	isChecked,
	onToggle,
	size = 20,
	checkColor = '#FFFFFF',
	uncheckedColor = '#C67C4E',
	checkedBgColor = '#C67C4E',
	uncheckedBgColor = '#FFFFFF',
	style,
}) => {
	return (
		<TouchableOpacity
			onPress={onToggle}
			style={[
				styles.container,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor: isChecked ? checkedBgColor : uncheckedBgColor,
					borderColor: isChecked ? checkedBgColor : uncheckedColor,
				},
				style,
			]}
		>
			{isChecked && (
				<Ionicons
					name="checkmark"
					size={size * 0.7}
					color={checkColor}
					style={styles.checkmark}
				/>
			)}
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1.5,
	},
	checkmark: {
		alignSelf: 'center',
	},
})

export default Checkbox
