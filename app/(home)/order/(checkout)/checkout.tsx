import React, { useState, useEffect, useContext } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	SafeAreaView,
	Image,
	FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { useTranslation } from '@/providers/locale'
import { useAlert } from '@/hooks/useAlert'
import { addressAPI, voucherAPI, orderAPI } from '@/utils/api'
import { CheckoutContext, Voucher } from './_layout'
import { formatPrice } from '@/utils/display'
import NavButton from '@/components/shared/NavButton'
import VoucherSection from '@/components/shared/VoucherSection'
import Button from '@/components/ui/Button'
import { AxiosError } from 'axios'

interface UserAddress {
	userAddressId: number
	urbanName: string
	suburbName: string
	quarterName: string
	fulLAddress: string
	isDefaultAddress: boolean
}

type PaymentMethodId = 'cod' | 'card' | 'momo' | 'vnpay' | 'vietqr'

interface PaymentMethod {
	id: PaymentMethodId
	name: string
	icon: string
	iconColor: string
}

// Payment methods
const PAYMENT_METHODS: PaymentMethod[] = [
	{
		id: 'cod',
		name: 'Thanh toán khi nhận hàng\n(COD)',
		icon: 'cash-outline',
		iconColor: '#C67C4E',
	},
	// {
	// 	id: 'card',
	// 	name: 'Master Card\n**** **** **** 7122',
	// 	icon: 'card-outline',
	// 	iconColor: '#DF7A82',
	// },
	{
		id: 'momo',
		name: 'Ví MoMo\n093*****72 | 868.000 VNĐ',
		icon: 'wallet-outline',
		iconColor: '#A94FD3',
	},
	// {
	// 	id: 'vnpay',
	// 	name: 'VNPay\n**** **** **** 7122',
	// 	icon: 'wallet-outline',
	// 	iconColor: '#0066CC',
	// },
	{
		id: 'vietqr',
		name: 'VietQR\n**** **** **** 7122',
		icon: 'qr-code-outline',
		iconColor: '#FFCC00',
	},
]

export default function CheckoutScreen() {
	const { t, locale } = useTranslation()
	const { AlertComponent, showInfo, showError, showSuccess, showConfirm } =
		useAlert()
	const params = useLocalSearchParams()

	// Get state from shared context
	const {
		checkoutItems,
		subtotal,
		deliveryFee,
		total,
		selectedVoucher,
		setSelectedVoucher,
		appliedVoucher,
		setAppliedVoucher,
		vouchers,
		setVouchers,
		setIsLoadingVouchers,
		giftProducts,
		setOrderId,
	} = useContext(CheckoutContext)

	// State
	const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
		null
	)
	const [selectedPaymentMethodId, setSelectedPaymentMethodId] =
		useState<PaymentMethodId>('cod')
	const [isLoading, setIsLoading] = useState(false)
	const [applyingVoucher, setApplyingVoucher] = useState(false)
	const [quickVouchers, setQuickVouchers] = useState<Voucher[]>([])

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

	/**--------------------- Fetch quick vouchers ----------------- */
	useEffect(() => {
		const fetchQuickVouchers = async () => {
			if (!checkoutItems || checkoutItems.length === 0) {
				return
			}
			setIsLoadingVouchers(true)

			try {
				// In a real app, fetch from API
				console.log('checkoutItems in fetch quick vouchers:', checkoutItems)
				let quickVouchers = (
					await voucherAPI.getVouchers(
						checkoutItems.map((item) => item.productId),
						0,
						3
					)
				).data as Voucher[]

				quickVouchers = quickVouchers.map((voucher) => ({
					...voucher,
					isSelected: voucher.voucher_id === selectedVoucher?.voucher_id,
				})) as Voucher[]
				setQuickVouchers(quickVouchers)
			} catch (err) {}
		}

		fetchQuickVouchers()
	}, [subtotal, deliveryFee, checkoutItems])

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
	const renderPaymentMethod = (method: PaymentMethod) => {
		const isSelected = selectedPaymentMethodId === method.id

		return (
			<TouchableOpacity
				key={method.id}
				style={styles.paymentMethodCard}
				onPress={() => setSelectedPaymentMethodId(method.id)}
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
	const handleSelectQuickVoucher = (voucher: Voucher) => {
		if (selectedVoucher?.voucher_id === voucher.voucher_id) {
			// Deselect voucher if already selected
			setSelectedVoucher(null)
			showInfo('Voucher removed')
			return
		}

		setSelectedVoucher(voucher)
		setAppliedVoucher(voucher)
		showSuccess(`${voucher.voucher_name} voucher applied`)
	}

	// Handle manual voucher application in VoucherSection component
	const handleApplyVoucherCode = async (code: string) => {
		setApplyingVoucher(true)

		const matchedVoucher = vouchers.find((v) => v.voucher_code === code)
		if (matchedVoucher) {
			if (matchedVoucher.is_applicable) {
				setAppliedVoucher(matchedVoucher)
				setSelectedVoucher(matchedVoucher)
				showSuccess(t('voucherApplied'))
				setApplyingVoucher(false)
				return
			} else {
				showInfo(t('voucherNotApplicable'))
				setApplyingVoucher(false)
				return
			}
		}

		// If voucher not available off-line
		try {
			// setPromoCode(code)

			const fetchedVouchers = await (
				await voucherAPI.getVouchers(
					checkoutItems.map((item) => item.productId),
					0,
					0,
					code
				)
			).data
			const voucher = fetchedVouchers[0]
			// Find matching voucher from voucher lists
			if (voucher.is_applicable) {
				showInfo(t('voucherApplied'))
				setAppliedVoucher(voucher)
			} else {
				showInfo(t('voucherNotApplicable'))
			}
		} catch (err) {
			console.error('Error applying voucher via code:', err)
			if (err instanceof AxiosError && err?.response?.status === 404) {
				showError(t('voucherNotFound'))
			} else {
				showError(t('voucherApplyError'))
			}
		} finally {
			setApplyingVoucher(false)
		}
	}

	// Handle place order
	const handlePlaceOrder = async () => {
		if (!selectedAddressId) {
			showError(t('pleaseSelectAddress'))
			setIsLoading(false)
			return
		}

		if (!selectedPaymentMethodId) {
			showInfo(t('pleaseSelectPaymentMethod'))
			setIsLoading(false)
			return
		}

		// Order placement flow starts here
		setIsLoading(true)
		const params = {
			user_address_id: selectedAddressId,
			payment_method_id: selectedPaymentMethodId,
			voucher_code: appliedVoucher?.voucher_code || null,
			selected_item_ids: checkoutItems.map((item) => item.productId),
		}
		try {
			switch (selectedPaymentMethodId) {
				case 'cod':
					const { order_id } = (await orderAPI.placeOrder({ ...params })).data
					setOrderId(order_id)
					break
				case 'vnpay':
					await orderAPI.placeOrder({ ...params })
					break
			}
			console.log('Order placed successfully:', params)

			router.replace({
				pathname: '/(home)/order/(checkout)/order-placed',
			})
		} catch (err) {
			console.error('Error placing order:', err)
			showError(t('orderFailed'))
			setIsLoading(false)
			return
		}

		setIsLoading(false)

		// Simulate order placement
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
				{/* Checkout Items Strip */}
				<View style={styles.checkoutItemsContainer}>
					<View style={styles.checkoutItemsHeader}>
						<Text style={styles.checkoutItemsTitle}>
							{t('yourOrder')} ({checkoutItems.length})
						</Text>
						{checkoutItems.length > 3 && (
							<TouchableOpacity
								onPress={() => showInfo(t('viewingAllItems'))}
								style={styles.viewAllButton}
							>
								<Text style={styles.viewAllText}>{t('viewAll')}</Text>
							</TouchableOpacity>
						)}
					</View>

					{checkoutItems.length > 0 ? (
						<FlatList
							data={checkoutItems} // Show max 3 items
							horizontal
							showsHorizontalScrollIndicator={false}
							keyExtractor={(item) => item.productId.toString()}
							contentContainerStyle={styles.checkoutItemsList}
							renderItem={({ item }) => (
								<View style={styles.checkoutItemCard}>
									<View style={styles.itemImageContainer}>
										<Image
											source={{ uri: item.imageUrl }}
											style={styles.itemImage}
											resizeMode="cover"
										/>
									</View>
									<View style={styles.itemInfoContainer}>
										<Text style={styles.itemName} numberOfLines={1}>
											{item.productName}
										</Text>
										<Text style={styles.itemSize}>
											{item.sizes[item.selectedSizeIndex]}
										</Text>
										<View style={styles.itemQuantityPrice}>
											<Text style={styles.itemQuantity}>x{item.quantity}</Text>
											<Text style={styles.itemPrice}>
												{formatPrice(
													Math.round(
														item.prices[item.selectedSizeIndex] * item.quantity
													),
													locale
												)}
											</Text>
										</View>
									</View>
								</View>
							)}
							ListFooterComponent={() =>
								checkoutItems.length > 3 ? (
									<View style={styles.moreItemsIndicator}>
										<Text style={styles.moreItemsText}>
											+{checkoutItems.length - 3}
										</Text>
									</View>
								) : null
							}
						/>
					) : (
						<View style={styles.emptyItemsContainer}>
							<Text style={styles.emptyItemsText}>{t('noItemsFound')}</Text>
						</View>
					)}
				</View>

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
						onPress={() =>
							router.push({
								pathname: '/input-address',
								params: {
									navigateBackPath: '/order/(checkout)/checkout',
								},
							})
						}
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
					vouchers={quickVouchers}
					onSelectVoucher={handleSelectQuickVoucher}
					onApplyVoucherCode={handleApplyVoucherCode}
					isLoading={applyingVoucher}
					inputPlaceholder="Chọn hoặc nhập mã giảm giá"
					onBrowseVouchers={navigateToVoucherPage}
					appliedVoucher={appliedVoucher}
					appliedVoucherCode={appliedVoucher?.voucher_code || ''}
				/>

				{/* Order Summary Section */}
				<View style={styles.orderSummarySection}>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>{t('subtotal')}</Text>
						<Text style={styles.summaryValue}>
							{formatPrice(subtotal, locale)}
						</Text>
					</View>

					{/* Delivery fee */}
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>{t('deliveryFee')}</Text>
						{(appliedVoucher?.discount_value ?? 0) > 0 &&
						appliedVoucher?.voucher_fields === 'freeship' ? (
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<Text
									style={[
										styles.summaryValue,
										{ textDecorationLine: 'line-through', marginRight: 8 },
									]}
								>
									{formatPrice(deliveryFee, locale)}
								</Text>
								<Text style={styles.discountValue}>
									{formatPrice(
										Math.max(
											0,
											deliveryFee - (appliedVoucher?.discount_value || 0)
										),
										locale
									)}
								</Text>
							</View>
						) : (
							<Text style={styles.summaryValue}>
								{formatPrice(deliveryFee, locale)}
							</Text>
						)}
					</View>

					{appliedVoucher?.discount_value
						? appliedVoucher?.voucher_fields !== 'freeship' && (
								<View style={styles.summaryRow}>
									<Text style={styles.summaryLabel}>{t('discount')}</Text>
									<Text style={styles.discountValue}>
										-{formatPrice(appliedVoucher.discount_value, locale)}
									</Text>
								</View>
						  )
						: null}

					{/* Gift Products Section */}
					{appliedVoucher?.voucher_type === 'gift_product' &&
						giftProducts &&
						giftProducts.length > 0 && (
							<>
								<View style={styles.giftProductsHeaderRow}>
									<Text style={styles.giftProductsHeader}>
										{t('giftProducts') || 'Gift Products'}
									</Text>
									<Ionicons name="gift-outline" size={20} color="#C67C4E" />
								</View>

								{giftProducts.map((product, index) => (
									<View
										key={`gift-${product.product_id}-${index}`}
										style={styles.giftProductRow}
									>
										<View style={styles.giftProductIcon}>
											<Ionicons name="gift" size={16} color="#C67C4E" />
										</View>
										<Text style={styles.giftProductText} numberOfLines={1}>
											{product.product_name || `Product #${product.product_id}`}
											{product.size !== 'Standard' ? ` (${product.size})` : ''}
										</Text>
										<Text style={styles.giftProductQuantity}>
											x{product.quantity}
										</Text>
									</View>
								))}
							</>
						)}

					<View style={styles.divider} />

					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>{t('total')}</Text>
						<Text style={styles.totalValue}>{formatPrice(total, locale)}</Text>
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
	checkoutItemsContainer: {
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
	checkoutItemsHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	checkoutItemsTitle: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#474747',
	},
	viewAllButton: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		backgroundColor: '#C67C4E',
		borderRadius: 8,
	},
	viewAllText: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: '#FFFFFF',
	},
	checkoutItemsList: {
		gap: 12,
	},
	checkoutItemCard: {
		width: 120,
		backgroundColor: '#F8F8F8',
		borderRadius: 16,
		padding: 8,
	},
	itemImageContainer: {
		width: '100%',
		height: 80,
		borderRadius: 12,
		overflow: 'hidden',
		marginBottom: 8,
	},
	itemImage: {
		width: '100%',
		height: '100%',
	},
	itemInfoContainer: {
		flex: 1,
	},
	itemName: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: '#474747',
		marginBottom: 4,
	},
	itemSize: {
		fontSize: 10,
		fontFamily: 'Inter-Regular',
		color: '#968B7B',
		marginBottom: 4,
	},
	itemQuantityPrice: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	itemQuantity: {
		fontSize: 10,
		fontFamily: 'Inter-Medium',
		color: '#474747',
	},
	itemPrice: {
		fontSize: 10,
		fontFamily: 'Inter-Medium',
		color: '#A9411D',
	},
	moreItemsIndicator: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#C67C4E',
		justifyContent: 'center',
		alignItems: 'center',
	},
	moreItemsText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#FFFFFF',
	},
	emptyItemsContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 20,
		backgroundColor: 'rgba(198, 124, 78, 0.05)',
		borderRadius: 16,
		marginBottom: 12,
	},
	emptyItemsText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
	},
	giftProductsHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 8,
		marginBottom: 8,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: '#F5F5F5',
	},
	giftProductsHeader: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#474747',
	},
	giftProductRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		paddingLeft: 8,
	},
	giftProductIcon: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: '#FFF0CA',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
	},
	giftProductText: {
		flex: 1,
		fontSize: 13,
		fontFamily: 'Inter-Regular',
		color: '#968B7B',
	},
	giftProductQuantity: {
		fontSize: 13,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
		marginLeft: 8,
	},
})
