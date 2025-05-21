import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	TextInput,
	Image,
	SafeAreaView,
	ActivityIndicator,
	Alert,
	Platform,
	KeyboardAvoidingView,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import DishDecoration from '@/components/shared/DishDecoration'
import NavButton from '@/components/shared/NavButton'
import EyeIcon from '@/components/shared/EyeIcon'
import Button from '@/components/ui/Button'
import { useTranslation } from '@/providers/locale'
import { useAuth } from '@/providers/auth'
import { useAlert } from '@/hooks/useAlert'
import { addressAPI, APIClient } from '@/utils/api'
import * as ImagePicker from 'expo-image-picker'
import {
	isEmailFormatValid,
	isPasswordFormatValid,
} from '@/utils/input-validation'
import { AxiosError } from 'axios'

interface UserAddress {
	user_address_id: number
	urban_name: string
	urban_code: number
	suburb_name: string
	suburb_code: number
	quarter_name: string
	quarter_code: number
	full_address: string
	is_default_address: boolean
}

// Default profile image if user has no profile photo
const DEFAULT_PROFILE_IMAGE =
	'https://ui-avatars.com/api/?name=Bytesme+User&background=C67C4E&color=fff'

export default function EditProfileScreen() {
	const { t } = useTranslation()
	const { authState, refreshUser } = useAuth()
	const { AlertComponent, showInfo, showError, showSuccess, showConfirm } =
		useAlert()

	console.log('Auth state:', authState)
	console.log('Current user:', authState?.user)

	// User info states
	const [username, setUsername] = useState(authState?.user?.name || '')
	const [email, setEmail] = useState(authState?.user?.email || '')
	const [phoneNumber, setPhoneNumber] = useState(
		authState?.user?.phone_number || ''
	)
	const [profileImage, setProfileImage] = useState(
		authState?.user?.avatar || DEFAULT_PROFILE_IMAGE
	)

	// Password states
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false)
	const [newPasswordVisible, setNewPasswordVisible] = useState(false)
	const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)

	// Address states
	const [addresses, setAddresses] = useState<UserAddress[]>([])
	const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)

	// UI states
	const [isUpdating, setIsUpdating] = useState(false)
	const [isUploadingImage, setIsUploadingImage] = useState(false)
	const [isDirty, setIsDirty] = useState(false)
	const [activeSection, setActiveSection] = useState('profile') // 'profile', 'password', 'addresses'

	// Fetch user addresses on component mount
	useEffect(() => {
		fetchUserAddresses()
	}, [])

	// Track if form has been modified
	useEffect(() => {
		if (
			username !== (authState?.user?.name || '') ||
			email !== (authState?.user?.email || '') ||
			phoneNumber !== (authState?.user?.phone_number || '') ||
			currentPassword !== '' ||
			newPassword !== '' ||
			confirmPassword !== ''
		) {
			setIsDirty(true)
		} else {
			setIsDirty(false)
		}
	}, [
		username,
		email,
		phoneNumber,
		currentPassword,
		newPassword,
		confirmPassword,
	])

	// Fetch user addresses
	const fetchUserAddresses = async () => {
		setIsLoadingAddresses(true)
		try {
			const response = await APIClient.get('/user/addresses')
			const addresses: UserAddress[] = response.data.addresses || []
			addresses.sort((a, b) => {
				if (a.is_default_address) return -1
				if (b.is_default_address) return 1
				if (a.full_address <= b.full_address) return -1
				return 1
			})
			setAddresses(addresses)
		} catch (error) {
			console.error('Error fetching addresses:', error)
			showError(t('errorFetchingAddresses'))
		} finally {
			setIsLoadingAddresses(false)
		}
	}

	// Pick an image from gallery for profile photo
	const pickImage = async () => {
		// Request permission
		const permissionResult =
			await ImagePicker.requestMediaLibraryPermissionsAsync()

		if (permissionResult.granted === false) {
			showError(t('permissionDenied'))
			return
		}

		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.7,
				base64: true, // Request base64 data
			})

			if (!result.canceled && result.assets && result.assets.length > 0) {
				setIsUploadingImage(true)

				const imageAsset = result.assets[0]

				console.log('image asset: ', imageAsset)

				// Make sure we have base64 data
				if (!imageAsset.base64) {
					throw new Error('Base64 data not available')
				}

				const base64str = `data:image/jpeg;base64,${imageAsset.base64}`
				try {
					// Send the base64 image directly in the request
					const response = await APIClient.post('/user/update-avatar', {
						avatar: base64str,
					})

					setProfileImage(base64str)
					showSuccess(t('avatarUpdated'))
					await refreshUser() // Update profile in auth state
				} catch (error) {
					console.error('Error uploading avatar:', error)
					showError(t('errorUploadingAvatar'))
				} finally {
					setIsUploadingImage(false)
				}
			}
		} catch (error) {
			console.error('Error picking image:', error)
			showError(t('errorPickingImage'))
		}
	}

	// Remove user's profile picture
	const removeProfileImage = async () => {
		showConfirm(t('confirmRemoveAvatar'), async () => {
			try {
				await APIClient.post('/user/update-avatar', {}) // Explicitly empty avatar
				setProfileImage(DEFAULT_PROFILE_IMAGE)
				showSuccess(t('avatarRemoved'))
				await refreshUser()
			} catch (error) {
				console.error('Error removing avatar:', error)
				showError(t('errorRemovingAvatar'))
			} finally {
				setIsUploadingImage(false)
			}
		})
	}

	// Update user profile
	const handleUpdateProfile = async () => {
		// Basic validation
		// if (!fullName.trim()) {
		// 	showError(t('fullNameRequired'))
		// 	return
		// }

		if (!email.trim() || !isEmailFormatValid(email)) {
			showError(t('invalidEmail'))
			return
		}

		// For a dessert selling app, we might not need to verify current password for basic profile updates
		// The password update will have its own validation

		setIsUpdating(true)
		try {
			await APIClient.put('/user/profile', {
				name: username,
				email,
				phone_number: phoneNumber,
			})

			showSuccess(t('profileUpdateSuccess'))
			await refreshUser() // Refresh auth state with updated user data
			setIsDirty(false)
		} catch (error) {
			console.error('Error updating profile:', error)
			showError(t('profileUpdateError'))
		} finally {
			setIsUpdating(false)
		}
	}

	// Update password
	const handleUpdatePassword = async () => {
		// Validate all password fields are filled
		if (!currentPassword || !newPassword || !confirmPassword) {
			showInfo(t('allPasswordFieldsRequired'))
			return
		}

		// Validate password format
		if (!isPasswordFormatValid(newPassword)) {
			showInfo(t('invalidPassword'))
			return
		}

		// Check if new passwords match
		if (newPassword !== confirmPassword) {
			showError(t('passwordsDontMatch'))
			return
		}

		setIsUpdating(true)
		try {
			await APIClient.post('/user/update-password', {
				current_password: currentPassword,
				new_password: newPassword,
			})

			showSuccess(t('passwordUpdateSuccess'))
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
			setIsDirty(false)
		} catch (error) {
			console.error('Error updating password:', error)

			if (error instanceof AxiosError && error.response?.status === 422) {
				showError(t('invalidCurrentPassword'))
			} else {
				showError(t('passwordUpdateError'))
			}
		} finally {
			setIsUpdating(false)
		}
	}

	// Navigate to add/edit address page
	const handleAddAddress = () => {
		router.push({
			pathname: '/(welcome)/input-address',
			params: {
				navigateBackPath: '/edit-profile',
			},
		})
	}

	// Navigate to edit a specific address
	const handleEditAddress = (addressId: number) => {
		const wannaEditAddress = addresses.find(
			(a) => a.user_address_id === addressId
		)
		router.push({
			pathname: '/(welcome)/input-address',
			params: {
				navigateBackPath: '/edit-profile',
				pleaseLoadThisAddress: JSON.stringify(wannaEditAddress),
				isEdit: 'true',
			},
		})
	}

	// Delete an address
	const handleRemoveAddress = (addressId: number) => {
		showConfirm(t('confirmDeleteAddress'), async () => {
			try {
				await addressAPI.removeAddress(addressId)
				showSuccess(t('addressDeleted'))
				await fetchUserAddresses() // Refresh addresses list
			} catch (error) {
				console.error('Error deleting address:', error)
				showError(t('errorDeletingAddress'))
			}
		})
	}

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}

			{/* Header with gradient background */}
			<LinearGradient
				colors={['#FFE9D0', '#F9F5F0']}
				style={styles.headerGradient}
			>
				<View style={styles.header}>
					<NavButton
						direction="back"
						style={styles.backButton}
						backgroundColor="transparent"
						iconColor="#A67C52"
						onPress={() => router.back()}
					/>
					<Text style={styles.headerTitle}>{t('editProfile')}</Text>
				</View>
			</LinearGradient>

			{/* Tab Navigation */}
			<View style={styles.tabContainer}>
				<TouchableOpacity
					style={[styles.tab, activeSection === 'profile' && styles.activeTab]}
					onPress={() => setActiveSection('profile')}
				>
					<Text
						style={[
							styles.tabText,
							activeSection === 'profile' && styles.activeTabText,
						]}
					>
						{t('profile')}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.tab, activeSection === 'password' && styles.activeTab]}
					onPress={() => setActiveSection('password')}
				>
					<Text
						style={[
							styles.tabText,
							activeSection === 'password' && styles.activeTabText,
						]}
					>
						{t('password')}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.tab,
						activeSection === 'addresses' && styles.activeTab,
					]}
					onPress={() => setActiveSection('addresses')}
				>
					<Text
						style={[
							styles.tabText,
							activeSection === 'addresses' && styles.activeTabText,
						]}
					>
						{t('addresses')}
					</Text>
				</TouchableOpacity>
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.keyboardAvoidingView}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.contentContainer}
					showsVerticalScrollIndicator={false}
				>
					{/* Profile Section */}
					{activeSection === 'profile' && (
						<View style={styles.section}>
							{/* Profile Photo */}
							<View style={styles.profilePhotoSection}>
								<View style={styles.profilePhotoContainer}>
									{isUploadingImage ? (
										<View style={styles.loadingContainer}>
											<ActivityIndicator size="large" color="#C67C4E" />
										</View>
									) : (
										<DishDecoration
											imageSource={profileImage}
											size={120}
											containerStyle={styles.profilePhoto}
										/>
									)}
								</View>

								<View style={styles.photoActions}>
									<TouchableOpacity
										style={styles.photoActionButton}
										onPress={pickImage}
										disabled={isUploadingImage}
									>
										<Ionicons name="camera-outline" size={22} color="#C67C4E" />
										<Text style={styles.photoActionText}>
											{t('changePhoto')}
										</Text>
									</TouchableOpacity>

									<TouchableOpacity
										style={[styles.photoActionButton, styles.removePhotoButton]}
										onPress={removeProfileImage}
										disabled={
											isUploadingImage || profileImage === DEFAULT_PROFILE_IMAGE
										}
									>
										<Ionicons name="trash-outline" size={22} color="#FF5E5E" />
										<Text
											style={[styles.photoActionText, styles.removePhotoText]}
										>
											{t('removePhoto')}
										</Text>
									</TouchableOpacity>
								</View>
							</View>

							{/* Form Fields */}
							<View style={styles.formGroup}>
								<Text style={styles.label}>{t('username')}</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={username}
										onChangeText={setUsername}
										placeholder={t('usernamePlaceholder')}
										placeholderTextColor="#9B9B9B"
										autoCapitalize="none"
									/>
								</View>
							</View>

							<View style={styles.formGroup}>
								<Text style={styles.label}>{t('email')}</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={email}
										onChangeText={setEmail}
										placeholder="example@email.com"
										placeholderTextColor="#9B9B9B"
										keyboardType="email-address"
										autoCapitalize="none"
									/>
								</View>
							</View>

							<View style={styles.formGroup}>
								<Text style={styles.label}>{t('phoneNumber')}</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={phoneNumber}
										onChangeText={setPhoneNumber}
										placeholder="0123456789"
										placeholderTextColor="#9B9B9B"
										keyboardType="phone-pad"
										editable={false} // Phone number usually can't be changed directly
									/>
								</View>
								<Text style={styles.helperText}>
									{t('phoneNumberCannotBeChanged')}
								</Text>
							</View>

							<Button
								text={t('saveChanges')}
								onPress={handleUpdateProfile}
								backgroundColor="#C67C4E"
								loading={isUpdating}
								disabled={!isDirty || isUpdating}
								style={styles.saveButton}
								textStyle={styles.saveButtonText}
							/>
						</View>
					)}

					{/* Password Section */}
					{activeSection === 'password' && (
						<View style={styles.section}>
							<View style={styles.formGroup}>
								<Text style={styles.label}>{t('currentPassword')}</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={currentPassword}
										onChangeText={setCurrentPassword}
										placeholder="••••••••"
										placeholderTextColor="#9B9B9B"
										secureTextEntry={!currentPasswordVisible}
									/>
									<EyeIcon
										isVisible={currentPasswordVisible}
										onToggle={() =>
											setCurrentPasswordVisible(!currentPasswordVisible)
										}
									/>
								</View>
							</View>

							<View style={styles.formGroup}>
								<Text style={styles.label}>{t('newPassword')}</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={newPassword}
										onChangeText={setNewPassword}
										placeholder="••••••••"
										placeholderTextColor="#9B9B9B"
										secureTextEntry={!newPasswordVisible}
									/>
									<EyeIcon
										isVisible={newPasswordVisible}
										onToggle={() => setNewPasswordVisible(!newPasswordVisible)}
									/>
								</View>
								<Text style={styles.helperText}>
									{t('passwordRequirements')}
								</Text>
							</View>

							<View style={styles.formGroup}>
								<Text style={styles.label}>{t('confirmPassword')}</Text>
								<View style={styles.inputContainer}>
									<TextInput
										style={styles.input}
										value={confirmPassword}
										onChangeText={setConfirmPassword}
										placeholder="••••••••"
										placeholderTextColor="#9B9B9B"
										secureTextEntry={!confirmPasswordVisible}
									/>
									<EyeIcon
										isVisible={confirmPasswordVisible}
										onToggle={() =>
											setConfirmPasswordVisible(!confirmPasswordVisible)
										}
									/>
								</View>
							</View>

							<Button
								text={t('updatePassword')}
								onPress={handleUpdatePassword}
								backgroundColor="#C67C4E"
								loading={isUpdating}
								disabled={
									!currentPassword ||
									!newPassword ||
									!confirmPassword ||
									isUpdating
								}
								style={styles.saveButton}
								textStyle={styles.saveButtonText}
							/>
						</View>
					)}

					{/* Addresses Section */}
					{activeSection === 'addresses' && (
						<View style={styles.section}>
							<View style={styles.addressesHeader}>
								<Text style={styles.sectionTitle}>
									{t('deliveryAddresses')}
								</Text>
								<TouchableOpacity
									style={styles.addAddressButton}
									onPress={handleAddAddress}
								>
									<Ionicons name="add" size={20} color="#FFFFFF" />
									<Text style={styles.addAddressText}>
										{t('addNewAddress')}
									</Text>
								</TouchableOpacity>
							</View>

							{isLoadingAddresses ? (
								<View style={styles.loadingContainer}>
									<ActivityIndicator size="large" color="#C67C4E" />
								</View>
							) : addresses.length === 0 ? (
								<View style={styles.emptyAddressContainer}>
									<Feather name="map-pin" size={40} color="#D8D8D8" />
									<Text style={styles.emptyAddressText}>
										{t('noAddressFound')}
									</Text>
									<TouchableOpacity
										style={styles.addFirstAddressButton}
										onPress={handleAddAddress}
									>
										<Text style={styles.addFirstAddressText}>
											{t('addFirstAddress')}
										</Text>
									</TouchableOpacity>
								</View>
							) : (
								<View style={styles.addressesList}>
									{addresses.map((address, index) => (
										<View
											key={address.user_address_id}
											style={styles.addressCard}
										>
											<View style={styles.addressContent}>
												<View style={styles.addressHeader}>
													<Text style={styles.addressName}>
														{t('address') + ' ' + (index + 1).toString()}
													</Text>
													{address.is_default_address && (
														<View style={styles.defaultBadge}>
															<Text style={styles.defaultBadgeText}>
																{t('default')}
															</Text>
														</View>
													)}
												</View>
												<Text style={styles.addressDetail}>
													{address.full_address}
												</Text>
												<Text style={styles.addressLocation}>
													{[
														address.quarter_name,
														address.suburb_name,
														address.urban_name,
														// address.,
													]
														.filter(Boolean)
														.join(', ')}
												</Text>
											</View>
											<View style={styles.addressActions}>
												<TouchableOpacity
													style={styles.addressActionButton}
													onPress={() =>
														handleEditAddress(address.user_address_id)
													}
												>
													<Feather name="edit-2" size={20} color="#C67C4E" />
												</TouchableOpacity>
												<TouchableOpacity
													style={styles.addressActionButton}
													onPress={() =>
														handleRemoveAddress(address.user_address_id)
													}
												>
													<Feather name="trash-2" size={20} color={'#FF5E5E'} />
												</TouchableOpacity>
											</View>
										</View>
									))}
								</View>
							)}
						</View>
					)}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FAF9F6',
	},
	keyboardAvoidingView: {
		flex: 1,
	},
	headerGradient: {
		paddingTop: Platform.OS === 'ios' ? 8 : 16,
		paddingBottom: 16,
		paddingHorizontal: 20,
		position: 'relative',
		borderBottomLeftRadius: 15,
		borderBottomRightRadius: 15,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		position: 'relative',
		paddingVertical: 8,
	},
	backButton: {
		position: 'absolute',
		left: 0,
		zIndex: 10,
	},
	headerTitle: {
		fontSize: 20,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E',
		letterSpacing: 0.5,
	},
	tabContainer: {
		flexDirection: 'row',
		backgroundColor: '#FFFFFF',
		marginHorizontal: 20,
		marginTop: 16,
		borderRadius: 12,
		padding: 4,
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		borderRadius: 10,
	},
	activeTab: {
		backgroundColor: '#C67C4E',
	},
	tabText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#9B9B9B',
	},
	activeTabText: {
		color: '#FFFFFF',
		fontFamily: 'Inter-SemiBold',
	},
	scrollView: {
		flex: 1,
	},
	contentContainer: {
		padding: 20,
		paddingBottom: 40,
	},
	section: {
		marginBottom: 20,
	},
	profilePhotoSection: {
		alignItems: 'center',
		marginBottom: 24,
	},
	profilePhotoContainer: {
		marginBottom: 16,
		width: 120,
		height: 120,
		borderRadius: 60,
		justifyContent: 'center',
		alignItems: 'center',
	},
	profilePhoto: {
		backgroundColor: '#EDE9E0',
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 5,
	},
	photoActions: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	photoActionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: '#FFF2E5',
		marginHorizontal: 6,
	},
	removePhotoButton: {
		backgroundColor: '#FFECEC',
	},
	photoActionText: {
		marginLeft: 6,
		color: '#C67C4E',
		fontSize: 14,
		fontFamily: 'Inter-Medium',
	},
	removePhotoText: {
		color: '#FF5E5E',
	},
	formGroup: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#3C3C3C',
		marginBottom: 8,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#EAEAEA',
		borderRadius: 12,
		paddingHorizontal: 16,
		height: 56,
	},
	input: {
		flex: 1,
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#3C3C3C',
	},
	helperText: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#9B9B9B',
		marginTop: 4,
		marginLeft: 4,
	},
	saveButton: {
		marginTop: 16,
		height: 56,
		shadowColor: '#C67C4E',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 4,
	},
	saveButtonText: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 16,
	},
	addressesHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#3C3C3C',
	},
	addAddressButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#C67C4E',
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 20,
	},
	addAddressText: {
		marginLeft: 4,
		color: '#FFFFFF',
		fontSize: 14,
		fontFamily: 'Inter-Medium',
	},
	emptyAddressContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40,
	},
	emptyAddressText: {
		fontSize: 16,
		fontFamily: 'Inter-Medium',
		color: '#9B9B9B',
		marginTop: 12,
		marginBottom: 20,
	},
	addFirstAddressButton: {
		backgroundColor: '#C67C4E',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 12,
	},
	addFirstAddressText: {
		color: '#FFFFFF',
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
	},
	addressesList: {
		marginTop: 8,
	},
	addressCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		flexDirection: 'row',
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
	},
	addressContent: {
		flex: 1,
	},
	addressHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
	},
	addressName: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#3C3C3C',
		marginRight: 8,
	},
	defaultBadge: {
		backgroundColor: '#E6F2E9',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
	},
	defaultBadgeText: {
		color: '#54B175',
		fontSize: 12,
		fontFamily: 'Inter-Medium',
	},
	addressDetail: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#3C3C3C',
		marginBottom: 4,
	},
	addressLocation: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#9B9B9B',
	},
	addressActions: {
		justifyContent: 'space-around',
		marginLeft: 8,
	},
	addressActionButton: {
		padding: 8,
	},
	loadingContainer: {
		padding: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
})
