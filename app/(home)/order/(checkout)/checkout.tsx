import React, { useState, useEffect, useContext } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	SafeAreaView,
	Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { useTranslation } from '@/providers/locale'
import NavButton from '@/components/shared/NavButton'
import VoucherSection from '@/components/shared/VoucherSection'
import Button from '@/components/ui/Button'
import { useAlert } from '@/hooks/useAlert'
import { addressAPI } from '@/utils/api'
import { CheckoutContext, Voucher } from './_layout'

const { width } = Dimensions.get('window')

interface UserAddress {
	userAddressId: number
	urbanName: string
	suburbName: string
	quarterName: string
	fulLAddress: string
	isDefaultAddress: boolean
}

// Payment methods
const PAYMENT_METHODS = [
	{
		id: 'cod',
		name: 'Thanh toán khi nhận hàng\n(COD)',
		icon: 'cash-outline',
		iconColor: '#C67C4E',
	},
	{
		id: 'card',
		name: 'Master Card\n**** **** **** 7122',
		icon: 'card-outline',
		iconColor: '#DF7A82',
	},
	{
		id: 'momo',
		name: 'Ví MoMo\n093*****72 | 868.000 VNĐ',
		icon: 'wallet-outline',
		iconColor: '#A94FD3',
	},
]

// Mock vouchers data
const MOCK_VOUCHERS = [
	{
		id: 'freeship',
		code: 'FREESHIP',
		name: 'Free Shipping',
		description: 'Free shipping on your order',
		expiry: 'Valid until May 20',
		icon: 'bicycle',
		colors: ['#FF9EB1', '#FF7C96'],
		isValid: true,
	},
	{
		id: 'save10',
		code: 'SAVE10',
		name: '10% Off',
		description: '10% off your entire order',
		expiry: 'Valid until May 15',
		icon: 'cash-outline',
		colors: ['#C67C4E', '#A0643C'],
		isValid: true,
	},
	{
		id: 'newuser',
		code: 'NEWUSER',
		name: 'New User',
		description: 'Special discount for new users',
		expiry: 'First order only',
		icon: 'person-add',
		colors: ['#7D97F4', '#5A78F0'],
		isValid: true,
	},
]

export default function CheckoutScreen() {
	const { t } = useTranslation()
	const { AlertComponent, showInfo, showError, showSuccess } = useAlert()
	const params = useLocalSearchParams()

	// Get state from shared context
	const {
		checkoutItems,
		subtotal,
		deliveryFee,
		discount,
		total,
		selectedVoucher,
		setSelectedVoucher,
	} = useContext(CheckoutContext)

	// State
	const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
		null
	)
	const [selectedPayment, setSelectedPayment] = useState('cod')
	const [promoCode, setPromoCode] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [applyingVoucher, setApplyingVoucher] = useState(false)

	/**-------------------------------- Fetch user addresses ------------------------------------------- */
	const [userAddresses, setUserAddresses] = useState<UserAddress[]>([])

	useEffect(() => {
		const fetchUserAddresses = async () => {
			try {
				// Simulate API call to fetch user addresses
				const { addresses } = (await addressAPI.getUserAddresses()).data
				const userAddresses = addresses.map((address: any) => ({
					userAddressId: address.user_address_id,
					urbanName: address.urban_name,
					suburbName: address.suburb_name,
					quarterName: address.quarter_name,
					fulLAddress: address.full_address,
					isDefaultAddress: address.is_default_address,
				}))

				// Set user addresses state and select default address
				setUserAddresses(userAddresses)

				// Set the default address as selected
				const defaultAddress = userAddresses.find(
					(addr: UserAddress) => addr.isDefaultAddress
				)
				if (defaultAddress) {
					setSelectedAddressId(defaultAddress.userAddressId)
				} else if (userAddresses.length > 0) {
					setSelectedAddressId(userAddresses[0].userAddressId)
				}
			} catch (error) {
				console.error('Error fetching user addresses:', error)
			}
		}

		fetchUserAddresses()
	}, [])

	// Update promotion code when voucher changes
	useEffect(() => {
		if (selectedVoucher) {
			setPromoCode(selectedVoucher.voucher_name)
		} else {
			setPromoCode('')
		}
	}, [selectedVoucher])

	// Render address card
	const renderAddressCard = (address: UserAddress) => {
		const isSelected = selectedAddressId === address.userAddressId

		// Function to truncate text with ellipsis if too long
		const truncateText = (text: string, maxLength: number) => {
			if (!text) return ''
			return text.length > maxLength
				? text.substring(0, maxLength) + '...'
				: text
		}

		if (isSelected) {
			return (
				<LinearGradient
					key={address.userAddressId}
					colors={['#FFF0CA', '#FFE084']}
					start={{ x: 0, y: 0.5 }}
					end={{ x: 1, y: 0.5 }}
					style={styles.addressCard}
				>
					<View style={styles.addressIconContainer}>
						<Ionicons name="location" size={20} color="#474747" />
					</View>

					<View style={styles.addressContent}>
						<Text style={styles.addressText}>
							{truncateText(address.fulLAddress, 35)}
						</Text>
						<Text style={styles.addressDetail}>
							{truncateText(
								`${address.quarterName}, ${address.suburbName}, ${address.urbanName}`,
								40
							)}
						</Text>
					</View>

					<View style={styles.addressRadio}>
						<View style={[styles.radioOuter, styles.radioOuterSelected]}>
							<View style={styles.radioInner} />
						</View>
					</View>
				</LinearGradient>
			)
		}

		return (
			<TouchableOpacity
				key={address.userAddressId}
				style={[styles.addressCard, styles.addressCardUnselected]}
				onPress={() => setSelectedAddressId(address.userAddressId)}
			>
				<View style={styles.addressIconContainer}>
					<Ionicons name="location" size={20} color="#474747" />
				</View>

				<View style={styles.addressContent}>
					<Text style={styles.addressText}>
						{truncateText(address.fulLAddress, 35)}
					</Text>
					<Text style={styles.addressDetail}>
						{truncateText(
							`${address.quarterName}, ${address.suburbName}, ${address.urbanName}`,
							40
						)}
					</Text>
				</View>

				<View style={styles.addressRadio}>
					<View style={styles.radioOuter}>
						{isSelected && <View style={styles.radioInner} />}
					</View>
				</View>
			</TouchableOpacity>
		)
	}

	// Render payment method
	const renderPaymentMethod = (method) => {
		const isSelected = selectedPayment === method.id

		return (
			<TouchableOpacity
				key={method.id}
				style={styles.paymentMethodCard}
				onPress={() => setSelectedPayment(method.id)}
			>
				<View style={styles.paymentIconContainer}>
					<Ionicons name={method.icon} size={32} color={method.iconColor} />
				</View>

				<View style={styles.paymentContent}>
					<Text style={styles.paymentText}>{method.name}</Text>
				</View>

				<View style={styles.paymentRadio}>
					<View
						style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}
					>
						{isSelected && <View style={styles.radioInner} />}
					</View>
				</View>
			</TouchableOpacity>
		)
	}

	// Add new payment method
	const handleAddPaymentMethod = () => {
		showInfo('This feature will be available soon')
	}

	// Navigate to voucher selection page
	const navigateToVoucherPage = () => {
		router.push('/order/(checkout)/voucher')
	}

	// Handle voucher selection from VoucherSection component
	const handleSelectVoucher = (voucher) => {
		if (selectedVoucher?.voucher_id === voucher.voucher_id) {
			// Deselect voucher if already selected
			setSelectedVoucher(null)
			showInfo('Voucher removed')
			return
		}

		const voucherObj = {
			voucher_id: voucher.id,
			voucher_name: voucher.code,
			voucher_description: voucher.description,
			voucher_fields: voucher.id === 'freeship' ? 'freeship' : 'discount',
			voucher_start_date: new Date().toISOString(),
			voucher_end_date: new Date(
				Date.now() + 30 * 24 * 60 * 60 * 1000
			).toISOString(), // 30 days from now
			voucher_type: voucher.id === 'save10' ? 'percent' : 'fixed',
			voucher_value:
				voucher.id === 'save10'
					? 10
					: voucher.id === 'freeship'
					? 20000
					: 50000,
		}

		setSelectedVoucher(voucherObj)
		showSuccess(`${voucher.name} voucher applied`)
	}

	// Handle manual voucher application in VoucherSection component
	const handleApplyVoucherCode = (code) => {
		setApplyingVoucher(true)

		// Simulate API call
		setTimeout(() => {
			setApplyingVoucher(false)
			setPromoCode(code)
			showInfo(`Applying voucher: ${code}`)

			// Find matching voucher from mock data
			const matchedVoucher = MOCK_VOUCHERS.find((v) => v.code === code)
			if (matchedVoucher) {
				handleSelectVoucher(matchedVoucher)
			}
		}, 800)
	}

	// Handle place order
	const handlePlaceOrder = () => {
		setIsLoading(true)

		// Simulate order placement
		setTimeout(() => {
			setIsLoading(false)
			router.push('/order/confirm')
		}, 1000)
	}

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}

			{/* Header */}
			<View style={styles.header}>
				<NavButton
					direction="back"
					style={styles.backButton}
					backgroundColor="transparent"
					iconColor="rgba(198, 124, 78, 0.8)"
				/>
				<Text style={styles.headerTitle}>{t('checkout')}</Text>
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* Delivery Address Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t('deliveryAddress')}</Text>

					{userAddresses.length > 0 ? (
						<View style={styles.addressList}>
							{userAddresses.map((address) => renderAddressCard(address))}
						</View>
					) : (
						<View style={styles.emptyAddressContainer}>
							<Ionicons name="location-outline" size={40} color="#C67C4E" />
							<Text style={styles.emptyAddressText}>{t('noAddressFound')}</Text>
						</View>
					)}

					{/* Add New Address Button */}
					<TouchableOpacity
						style={styles.addAddressButton}
						onPress={() => router.push('/input-address')}
					>
						<Ionicons name="add-circle" size={24} color="#C67C4E" />
						<Text style={styles.addAddressText}>{t('addNewAddress')}</Text>
					</TouchableOpacity>
				</View>

				{/* Payment Method Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t('paymentMethod')}</Text>

					<View style={styles.paymentMethodsList}>
						{PAYMENT_METHODS.map((method) => renderPaymentMethod(method))}

						{/* Separator Lines */}
						<View style={styles.separatorLine} />
					</View>

					{/* Add Payment Method Button */}
					<TouchableOpacity
						style={styles.addPaymentButton}
						onPress={handleAddPaymentMethod}
					>
						<View style={styles.addPaymentIconContainer}>
							<Ionicons name="add" size={24} color="#EA5982" />
						</View>
						<Text style={styles.addPaymentText}>{t('addPaymentMethod')}</Text>
					</TouchableOpacity>
				</View>

				{/* Bytesme Voucher Section */}
				<VoucherSection
					vouchers={MOCK_VOUCHERS}
					selectedVoucherCode={promoCode}
					onSelectVoucher={handleSelectVoucher}
					onApplyVoucherCode={handleApplyVoucherCode}
					isLoading={applyingVoucher}
					inputPlaceholder="Chọn hoặc nhập mã giảm giá"
					onBrowseVouchers={navigateToVoucherPage}
					selectedVoucher={selectedVoucher}
				/>

				{/* Order Summary Section */}
				<View style={styles.orderSummarySection}>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>{t('subtotal')}</Text>
						<Text style={styles.summaryValue}>
							{subtotal.toLocaleString('vi-VN')}đ
						</Text>
					</View>

					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>{t('deliveryFee')}</Text>
						<Text style={styles.summaryValue}>
							{deliveryFee.toLocaleString('vi-VN')}đ
						</Text>
					</View>

					{discount > 0 && (
						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>{t('discount')}</Text>
							<Text style={styles.discountValue}>
								-{discount.toLocaleString('vi-VN')}đ
							</Text>
						</View>
					)}

					<View style={styles.divider} />

					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>{t('total')}</Text>
						<Text style={styles.totalValue}>
							{total.toLocaleString('vi-VN')}đ
						</Text>
					</View>
				</View>

				{/* Spacing for bottom button */}
				<View style={styles.bottomSpacer} />
			</ScrollView>

			{/* Place Order Button */}
			<View style={styles.bottomContainer}>
				<Button
					text={t('placeOrder')}
					onPress={handlePlaceOrder}
					loading={isLoading}
					style={styles.placeOrderButton}
					backgroundColor="#C67C4E"
					disabled={!selectedAddressId}
				/>
			</View>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F3F3F3',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		paddingHorizontal: 20,
	},
	backButton: {
		position: 'absolute',
		left: 16,
		zIndex: 10,
	},
	headerTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#383838',
	},
	content: {
		flex: 1,
	},
	section: {
		marginHorizontal: 20,
		marginTop: 16,
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	sectionTitle: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#474747',
		textAlign: 'center',
		marginBottom: 16,
	},
	addressList: {
		gap: 12,
	},
	addressCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 30,
		marginBottom: 8,
	},
	addressCardUnselected: {
		backgroundColor: '#F8F8F8',
	},
	addressIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	addressContent: {
		flex: 1,
	},
	addressText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#474747',
		marginBottom: 4,
	},
	addressDetail: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#968B7B',
	},
	addressRadio: {
		marginLeft: 8,
	},
	radioOuter: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#000',
		justifyContent: 'center',
		alignItems: 'center',
	},
	radioOuterSelected: {
		borderColor: '#C67C4E',
		borderWidth: 2,
	},
	radioInner: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: '#C67C4E',
	},
	addAddressButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: '#C67C4E',
		borderStyle: 'dashed',
		borderRadius: 30,
		backgroundColor: 'rgba(198, 124, 78, 0.05)',
		marginTop: 12,
	},
	addAddressText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
		marginLeft: 8,
	},
	emptyAddressContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 20,
		backgroundColor: 'rgba(198, 124, 78, 0.05)',
		borderRadius: 16,
		marginBottom: 12,
	},
	emptyAddressText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
		marginTop: 8,
	},
	paymentMethodsList: {
		gap: 12,
	},
	paymentMethodCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		backgroundColor: '#F8F8F8',
		borderRadius: 16,
		marginBottom: 8,
	},
	paymentIconContainer: {
		width: 50,
		height: 50,
		borderRadius: 12,
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	paymentContent: {
		flex: 1,
	},
	paymentText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#000000',
	},
	paymentRadio: {
		marginLeft: 8,
	},
	separatorLine: {
		height: 1,
		backgroundColor: 'transparent',
		width: '100%',
		marginVertical: 4,
		borderStyle: 'dashed',
		borderWidth: 1,
		borderColor: '#EAEAEA',
		borderRadius: 1,
	},
	addPaymentButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		marginTop: 8,
	},
	addPaymentIconContainer: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
	},
	addPaymentText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#EA5982',
	},
	orderSummarySection: {
		margin: 20,
		marginBottom: 0,
		padding: 16,
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	summaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	summaryLabel: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#968B7B',
	},
	summaryValue: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#968B7B',
	},
	discountValue: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#A9411D',
	},
	divider: {
		height: 1,
		backgroundColor: 'transparent',
		marginVertical: 12,
		borderStyle: 'dashed',
		borderWidth: 1,
		borderColor: '#A0998E',
		borderRadius: 1,
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	totalLabel: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#383838',
	},
	totalValue: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#A9411D',
	},
	bottomSpacer: {
		height: 120,
	},
	bottomContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: '#FFFFFF',
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderTopWidth: 1,
		borderTopColor: '#F5F5F5',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 4,
	},
	placeOrderButton: {
		width: '100%',
	},
	selectedVoucherContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		backgroundColor: '#FFF0CA',
		borderRadius: 16,
		marginBottom: 8,
	},
	voucherIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#C67C4E',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	voucherContent: {
		flex: 1,
	},
	voucherName: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#474747',
		marginBottom: 4,
	},
	voucherDescription: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#968B7B',
	},
	addVoucherButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: '#C67C4E',
		borderStyle: 'dashed',
		borderRadius: 30,
		backgroundColor: 'rgba(198, 124, 78, 0.05)',
		marginTop: 12,
	},
	addVoucherText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
		marginLeft: 8,
	},
})
