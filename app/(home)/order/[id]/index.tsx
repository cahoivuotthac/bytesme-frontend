import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Image,
	TouchableOpacity,
	ActivityIndicator,
	Dimensions,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { orderAPI } from '@/utils/api'
import { formatPrice, formatDateTime } from '@/utils/display'
import { useTranslation } from '@/providers/locale'
import { useAlert } from '@/hooks/useAlert'
import { useBottomBarVisibility } from '@/providers/BottomBarVisibilityProvider'

const { width } = Dimensions.get('window')

// Order status configuration with aesthetic colors
const ORDER_STATUS_DISPLAY = {
	pending: {
		color: '#D6A87B', // Warm beige
		trackColor: '#D6A87B33',
		icon: 'time-outline',
		label: 'orderStatusPending',
		description: 'orderStatusPendingDesc',
	},
	delivering: {
		color: '#8B9DA5', // Muted blue-gray
		trackColor: '#8B9DA533',
		icon: 'bicycle-outline',
		label: 'orderStatusDelivering',
		description: 'orderStatusDeliveringDesc',
	},
	delivered: {
		color: '#7B9E7B', // Soft green
		trackColor: '#7B9E7B33',
		icon: 'checkmark-circle-outline',
		label: 'orderStatusDelivered',
		description: 'orderStatusDeliveredDesc',
	},
	cancelled: {
		color: '#C97064', // Vintage red
		trackColor: '#C9706433',
		icon: 'close-circle-outline',
		label: 'orderStatusCancelled',
		description: 'orderStatusCancelledDesc',
	},
}

interface OrderItem {
	product_id: number
	order_items_id: number
	order_items_quantity: number
	order_items_unitprice: number
	order_items_size: string
	order_items_discounted_amount: number
	product: {
		product_name: string
		product_images: { product_image_url: string }[]
		product_description?: string
	}
}

interface OrderDetails {
	order_id: number
	user_id: number
	voucher_id: number | null
	order_provisional_price: number
	order_deliver_cost: number
	order_deliver_time: string | null
	order_deliver_address: string
	order_total_price: number
	order_payment_date: string | null
	order_payment_method: string
	order_is_paid: boolean
	order_status: 'pending' | 'delivering' | 'delivered' | 'cancelled'
	order_additional_note: string | null
	created_at: string
	updated_at: string
	order_items: OrderItem[]
	voucher?: {
		voucher_code: string
		voucher_type: 'percentage' | 'cash' | 'gift_product'
		discount_value: number
	}
}

export default function OrderDetailsScreen() {
	const { id } = useLocalSearchParams<{ id: string }>()
	const { t, locale } = useTranslation()
	const { showError } = useAlert()
	const { hide, show } = useBottomBarVisibility()

	const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		hide()
		return () => show()
	}, [])

	useEffect(() => {
		if (id) {
			loadOrderDetails()
		}
	}, [id])

	const loadOrderDetails = async () => {
		try {
			setIsLoading(true)
			const response = await orderAPI.getOrderDetails(parseInt(id!))
			setOrderDetails(response.data)
		} catch (error) {
			console.error('Error loading order details:', error)
			showError('errorFetchingOrder')
		} finally {
			setIsLoading(false)
		}
	}

	const getStatusData = () => {
		if (!orderDetails) return ORDER_STATUS_DISPLAY.pending
		return ORDER_STATUS_DISPLAY[orderDetails.order_status]
	}

	const navigateToTracking = () => {
		if (orderDetails) {
			router.push({
				pathname: '/(home)/order/(checkout)/tracking',
				params: { orderId: orderDetails.order_id.toString() },
			})
		}
	}

	const navigateBack = () => {
		router.back()
	}

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#C67C4E" />
				<Text style={styles.loadingText}>{t('loadingOrderDetails')}</Text>
			</View>
		)
	}

	if (!orderDetails) {
		return (
			<View style={styles.errorContainer}>
				<Ionicons name="alert-circle-outline" size={48} color="#C97064" />
				<Text style={styles.errorText}>{t('orderNotFound')}</Text>
				<TouchableOpacity style={styles.backButton} onPress={navigateBack}>
					<Text style={styles.backButtonText}>{t('goBack')}</Text>
				</TouchableOpacity>
			</View>
		)
	}

	const statusData = getStatusData()

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.backIconContainer}
					onPress={navigateBack}
				>
					<Ionicons name="chevron-back" size={24} color="#2F2D2C" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>{t('orderDetails')}</Text>

				{/* Track order button */}
				{['pending', 'delivering'].includes(orderDetails.order_status) ? (
					<TouchableOpacity
						style={styles.trackButton}
						onPress={navigateToTracking}
					>
						<Ionicons name="location-outline" size={20} color="#C67C4E" />
						<Text style={styles.trackButtonText}>{t('trackOrder')}</Text>
					</TouchableOpacity>
				) : (
					<View style={styles.trackButtonPlaceholder} />
				)}
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Order Status Card */}
				<View style={styles.statusCard}>
					<View
						style={[
							styles.statusIconContainer,
							{ backgroundColor: statusData.trackColor },
						]}
					>
						<Ionicons
							name={statusData.icon as any}
							size={24}
							color={statusData.color}
						/>
					</View>
					<View style={styles.statusTextContainer}>
						<Text style={[styles.statusTitle, { color: statusData.color }]}>
							{t(statusData.label)}
						</Text>
						<Text style={styles.statusDescription}>
							{t(statusData.description)}
						</Text>
					</View>
				</View>

				{/* Order Info */}
				<View style={styles.orderInfoCard}>
					<View style={styles.orderInfoHeader}>
						<Text style={styles.orderNumber}>
							{t('orderNumber')} #{orderDetails.order_id}
						</Text>
						<Text style={styles.orderDate}>
							{formatDateTime(orderDetails.created_at, locale)}
						</Text>
					</View>

					{orderDetails.order_deliver_time && (
						<View style={styles.deliveryTimeContainer}>
							<View style={styles.deliveryTimeIconContainer}>
								<Ionicons name="time-outline" size={20} color="#7B9E7B" />
							</View>
							<Text style={styles.deliveryTimeText}>
								{t('deliverTime')}:{' '}
								{formatDateTime(orderDetails.order_deliver_time, locale)}
							</Text>
						</View>
					)}
				</View>

				{/* Delivery Address */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t('deliveryAddress')}</Text>
					<View style={styles.addressCard}>
						<Ionicons name="location-outline" size={20} color="#C67C4E" />
						<Text style={styles.addressText}>
							{orderDetails.order_deliver_address}
						</Text>
					</View>
				</View>

				{/* Order Items */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t('orderItems')}</Text>
					<View style={styles.itemsContainer}>
						{orderDetails.order_items.map((item, index) => (
							<View key={item.order_items_id} style={styles.orderItem}>
								<Image
									source={{
										uri: item.product.product_images[0].product_image_url,
									}}
									style={styles.itemImage}
									resizeMode="cover"
								/>
								<View style={styles.itemDetails}>
									<Text style={styles.itemName} numberOfLines={2}>
										{item.product.product_name}
									</Text>
									<Text style={styles.itemSize}>
										{t('size')} {item.order_items_size}
									</Text>
									<View style={styles.itemBottomRow}>
										<View style={styles.quantityContainer}>
											<Text style={styles.itemQuantity}>
												x{item.order_items_quantity}
											</Text>
										</View>
										<View style={styles.priceContainer}>
											{item.order_items_discounted_amount > 0 ? (
												<>
													{/* Original item totals */}
													<Text style={styles.originalPrice}>
														{formatPrice(
															item.order_items_unitprice *
																item.order_items_quantity +
																item.order_items_discounted_amount,
															locale
														)}
													</Text>
													{/* Original item totals */}
													<Text style={styles.discountedPrice}>
														{formatPrice(
															item.order_items_unitprice *
																item.order_items_quantity,
															locale
														)}
													</Text>
													<View style={styles.savingsContainer}>
														<Text style={styles.savingsText}>
															{t('saveMoney')}{' '}
															{formatPrice(
																item.order_items_discounted_amount,
																locale
															)}
														</Text>
													</View>
												</>
											) : (
												<Text style={styles.itemPrice}>
													{formatPrice(
														item.order_items_unitprice *
															item.order_items_quantity,
														locale
													)}
												</Text>
											)}
										</View>
									</View>
								</View>
							</View>
						))}
					</View>
				</View>

				{/* Payment Method */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t('paymentMethod')}</Text>
					<View style={styles.paymentCard}>
						<Ionicons
							name={
								orderDetails.order_payment_method === 'cod'
									? 'cash-outline'
									: 'card-outline'
							}
							size={20}
							color="#C67C4E"
						/>
						<Text style={styles.paymentText}>
							{orderDetails.order_payment_method === 'cod'
								? t('cashOnDelivery')
								: orderDetails.order_payment_method === 'momo'
								? t('momoPaymentMethod')
								: orderDetails.order_payment_method === 'vnpay'
								? t('vnpayPaymentMethod')
								: orderDetails.order_payment_method.toUpperCase()}
						</Text>
						<View
							style={[
								styles.paymentStatus,
								{
									backgroundColor: orderDetails.order_is_paid
										? '#E8F5E8'
										: '#FFF3E0',
								},
							]}
						>
							<Text
								style={[
									styles.paymentStatusText,
									{
										color: orderDetails.order_is_paid ? '#4CAF50' : '#FF9F67',
									},
								]}
							>
								{orderDetails.order_is_paid ? t('paid') : t('unpaid')}
							</Text>
						</View>
					</View>
				</View>

				{/* Order Summary */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t('orderSummary')}</Text>
					<View style={styles.summaryCard}>
						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>{t('subtotal')}</Text>
							<Text style={styles.summaryValue}>
								{formatPrice(orderDetails.order_provisional_price, locale)}
							</Text>
						</View>

						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>{t('deliveryFee')}</Text>
							<Text style={styles.summaryValue}>
								{formatPrice(orderDetails.order_deliver_cost, locale)}
							</Text>
						</View>

						{orderDetails.voucher && (
							<View style={styles.summaryRow}>
								<Text style={styles.summaryLabel}>
									{t('voucher')} ({orderDetails.voucher.voucher_code})
								</Text>
								<Text style={[styles.summaryValue, { color: '#7B9E7B' }]}>
									{orderDetails.voucher.voucher_type !== 'gift_product'
										? formatPrice(orderDetails.voucher.discount_value, locale)
										: t('giftProducts')}
								</Text>
							</View>
						)}

						<View style={styles.divider} />

						<View style={styles.summaryRow}>
							<Text style={styles.totalLabel}>{t('total')}</Text>
							<Text style={styles.totalValue}>
								{formatPrice(orderDetails.order_total_price, locale)}
							</Text>
						</View>
					</View>
				</View>

				{/* Additional Notes */}
				{orderDetails.order_additional_note && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t('additionalNote')}</Text>
						<View style={styles.notesCard}>
							<Text style={styles.notesText}>
								{orderDetails.order_additional_note}
							</Text>
						</View>
					</View>
				)}

				<View style={styles.bottomSpacer} />
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F9F9F9',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F9F9F9',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		fontFamily: 'Inter-Medium',
		color: '#9E9E9E',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F9F9F9',
		paddingHorizontal: 20,
	},
	errorText: {
		marginTop: 16,
		fontSize: 18,
		fontFamily: 'Inter-Medium',
		color: '#2F2D2C',
		textAlign: 'center',
	},
	backButton: {
		marginTop: 24,
		paddingHorizontal: 24,
		paddingVertical: 12,
		backgroundColor: '#C67C4E',
		borderRadius: 16,
	},
	backButtonText: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#FFFFFF',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingTop: 60,
		paddingBottom: 20,
		backgroundColor: '#FFFFFF',
		borderBottomWidth: 1,
		borderBottomColor: '#F5F5F5',
	},
	backIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#F7F7F7',
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#2F2D2C',
	},
	trackButtonPlaceholder: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: 'transparent',
	},
	trackButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: '#FFF8F0',
		borderRadius: 20,
		borderWidth: 1,
		borderColor: '#C67C4E',
	},
	trackButtonText: {
		marginLeft: 4,
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E',
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingTop: 20,
	},
	statusCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		padding: 20,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	statusIconContainer: {
		width: 60,
		height: 60,
		borderRadius: 30,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	statusTextContainer: {
		flex: 1,
	},
	statusTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		marginBottom: 4,
	},
	statusDescription: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#7D7D7D',
		lineHeight: 20,
	},
	orderInfoCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		padding: 20,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	orderInfoHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	orderNumber: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#2F2D2C',
	},
	orderDate: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#7D7D7D',
	},
	deliveryTimeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		backgroundColor: '#EFF8F1',
	},
	deliveryTimeIconContainer: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	deliveryTimeText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#424242',
		flex: 1,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#2F2D2C',
		marginBottom: 12,
	},
	addressCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	addressText: {
		marginLeft: 12,
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#2F2D2C',
		flex: 1,
		lineHeight: 20,
	},
	itemsContainer: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	orderItem: {
		flexDirection: 'row',
		marginBottom: 16,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#F5F5F5',
	},
	itemImage: {
		width: 60,
		height: 60,
		borderRadius: 12,
		marginRight: 12,
	},
	itemDetails: {
		flex: 1,
	},
	itemName: {
		fontSize: 15,
		fontFamily: 'Inter-SemiBold',
		color: '#2F2D2C',
		marginBottom: 4,
	},
	itemSize: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#968B7B',
		marginBottom: 8,
	},
	itemBottomRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	quantityContainer: {
		backgroundColor: '#F8F1FF',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
	},
	itemQuantity: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: '#9C6ADE',
		flex: 0,
		textAlign: 'center',
	},
	priceContainer: {
		alignItems: 'flex-end',
	},
	itemPrice: {
		fontSize: 15,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E',
	},
	originalPrice: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#9E9E9E',
		textDecorationLine: 'line-through',
		marginBottom: 2,
	},
	discountedPrice: {
		fontSize: 15,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E',
		marginBottom: 2,
	},
	savingsContainer: {
		backgroundColor: '#E8F5E8',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	savingsText: {
		fontSize: 10,
		fontFamily: 'Inter-Medium',
		color: '#4CAF50',
	},
	paymentCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	paymentText: {
		marginLeft: 12,
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#2F2D2C',
		flex: 1,
	},
	paymentStatus: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
	},
	paymentStatusText: {
		fontSize: 12,
		fontFamily: 'Inter-SemiBold',
		flex: 1,
		textAlign: 'center',
	},
	summaryCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	summaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	summaryLabel: {
		fontSize: 15,
		fontFamily: 'Inter-Regular',
		color: '#7D7D7D',
	},
	summaryValue: {
		fontSize: 15,
		fontFamily: 'Inter-Medium',
		color: '#2F2D2C',
	},
	divider: {
		height: 1,
		backgroundColor: '#F5F5F5',
		marginVertical: 12,
	},
	totalLabel: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#2F2D2C',
	},
	totalValue: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E',
	},
	notesCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	notesText: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#2F2D2C',
		lineHeight: 20,
	},
	bottomSpacer: {
		height: 80,
	},
})
