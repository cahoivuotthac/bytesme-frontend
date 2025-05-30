import React, { useState, useEffect, useRef } from 'react'
import {
	SafeAreaView,
	View,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Image,
	Platform,
	Dimensions,
	StatusBar,
	KeyboardAvoidingView,
	Modal,
	FlatList,
	ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { addressAPI, APIClient } from '@/utils/api'
import { useAlert } from '@/hooks/useAlert'
import * as Location from 'expo-location'
import { useTranslation } from '@/providers/locale'
import Svg, { Path, Rect, LinearGradient, Stop, Defs } from 'react-native-svg'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { largeCityCodes } from '@/constants/Cities'
import NavButton from '@/components/shared/NavButton'

// Import local JSON data
import urbansData from '@/assets/constants/vietnam-address/tinh-tp.json'
import Button from '@/components/ui/Button'

const { width, height } = Dimensions.get('window')

// Interfaces for address data
interface AddressItem {
	// id: string
	name: string
	code: string
}

interface Address {
	urban: AddressItem | null
	suburb: AddressItem | null
	quarter: AddressItem | null
}

// Location illustration component based on the Figma design
const LocationIllustration = () => (
	<View
		style={{
			alignItems: 'center',
			justifyContent: 'center',
			marginVertical: 10,
		}}
	>
		<Svg width={200} height={250} viewBox="0 0 240 200" fill="none">
			{/* Base circle with gradient */}
			<Defs>
				<LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
					<Stop offset="0" stopColor="#F6F8FF" />
					<Stop offset="1" stopColor="#DEE0ED" />
				</LinearGradient>
				<LinearGradient id="locationPin" x1="30%" y1="20%" x2="70%" y2="80%">
					<Stop offset="0" stopColor="#5565EE" />
					<Stop offset="0.5" stopColor="#6E89FA" />
					<Stop offset="1" stopColor="#7D99FD" />
				</LinearGradient>
			</Defs>

			{/* Base circle - adjusted to fit within viewBox */}
			<Path
				d="M120 180C175.228 180 220 135.228 220 80C220 24.772 175.228 -20 120 -20C64.7715 -20 20 24.772 20 80C20 135.228 64.7715 180 120 180Z"
				fill="url(#grad)"
			/>

			{/* Shadow ellipse - centered properly */}
			<Path
				d="M120 170C164.183 170 200 138.66 200 100C200 61.34 164.183 30 120 30C75.8172 30 40 61.34 40 100C40 138.66 75.8172 170 120 170Z"
				fillOpacity="0.3"
				fill="#000000"
			/>

			{/* Location pin - centered */}
			<Path
				d="M120 60C105 60 93 72 93 87C93 107 120 140 120 140C120 140 147 107 147 87C147 72 135 60 120 60ZM120 100C112.8 100 107 94.2 107 87C107 79.8 112.8 74 120 74C127.2 74 133 79.8 133 87C133 94.2 127.2 100 120 100Z"
				fill="url(#locationPin)"
			/>

			{/* Other map elements - adjusted positions */}
			<Rect x="60" y="90" width="30" height="10" rx="5" fill="#C9CDD3" />
			<Rect x="150" y="120" width="40" height="10" rx="5" fill="#C9CDD3" />
			<Rect x="90" y="130" width="25" height="8" rx="4" fill="#FEE379" />
			<Rect x="170" y="80" width="20" height="8" rx="4" fill="#86ADFF" />
			<Rect x="70" y="110" width="15" height="8" rx="4" fill="#69CA9F" />
		</Svg>
	</View>
)

export default function InputAddressScreen() {
	const { t } = useTranslation()
	const [addressDetails, setAddressDetails] = useState('')
	const [coordinates, setCoordinates] = useState<string | null>(null) // Store coordinates separately
	const [isCurrentLocation, setIsCurrentLocation] = useState(false)

	// Address selection data
	const [urbanList, setUrbanList] = useState<AddressItem[]>([])
	const [suburbList, setSuburbList] = useState<AddressItem[]>([])
	const [quarterList, setQuarterList] = useState<AddressItem[]>([])

	const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)

	// Modal states for dropdowns
	const [urbanModalVisible, setUrbanModalVisible] = useState(false)
	const [suburbModalVisible, setSuburbModalVisible] = useState(false)
	const [quarterModalVisible, setQuarterModalVisible] = useState(false)

	// Search states
	const [urbanSearch, setUrbanSearch] = useState('')
	const [suburbSearch, setSuburbSearch] = useState('')
	const [quarterSearch, setQuarterSearch] = useState('')

	// Loading states
	const [loadingUrbanList, setLoadingUrbanList] = useState(false)
	const [loadingSuburbList, setLoadingSuburbList] = useState(false)
	const [loadingQuarterList, setLoadingQuarterList] = useState(false)

	const [isDefaultAddress, setIsDefaultAddress] = useState(true)
	const [isLoading, setIsLoading] = useState(false)

	const { AlertComponent, showError, showSuccess } = useAlert()

	const skipAddressItemResetRef = useRef(false)

	// Get route params
	const params = useLocalSearchParams()
	const receivedAddress = params.pleaseLoadThisAddress
	const isEdit = Boolean(params.isEdit) // Convert string param to boolean
	console.log('isEdit: ', isEdit)
	const navigateBackPath =
		(params.navigateBackPath as string) || '/(home)/product'

	// Store the address ID when in edit mode
	const [userAddressId, setUserAddressId] = useState<number | null>(null)

	const handleSelectUrban = (urban: AddressItem) => {
		loadSuburbList(urban.code)
		setSelectedAddress((prev) => ({
			...prev,
			quarter: null,
			suburb: null,
			urban: urban,
		}))
		setUrbanModalVisible(false)
		setUrbanSearch('')
	}

	const handleSelectSuburb = (suburb: AddressItem) => {
		loadQuarterList(suburb.code)
		setSelectedAddress((prev) => ({
			...prev!,
			suburb: suburb,
			quarter: null,
		}))
		setSuburbModalVisible(false)
		setSuburbSearch('')
	}

	const handleSelectQuarter = (quarter: AddressItem) => {
		setSelectedAddress((prev) => ({
			...prev!,
			quarter: quarter,
		}))
		setQuarterModalVisible(false)
		setQuarterSearch('')
	}

	useEffect(() => {
		skipAddressItemResetRef.current = false
	})

	// Load urbans from local JSON on component mount
	useEffect(() => {
		loadUrbanList()
	}, [])
	const loadUrbanList = () => {
		setLoadingUrbanList(true)
		try {
			const urbanList = Object.entries(urbansData).map(
				([code, province]: [string, any]) => ({
					code: code,
					name: province.name_with_type,
				})
			)
			setUrbanList(urbanList)
		} catch (error) {
			console.error('Error loading urban list:', error)
			showError(t('errorLoadingProvinces') || 'Error loading urban list')
		} finally {
			setLoadingUrbanList(false)
		}
	}

	// Load districts based on selected province from local JSON
	const loadSuburbList = async (urbanCode: string) => {
		setLoadingSuburbList(true)
		try {
			let suburbData = JSON.parse(
				(await AsyncStorage.getItem('suburbData')) ?? '{}'
			)
			if (Object.keys(suburbData)) {
				const response = await APIClient.get(
					'/info/address/suburb-list?' +
						new URLSearchParams({ urbanCode }).toString()
				)
				if (response.data) {
					suburbData = response.data
					AsyncStorage.setItem('suburbData', JSON.stringify(suburbData))
					console.log('Written suburbData to async storage')
				} else {
					showError(t('errorLoadingDistricts') || 'Cannot get list of suburbs')
					return
				}
			}

			const suburbList = Object.entries(suburbData).map(
				([suburbCode, suburb]: [string, any]) => ({
					code: suburbCode,
					name: suburb.name_with_type,
				})
			)
			setSuburbList(suburbList)
		} catch (error) {
			console.error('Error loading districts:', error)
			showError(t('errorLoadingDistricts') || 'Error loading districts')
		} finally {
			setLoadingSuburbList(false)
		}
	}

	// Load wards based on selected district from local JSON
	const loadQuarterList = async (suburbCode: string) => {
		setLoadingQuarterList(true)
		try {
			let quarterData = JSON.parse(
				(await AsyncStorage.getItem('quarterData')) ?? '{}'
			)
			if (Object.keys(quarterData)) {
				const response = await APIClient.get(
					'/info/address/quarter-list?' +
						new URLSearchParams({ suburbCode }).toString()
				)
				if (response.data) {
					quarterData = response.data
					AsyncStorage.setItem('quarterData', JSON.stringify(quarterData))
					console.log('Written quarterData to async storage')
				} else {
					showError(t('errorLoadingWards') || 'Cannot get list of quarters')
					return
				}
			}

			const quarterList = Object.entries(quarterData).map(
				([code, ward]: [string, any]) => ({
					code: code,
					name: ward.name_with_type,
				})
			)
			setQuarterList(quarterList)
		} catch (error) {
			console.error('Error loading wards:', error)
			showError(t('errorLoadingWards') || 'Error loading wards')
		} finally {
			setLoadingQuarterList(false)
		}
	}

	// Filter provinces based on search
	const filteredProvinces = urbanList.filter((province) =>
		province.name.toLowerCase().includes(urbanSearch.toLowerCase())
	)

	// Filter districts based on search
	const filteredDistricts = suburbList.filter((district) =>
		district.name.toLowerCase().includes(suburbSearch.toLowerCase())
	)

	// Filter wards based on search
	const filteredWards = quarterList.filter((ward) =>
		ward.name.toLowerCase().includes(quarterSearch.toLowerCase())
	)

	useEffect(() => {
		console.log('Loading address data, isEdit:', isEdit)
		if (urbanList.length > 0 && receivedAddress) {
			// Find selected urban
			const parsedReceivedAddress = JSON.parse(receivedAddress.toString())
			const urban: AddressItem = {
				name: parsedReceivedAddress.urban_name,
				code: parsedReceivedAddress.urban_code,
			}
			const suburb: AddressItem = {
				name: parsedReceivedAddress.suburb_name,
				code: parsedReceivedAddress.suburb_code,
			}
			const quarter: AddressItem = {
				name: parsedReceivedAddress.quarter_name,
				code: parsedReceivedAddress.quarter_code,
			}

			// Debug
			console.log('Parsed received address:', parsedReceivedAddress)

			// Set the user_address_id when in edit mode
			if (isEdit && parsedReceivedAddress.user_address_id) {
				setUserAddressId(parsedReceivedAddress.user_address_id)
				setIsDefaultAddress(parsedReceivedAddress.is_default_address || false)
			}

			setSelectedAddress({
				urban,
				suburb,
				quarter,
			})
			setAddressDetails(parsedReceivedAddress.full_address)

			// Load list
			loadSuburbList(urban.code)
			loadQuarterList(suburb.code)
		}
	}, [urbanList, receivedAddress, isEdit]) // ties to urbanList to know when the page has loaded
	useEffect(() => {}, [urbansData, suburbList])

	const handleGetCurrentLocation = async () => {
		setIsLoading(true)
		try {
			// Request permission to access location
			const { status } = await Location.requestForegroundPermissionsAsync()

			if (status !== 'granted') {
				showError(t('locationPermissionDenied') || 'Location permission denied')
				return
			}

			// Get the current location with high accuracy
			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
			})

			console.log('Current coordinate info: ', location)

			// Store the coordinates in state for display
			const coordsString = `${location.coords.latitude.toFixed(
				6
			)}, ${location.coords.longitude.toFixed(6)}`
			setCoordinates(coordsString)

			// Try to get a reverse-geocoded location using Expo's Location API
			try {
				// Reverse geocoding
				const res = await APIClient.get(
					`/info/address/reverse-geocode?lat=${location.coords.latitude}&lon=${location.coords.longitude}`
				)

				if (res && res.data) {
					console.log('Reverse geocoding result: ', res.data)

					const { urban, suburb, quarter, road } = res.data
					skipAddressItemResetRef.current = true
					// setSelectedUrban({
					setSelectedAddress({
						urban: urban
							? { code: urban.code, name: urban.name_with_type }
							: null,
						suburb: suburb
							? { code: suburb.code, name: suburb.name_with_type }
							: null,
						quarter: quarter
							? { code: quarter.code, name: quarter.name_with_type }
							: null,
					})
					loadSuburbList(urban.code)
					loadQuarterList(suburb.code)

					setAddressDetails(
						(road ?? ' ') +
							(quarter ? ', ' + quarter.name_with_type : ' ') +
							(suburb ? ', ' + suburb?.name_with_type : ' ') +
							(urban ? ', ' + urban?.name_with_type : ' ')
					)
				}
			} catch (geocodeError) {
				console.log('Reverse geocoding error:', geocodeError)
				showError(t('errorGettingLocation') || 'Error getting location')
				setAddressDetails(
					t('locationWithCoordinates') || 'Location with coordinates'
				)
			}

			showSuccess(
				t('locationFound') ||
					'Đã tìm thấy vị trí của bạn, vui lòng kiểm tra lại thông tin'
			)
			setIsCurrentLocation(true)
		} catch (error) {
			console.error('Error getting location:', error)
			showError(t('locationError') || 'Error getting location')
		} finally {
			setIsLoading(false)
		}
	}

	const handleComplete = async () => {
		// Validate input
		if (!selectedAddress?.urban || !selectedAddress?.suburb) {
			showError(t('pleaseCompleteAddress') || 'Please complete the address')
			return
		}

		setIsLoading(true)
		try {
			const {
				urban: selectedUrban,
				quarter: selectedQuarter,
				suburb: selectedSuburb,
			} = selectedAddress

			// Format the complete address

			const addressData = {
				urbanName: selectedUrban.name,
				urbanCode: selectedUrban.code,
				suburbName: selectedSuburb.name,
				suburbCode: selectedSuburb.code,
				quarterName: selectedQuarter?.name || null,
				quarterCode: selectedQuarter?.code || null,
				fullAddress: addressDetails,
				isDefaultAddress,
			}

			if (isEdit && userAddressId) {
				// Update existing address
				await addressAPI.updateAddress({ ...addressData, userAddressId })
				showSuccess(
					t('addressUpdated') || 'Address updated successfully',
					() => {
						router.replace(navigateBackPath as any)
					}
				)
			} else {
				// Add new address
				await addressAPI.addAddress(addressData)
				showSuccess(t('addressSaved') || 'Address saved successfully', () => {
					router.replace(navigateBackPath as any)
				})
			}
		} catch (error) {
			console.error('Error saving address:', error)
			showError(t('addressSaveError') || 'Error saving address')
		} finally {
			setIsLoading(false)
		}
	}

	// Render modal item
	const renderItem = (
		item: AddressItem,
		onSelect: (item: AddressItem) => void
	) => (
		<TouchableOpacity style={styles.modalItem} onPress={() => onSelect(item)}>
			<Text style={styles.modalItemText}>{item.name}</Text>
		</TouchableOpacity>
	)

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}
			<StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
			{/* Header */}
			<View style={styles.header}>
				<NavButton
					direction="back"
					style={styles.backButton}
					backgroundColor="transparent"
					iconColor="rgba(198, 124, 78, 0.8)"
					onPress={() => router.replace(navigateBackPath as any)}
				/>
				{/* <Text style={styles.headerTitle}>{t('checkout')}</Text> */}
			</View>
			<Image
				style={styles.colorfulBlurDecoration}
				source={require('@/assets/decorations/colorful-blur.png')}
			/>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.keyboardAvoid}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.contentContainer}
					showsVerticalScrollIndicator={false}
					bounces={false}
				>
					{/* Title and Subtitle */}
					<View style={styles.titleContainer}>
						<Text style={styles.title}>
							{isEdit
								? t('editDeliveryLocation') || 'Edit Delivery Location'
								: t('deliveryLocation') || 'Delivery Location'}
						</Text>
						<Text style={styles.subtitle}>
							{isEdit
								? t('editDeliveryLocationSubtitle') ||
								  'Update your delivery address'
								: t('deliveryLocationSubtitle') ||
								  'Please enter your delivery address'}
						</Text>
					</View>

					{/* Illustration */}
					<LocationIllustration />

					{/* Form Container */}
					<View style={styles.formContainer}>
						{/* Get Current Location Button */}
						<TouchableOpacity
							style={styles.locationButton}
							onPress={handleGetCurrentLocation}
							disabled={isLoading}
						>
							<View style={styles.locationIconContainer}>
								<Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
									<Path
										d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
										fill="#FB0050"
									/>
								</Svg>
							</View>
							<Text style={styles.locationButtonText}>
								{t('useCurrentLocation') || 'Use Current Location'}
							</Text>
						</TouchableOpacity>

						{/* Display Coordinates if available */}
						{coordinates && (
							<View style={styles.coordinatesContainer}>
								<Text style={styles.coordinatesLabel}>
									{t('gpsCoordinates') || 'GPS Coordinates:'}
								</Text>
								<Text style={styles.coordinatesText}>{coordinates}</Text>
							</View>
						)}

						{/* City/Province */}
						<View style={styles.inputGroup}>
							<Text style={styles.inputLabel}>
								{t('province') || 'Province/City'}{' '}
								<Text style={styles.requiredStar}>*</Text>
							</Text>
							<TouchableOpacity
								style={[
									styles.inputWrapper,
									!selectedAddress?.urban && styles.inputWrapperHighlight,
								]}
								onPress={() => setUrbanModalVisible(true)}
							>
								<Text
									style={[
										styles.input,
										!selectedAddress?.urban && { color: '#B1B1B1' },
									]}
								>
									{selectedAddress?.urban
										? selectedAddress.urban.name
										: t('selectProvince') || 'Select province'}
								</Text>
								<View style={styles.dropdownIcon} />
							</TouchableOpacity>
						</View>

						{/* District */}
						<View style={styles.inputGroup}>
							<Text style={styles.inputLabel}>
								{largeCityCodes.some(
									(code) => code === selectedAddress?.urban?.code
								)
									? t('district') || 'District'
									: t('suburb') || 'Sub-urban'}{' '}
								<Text style={styles.requiredStar}>*</Text>
							</Text>
							<TouchableOpacity
								style={[
									styles.inputWrapper,
									!selectedAddress?.suburb && styles.inputWrapperHighlight,
									!selectedAddress?.urban && styles.inputWrapperDisabled,
								]}
								onPress={() =>
									selectedAddress?.urban
										? setSuburbModalVisible(true)
										: showError(
												t('selectProvinceFirst') ||
													'Please select province first'
										  )
								}
								disabled={!selectedAddress?.urban}
							>
								<Text
									style={[
										styles.input,
										!selectedAddress?.suburb && { color: '#B1B1B1' },
									]}
								>
									{selectedAddress?.suburb
										? selectedAddress.suburb.name
										: t('selectDistrict') || 'Select district'}
								</Text>
								<View style={styles.dropdownIcon} />
							</TouchableOpacity>
						</View>

						{/* Ward */}
						<View style={styles.inputGroup}>
							<Text style={styles.inputLabel}>
								{t('quarter') || 'quarter'}{' '}
								<Text style={styles.requiredStar}>*</Text>
							</Text>
							<TouchableOpacity
								style={[
									styles.inputWrapper,
									!selectedAddress?.quarter && styles.inputWrapperHighlight,
									!selectedAddress?.suburb && styles.inputWrapperDisabled,
								]}
								onPress={() =>
									selectedAddress?.suburb
										? setQuarterModalVisible(true)
										: showError(
												t('selectDistrictFirst') ||
													'Please select district first'
										  )
								}
								disabled={!selectedAddress?.suburb}
							>
								<Text
									style={[
										styles.input,
										!selectedAddress?.quarter && { color: '#B1B1B1' },
									]}
								>
									{selectedAddress?.quarter
										? selectedAddress?.quarter.name
										: t('selectWard') || 'Select ward'}
								</Text>
								<View style={styles.dropdownIcon} />
							</TouchableOpacity>
						</View>

						{/* Address Details */}
						<View style={styles.inputGroup}>
							<Text style={styles.inputLabel}>
								{t('address') || 'Address Details'}{' '}
								<Text style={styles.requiredStar}>*</Text>
							</Text>
							<View
								style={[
									styles.inputWrapper,
									!addressDetails && styles.inputWrapperHighlight,
								]}
							>
								<TextInput
									style={[styles.input, { height: 40 }]}
									value={addressDetails}
									onChangeText={setAddressDetails}
									placeholder={
										t('addressDetailPlaceholder') ||
										'Street name, building number...'
									}
									placeholderTextColor="#B1B1B1"
								/>
							</View>
						</View>

						{/* Default Address Checkbox */}
						<TouchableOpacity
							style={styles.checkboxContainer}
							onPress={() => setIsDefaultAddress(!isDefaultAddress)}
						>
							<View
								style={[
									styles.checkbox,
									isDefaultAddress && styles.checkboxChecked,
								]}
							>
								{isDefaultAddress && (
									<Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
										<Path
											d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
											fill="#FFFFFF"
										/>
									</Svg>
								)}
							</View>
							<Text style={styles.checkboxLabel}>
								{t('setAsDefault') || 'Set as default address'}
							</Text>
						</TouchableOpacity>

						{/* Save Button */}
						<Button
							style={[styles.nextButton]}
							disabled={isLoading}
							onPress={handleComplete}
							text={
								isLoading
									? t('processing') || 'Processing...'
									: isEdit
									? t('updateAddress') || 'Update Address'
									: t('saveAddress') || 'Save Address'
							}
						/>

						{/* Required fields note */}
						<Text style={styles.requiredFieldsNote}>
							<Text style={styles.requiredStar}>*</Text>{' '}
							{t('requiredFields') || 'Required fields'}
						</Text>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Province Selection Modal */}
			<Modal
				visible={urbanModalVisible}
				animationType="slide"
				transparent={true}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>
								{t('selectProvince') || 'Select Province'}
							</Text>
							<TouchableOpacity onPress={() => setUrbanModalVisible(false)}>
								<Text style={styles.modalClose}>✕</Text>
							</TouchableOpacity>
						</View>
						<View style={styles.searchContainer}>
							<TextInput
								style={styles.searchInput}
								placeholder={t('searchPlaceholder') || 'Search...'}
								value={urbanSearch}
								onChangeText={setUrbanSearch}
							/>
						</View>
						{loadingUrbanList ? (
							<ActivityIndicator
								size="large"
								color="#FB0050"
								style={styles.loading}
							/>
						) : (
							<FlatList
								data={filteredProvinces}
								keyExtractor={(item) => item.code}
								renderItem={({ item }) =>
									renderItem(item, (urban) => {
										handleSelectUrban(urban)
										setUrbanModalVisible(false)
										setUrbanSearch('')
									})
								}
								style={styles.modalList}
							/>
						)}
					</View>
				</View>
			</Modal>

			{/* District Selection Modal */}
			<Modal
				visible={suburbModalVisible}
				animationType="slide"
				transparent={true}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>
								{t('selectDistrict') || 'Select District'}
							</Text>
							<TouchableOpacity onPress={() => setSuburbModalVisible(false)}>
								<Text style={styles.modalClose}>✕</Text>
							</TouchableOpacity>
						</View>
						<View style={styles.searchContainer}>
							<TextInput
								style={styles.searchInput}
								placeholder={t('searchPlaceholder') || 'Search...'}
								value={suburbSearch}
								onChangeText={setSuburbSearch}
							/>
						</View>
						{loadingSuburbList ? (
							<ActivityIndicator
								size="large"
								color="#FB0050"
								style={styles.loading}
							/>
						) : (
							<FlatList
								data={filteredDistricts}
								keyExtractor={(item) => item.code}
								renderItem={({ item }) =>
									renderItem(item, (suburb) => {
										handleSelectSuburb(suburb)
										setSuburbModalVisible(false)
										setSuburbSearch('')
									})
								}
								style={styles.modalList}
							/>
						)}
					</View>
				</View>
			</Modal>

			{/* Ward Selection Modal */}
			<Modal
				visible={quarterModalVisible}
				animationType="slide"
				transparent={true}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>
								{t('selectWard') || 'Select Ward'}
							</Text>
							<TouchableOpacity onPress={() => setQuarterModalVisible(false)}>
								<Text style={styles.modalClose}>✕</Text>
							</TouchableOpacity>
						</View>
						<View style={styles.searchContainer}>
							<TextInput
								style={styles.searchInput}
								placeholder={t('searchPlaceholder') || 'Search...'}
								value={quarterSearch}
								onChangeText={setQuarterSearch}
							/>
						</View>
						{loadingQuarterList ? (
							<ActivityIndicator
								size="large"
								color="#FB0050"
								style={styles.loading}
							/>
						) : (
							<FlatList
								data={filteredWards}
								keyExtractor={(item) => item.code}
								renderItem={({ item }) =>
									renderItem(item, (quarter) => {
										handleSelectQuarter(quarter)
										setQuarterModalVisible(false)
										setQuarterSearch('')
									})
								}
								style={styles.modalList}
							/>
						)}
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		paddingHorizontal: 20,
	},
	headerTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#383838',
	},
	backButton: {
		position: 'absolute',
		left: 16,
		zIndex: 10,
	},
	container: {
		flex: 1,
		backgroundColor: '#FFFAF5', // Warmer white
	},
	keyboardAvoid: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	contentContainer: {
		paddingBottom: 50,
	},
	headerGradient: {
		height: height * 0.15,
		width: width,
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		overflow: 'hidden',
	},
	headerBackground: {
		height: '100%',
		width: '100%',
		backgroundColor: 'rgba(255, 250, 245, 0.6)', // Warmer background
		backdropFilter: 'blur(90px)',
	},
	colorfulBlurDecoration: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '50%',
		zIndex: -1000,
	},
	titleContainer: {
		alignItems: 'center',
		paddingTop: height * 0.1,
		paddingHorizontal: 24,
	},
	title: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 26,
		color: '#3A2E28', // Warmer dark color
		marginBottom: 12,
		textAlign: 'center',
	},
	subtitle: {
		fontFamily: 'Inter-Regular',
		fontSize: 16,
		color: '#8C7E75', // Warmer gray
		textAlign: 'center',
		lineHeight: 24,
	},
	formContainer: {
		paddingHorizontal: 24,
		marginTop: 20,
	},
	inputGroup: {
		marginBottom: 20,
	},
	inputLabel: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 16,
		color: '#8C7E75', // Warmer gray
		marginBottom: 8,
	},
	requiredStar: {
		color: '#FF6B35', // Warmer red
		fontWeight: 'bold',
	},
	inputWrapper: {
		borderWidth: 1,
		borderColor: '#E8D8C9', // Warmer border
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	inputWrapperHighlight: {
		borderColor: '#FFCBB8', // Warmer highlight
		backgroundColor: 'rgba(255, 107, 53, 0.05)', // Warmer highlight bg
	},
	inputWrapperDisabled: {
		backgroundColor: '#F8F2EA', // Warmer disabled bg
		borderColor: '#E8D8C9', // Warmer border
	},
	input: {
		flex: 1,
		fontFamily: 'Inter-Medium',
		fontSize: 16,
		color: '#3A2E28', // Warmer dark color
		paddingVertical: 4,
	},
	dropdownIcon: {
		width: 12,
		height: 6,
		borderLeftWidth: 6,
		borderRightWidth: 6,
		borderTopWidth: 6,
		borderStyle: 'solid',
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderTopColor: '#8C7E75', // Warmer gray
	},
	checkboxContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 15,
	},
	checkbox: {
		width: 20,
		height: 20,
		borderRadius: 4,
		borderWidth: 2,
		borderColor: '#E8D8C9', // Warmer border
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	checkboxChecked: {
		backgroundColor: '#FF6B35', // Warmer red
		borderColor: '#FF6B35', // Warmer red
	},
	checkboxLabel: {
		fontFamily: 'Inter-Regular',
		fontSize: 16,
		color: '#3A2E28', // Warmer dark color
	},
	nextButton: {
		alignItems: 'center',
		width: '85%',
		justifyContent: 'center',
		marginTop: 30,
		marginBottom: 20,
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 5,
	},
	nextButtonDisabled: {
		backgroundColor: 'rgba(255, 107, 53, 0.5)', // Warmer red with opacity
	},
	nextButtonText: {
		fontFamily: 'Inter-Bold',
		fontSize: 18,
		color: '#FFFFFF',
	},
	requiredFieldsNote: {
		fontFamily: 'Inter-Regular',
		fontSize: 14,
		color: '#8C7E75', // Warmer gray
		textAlign: 'center',
		marginBottom: 20,
	},
	locationButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FEE379',
		borderRadius: 100,
		paddingVertical: 12,
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	locationIconContainer: {
		marginRight: 10,
	},
	locationButtonText: {
		fontFamily: 'Inter-Medium',
		fontSize: 16,
		color: '#181725',
	},
	coordinatesContainer: {
		backgroundColor: '#F3F5FF',
		padding: 15,
		borderRadius: 8,
		marginBottom: 20,
	},
	coordinatesLabel: {
		fontFamily: 'Inter-Medium',
		fontSize: 14,
		color: '#7C7C7C',
		marginBottom: 4,
	},
	coordinatesText: {
		fontFamily: 'Inter-Regular',
		fontSize: 15,
		color: '#181725',
	},
	modalContainer: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '90%',
		backgroundColor: '#FFFFFF',
		borderRadius: 10,
		padding: 20,
		maxHeight: height * 0.8,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 15,
	},
	modalTitle: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 18,
		color: '#181725',
	},
	modalClose: {
		fontSize: 22,
		color: '#7C7C7C',
	},
	searchContainer: {
		marginBottom: 15,
	},
	searchInput: {
		borderWidth: 1,
		borderColor: '#E2E2E2',
		borderRadius: 10,
		padding: 10,
		fontSize: 16,
	},
	modalList: {
		maxHeight: height * 0.6,
	},
	modalItem: {
		paddingVertical: 15,
		borderBottomWidth: 1,
		borderBottomColor: '#F2F2F2',
	},
	modalItemText: {
		fontFamily: 'Inter-Regular',
		fontSize: 16,
		color: '#181725',
	},
	loading: {
		marginVertical: 20,
	},
})
