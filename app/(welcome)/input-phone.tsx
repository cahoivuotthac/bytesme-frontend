import React, { useState } from 'react'
import {
	SafeAreaView,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Dimensions,
	ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/providers/auth'
import { useAlert } from '@/hooks/useAlert'
import { APIClient } from '@/utils/api'
import { useTranslation } from '@/providers/locale'
import { isPhoneNumberFormatValid } from '@/utils/input-validation'
import NavButton from '@/components/shared/NavButton'

const { width } = Dimensions.get('window')

export default function InputPhoneScreen() {
	const [phoneNumber, setPhoneNumber] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const { showError, showSuccess, AlertComponent } = useAlert()
	const { t } = useTranslation()
	const { authState, isAuthenticated } = useAuth()

	const handleSubmit = async () => {
		setIsLoading(true)

		if (!isPhoneNumberFormatValid(phoneNumber)) {
			showError(t('phoneInvalid'))
			setIsLoading(false)
			return
		}

		try {
			await APIClient.put('/user/profile', {
				...authState.user,
				phone_number: phoneNumber,
			})
			showSuccess(t('phoneUpdated'), () => {
				router.push({
					pathname: '/(welcome)/input-address',
				})
			})
		} catch (err) {
			showError(t('errorUpdatingPhone'))
		} finally {
			setIsLoading(false)
		}
	}

	if (!isAuthenticated || !authState.user) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.content}>
					<ActivityIndicator size="large" color="#C67C4E" />
				</View>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}
			<View style={styles.content}>
				<Text style={styles.heading}>{t('phoneLabel')}</Text>
				<Text style={styles.subheading}>{t('phoneSubtitle')}</Text>
				<View style={styles.inputContainer}>
					<TextInput
						style={styles.input}
						placeholder={t('phonePlaceholder')}
						placeholderTextColor="#999"
						keyboardType="phone-pad"
						value={phoneNumber}
						onChangeText={setPhoneNumber}
						maxLength={10}
						autoFocus
					/>
				</View>
				<TouchableOpacity
					style={[styles.button, isLoading && styles.buttonDisabled]}
					onPress={handleSubmit}
					disabled={isLoading}
				>
					{isLoading ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.buttonText}>{t('next')}</Text>
					)}
				</TouchableOpacity>
				<NavButton onPress={() => router.back()} direction="back" size={36} />
			</View>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		justifyContent: 'center',
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	heading: {
		fontSize: 26,
		fontWeight: 'bold',
		color: '#030303',
		marginBottom: 10,
	},
	subheading: {
		fontSize: 16,
		color: '#7C7C7C',
		marginBottom: 30,
		textAlign: 'center',
	},
	inputContainer: {
		width: '100%',
		marginBottom: 24,
	},
	input: {
		width: '100%',
		borderWidth: 1,
		borderColor: '#E2E2E2',
		borderRadius: 10,
		padding: 14,
		fontSize: 18,
		color: '#030303',
		backgroundColor: '#F5F5F5',
	},
	button: {
		width: '100%',
		backgroundColor: '#C67C4E',
		borderRadius: 10,
		paddingVertical: 16,
		alignItems: 'center',
		marginBottom: 16,
	},
	buttonDisabled: {
		backgroundColor: '#E0E0E0',
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
})
