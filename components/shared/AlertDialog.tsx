import React from 'react'
import {
	Modal,
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Dimensions,
	TouchableWithoutFeedback,
	Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface AlertDialogProps {
	/**
	 * Whether the alert is visible
	 */
	visible: boolean

	/**
	 * The title of the alert
	 */
	title?: string

	/**
	 * The message to display in the alert
	 */
	message: string

	/**
	 * Text for the confirm button
	 * @default "OK"
	 */
	confirmText?: string

	/**
	 * Text for the cancel button (if provided, shows a second button)
	 */
	cancelText?: string

	/**
	 * Function to call when the confirm button is pressed
	 */
	onConfirm: () => void

	/**
	 * Function to call when the cancel button is pressed
	 */
	onCancel?: () => void

	/**
	 * Type of alert (affects the color scheme)
	 * @default "default"
	 */
	type?: 'default' | 'success' | 'error' | 'warning' | 'info'
}

const { width } = Dimensions.get('window')

/**
 * A styled alert dialog component that matches the app's design language
 */
export default function AlertDialog({
	visible,
	title,
	message,
	confirmText = 'OK',
	cancelText,
	onConfirm,
	onCancel,
	type = 'default',
}: AlertDialogProps) {
	// Icon and color scheme based on alert type
	const getIconAndColor = () => {
		switch (type) {
			case 'success':
				return {
					name: 'checkmark-circle',
					color: '#37B948',
					backgroundColor: 'rgba(55, 185, 72, 0.1)',
				}
			case 'error':
				return {
					name: 'close-circle',
					color: '#D83A52',
					backgroundColor: 'rgba(216, 58, 82, 0.1)',
				}
			case 'warning':
				return {
					name: 'warning',
					color: '#FFC107',
					backgroundColor: 'rgba(255, 193, 7, 0.1)',
				}
			case 'info':
				return {
					name: 'information-circle',
					color: '#3498DB',
					backgroundColor: 'rgba(52, 152, 219, 0.1)',
				}
			default:
				return {
					name: 'information-circle',
					color: '#6B7280',
					backgroundColor: 'rgba(107, 114, 128, 0.1)',
				}
		}
	}

	const { name, color, backgroundColor } = getIconAndColor()

	return (
		<Modal
			transparent={true}
			visible={visible}
			animationType="fade"
			onRequestClose={onCancel || onConfirm}
		>
			<TouchableWithoutFeedback onPress={onCancel || onConfirm}>
				<View style={styles.overlay}>
					<TouchableWithoutFeedback>
						<View style={styles.alertContainer}>
							 {/* Icon */}
							<View style={[styles.iconContainer, { backgroundColor }]}>
								<Ionicons name={name} size={36} color={color} />
							</View>

							{/* Alert content */}
							<View style={styles.contentContainer}>
								{title && <Text style={styles.title}>{title}</Text>}
								<Text style={styles.message}>{message}</Text>

								{/* Buttons */}
								<View
									style={[
										styles.buttonContainer,
										cancelText
											? styles.twoButtonLayout
											: styles.oneButtonLayout,
									]}
								>
									{cancelText && (
										<TouchableOpacity
											style={[styles.button, styles.cancelButton]}
											onPress={onCancel}
											activeOpacity={0.7}
										>
											<Text style={styles.cancelButtonText}>{cancelText}</Text>
										</TouchableOpacity>
									)}

									<TouchableOpacity
										style={[
											styles.button,
											styles.confirmButton,
											{ backgroundColor: color },
										]}
										onPress={onConfirm}
										activeOpacity={0.7}
									>
										<Text style={styles.confirmButtonText}>{confirmText}</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	alertContainer: {
		width: width * 0.85,
		backgroundColor: '#FFFFFF',
		borderRadius: 15,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 3,
		},
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 6,
	},
	iconContainer: {
		width: 70,
		height: 70,
		borderRadius: 35,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	contentContainer: {
		padding: 24,
		alignItems: 'center',
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		fontFamily: 'Inter-Regular',
		color: '#030303',
		marginBottom: 12,
		textAlign: 'center',
	},
	message: {
		fontSize: 16,
		fontFamily: 'Inter-Regular',
		color: '#7C7C7C',
		marginBottom: 24,
		lineHeight: 22,
		textAlign: 'center',
	},
	buttonContainer: {
		marginTop: 8,
		width: '100%',
	},
	oneButtonLayout: {
		alignItems: 'center',
	},
	twoButtonLayout: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	button: {
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 100,
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: 100,
	},
	cancelButton: {
		backgroundColor: '#F3F3F3',
		marginRight: 12,
	},
	confirmButton: {},
	cancelButtonText: {
		fontSize: 16,
		fontWeight: '500',
		color: '#7C7C7C',
	},
	confirmButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFFFFF',
	},
})
