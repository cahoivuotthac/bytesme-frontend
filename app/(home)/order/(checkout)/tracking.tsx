import React, { useState, useEffect, useRef } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	SafeAreaView,
	TouchableOpacity,
	Image,
	ActivityIndicator,
	Platform,
	ImageBackground,
	Animated,
} from 'react-native'
import {
	Ionicons,
	MaterialCommunityIcons,
	FontAwesome5,
} from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { useTranslation } from '@/providers/locale'
import { useAlert } from '@/hooks/useAlert'
import NavButton from '@/components/shared/NavButton'
import Button from '@/components/ui/Button'
import { orderAPI } from '@/utils/api'
import { formatPrice } from '@/utils/display'
import { useAuth } from '@/providers/auth'
import { useEchoChannel } from '@/hooks/useEchoChannel'
import { CheckoutContext } from './_layout'
import { useContext } from 'react'
import URLs from '@/constants/URLs'

// Order status data with colors and labels for the vintage aesthetic
const ORDER_STATUS_DISPLAY = {
	pending: {
		color: '#D6A87B', // Warm brown
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

// Order interface based on the schema

export default function OrderTrackingScreen() {
	const { t, locale } = useTranslation()
	const { AlertComponent, showInfo, showError, showSuccess, showConfirm } =
		useAlert()
	const params = useLocalSearchParams()
	const { authState } = useAuth()
	const { orderId, trackingOrder, setTrackingOrder } =
		useContext(CheckoutContext)

	console.log('Order ID in tracking page:', orderId)

	// State
	const [isLoading, setIsLoading] = useState(true)
	const [isCancelling, setIsCancelling] = useState(false)

	const handleOrderStatusEvent = (event: any) => {
		console.log('OrderStatusEvent event received:', event)
		console.log('current order ID:', orderId)

		if (parseInt(event.orderId) !== orderId) {
			console.log(
				'Order ID does not match. Ignoring event for order ID:',
				event.orderId
			)
			return
		}

		try {
			// Update order status on event
			setTrackingOrder((prevOrder) => {
				if (!prevOrder) return null
				return { ...prevOrder, order_status: event.newStatus }
			})

			switch (event.status) {
				case 'delivering':
					break
				case 'delivered':
				// showSuccess(t('orderStatusChangedToDelivered'))
				case 'cancelled':
					// showError(t('orderStatusChangedToCancelled'))
					break
			}
		} catch (error) {
			console.error('Error while handling order status notification:', error)
		}
	}

	// Reference for Echo channel subscription
	useEchoChannel(
		`order-status`,
		'.OrderStatusEvent',
		false,
		handleOrderStatusEvent
	)

	// Fetch order details
	useEffect(() => {
		const fetchOrderDetails = async () => {
			if (!orderId) {
				return
			}

			try {
				setIsLoading(true)
				// Get order details from API
				const orderDetails = (await orderAPI.getOrderDetails(orderId)).data
				setTrackingOrder(orderDetails)
			} catch (error) {
				console.error('Error fetching order details:', error)
				showError(t('errorFetchingOrder'))
			} finally {
				setIsLoading(false)
			}
		}

		fetchOrderDetails()
	}, [orderId])

	// Function to handle cancelling an order
	const handleCancelOrder = async () => {
		if (!trackingOrder || trackingOrder.order_status !== 'pending') {
			showError(t('cannotCancelOrder'))
			return
		}

		// Show confirmation dialog before cancelling
		showConfirm(
			t('cancelOrderTitle'),
			async () => {
				try {
					setIsCancelling(true)
					// Call API to cancel the order
					await orderAPI.cancelOrder(orderId!)

					// Update local state since Echo event might be delayed
					setTrackingOrder((prevOrder) => {
						if (!prevOrder) return null
						return { ...prevOrder, order_status: 'cancelled' }
					})

					showSuccess(t('orderCancelledSuccess'))
				} catch (error) {
					console.error('Error cancelling order:', error)
					showError(t('errorCancellingOrder'))
				} finally {
					setIsCancelling(false)
				}
			},
			t('close')
		)
	}

	// Get status data based on current order status
	const getStatusData = () => {
		if (!trackingOrder) return ORDER_STATUS_DISPLAY.pending
		const statusData = ORDER_STATUS_DISPLAY[trackingOrder.order_status]
		console.log('order status in getStatusData:', trackingOrder.order_status)
		console.log('Status data:', statusData)
		return statusData
	}

	// Calculate delivery progress percentage
	const getProgressPercentage = () => {
		if (!trackingOrder) return 0

		switch (trackingOrder.order_status) {
			case 'pending':
				return 25
			case 'delivering':
				return 65
			case 'delivered':
				return 100
			case 'cancelled':
				return 100 // Even if cancelled, show full track for visual consistency
			default:
				return 0
		}
	}

	// Navigate to home screen
	const navigateToHome = () => {
		router.navigate('/(home)/product')
	}

	// Navigate to order details/history
	const navigateToOrderHistory = () => {
		router.navigate('/order')
	}

	// Format dates for display
	const formatDate = (dateString: string | null) => {
		if (!dateString) return ''

		const date = new Date(dateString)
		return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(date)
	}

	// Check if order can be cancelled
	const canCancelOrder = () => {
		return trackingOrder?.order_status === 'pending'
	}

	const statusData = getStatusData()
	const progressPercentage = getProgressPercentage()

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}

			{/* Header with decorative background */}
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
					/>
					<Text style={styles.headerTitle}>{t('orderTracking')}</Text>
				</View>
			</LinearGradient>

			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#D6A87B" />
					<Text style={styles.loadingText}>{t('loadingOrderDetails')}</Text>
				</View>
			) : !trackingOrder ? (
				<View style={styles.errorContainer}>
					<Ionicons name="alert-circle-outline" size={64} color="#C97064" />
					<Text style={styles.errorText}>{t('orderNotFound')}</Text>
					<Button
						text={t('backToHome')}
						onPress={navigateToHome}
						style={styles.actionButton}
						backgroundColor="#7CA982"
					/>
				</View>
			) : (
				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					{/* Order Status Card with vibrant design */}
					<View style={styles.statusCard}>
						{/* Decorative top pattern */}
						<View style={styles.patternContainer}>
							<View style={[styles.patternLine, styles.patternLeft]}></View>
							<View style={styles.patternCircle}></View>
							<View style={[styles.patternLine, styles.patternRight]}></View>
						</View>

						<View style={styles.statusHeader}>
							<View style={styles.orderIdContainer}>
								<Text style={styles.orderIdLabel}>{t('orderNumber')}</Text>
								<Text style={styles.orderId}>#{trackingOrder.order_id}</Text>
							</View>

							<View
								style={[
									styles.statusBadge,
									{
										backgroundColor:
											trackingOrder.order_status === 'delivered'
												? '#ECFCE5'
												: trackingOrder.order_status === 'cancelled'
												? '#FFE5E5'
												: '#FFF3E0',
									},
								]}
							>
								<Text
									style={[
										styles.statusText,
										{
											color:
												trackingOrder.order_status === 'delivered'
													? '#007E25'
													: trackingOrder.order_status === 'cancelled'
													? '#E74C3C'
													: '#FF9F67',
										},
									]}
								>
									{t(statusData.label)}
								</Text>
							</View>
						</View>

						{/* Progress tracker with vibrant animation */}
						<View style={styles.progressContainer}>
							<View style={styles.progressTrack}>
								<View
									style={[
										styles.progressFill,
										{
											width: `${progressPercentage}%`,
											backgroundColor:
												trackingOrder.order_status === 'cancelled'
													? '#E74C3C'
													: trackingOrder.order_status === 'delivered'
													? '#4CAF50'
													: '#FF9F67',
										},
									]}
								/>
							</View>

							{/* Status icon with vibrant colors */}
							<View style={styles.statusIconContainer}>
								<View
									style={[
										styles.statusIconCircle,
										{
											backgroundColor:
												trackingOrder.order_status === 'delivered'
													? '#4CAF50'
													: trackingOrder.order_status === 'cancelled'
													? '#E74C3C'
													: '#FF9F67',
										},
										styles.iconShadow,
									]}
								>
									<Ionicons
										name={statusData.icon}
										size={32}
										color="#FFF"
										style={styles.statusIconInner}
									/>
								</View>
								<Text style={styles.statusDescription}>
									{t(statusData.description)}
								</Text>
							</View>
						</View>

						{/* Estimated delivery time with vibrant design */}
						{trackingOrder.order_status === 'pending' && (
							<View style={styles.deliveryTimeContainer}>
								<View style={styles.deliveryTimeIconContainer}>
									<Ionicons name="time-outline" size={22} color="#FF9F67" />
								</View>
								<Text style={styles.deliveryTimeText}>
									{trackingOrder.order_deliver_time
										? t('estimatedDeliveryTime', {
												time: formatDate(trackingOrder.order_deliver_time),
										  })
										: t('preparingYourOrder')}
								</Text>
							</View>
						)}

						{/* Order details with vibrant styling */}
						<View style={styles.orderDetailsContainer}>
							<Text style={styles.sectionTitle}>{t('orderDetails')}</Text>

							<View style={styles.orderInfoRow}>
								<View style={styles.orderInfoLabelContainer}>
									<FontAwesome5
										name="calendar-alt"
										size={16}
										color="#7CA982"
										style={styles.infoIcon}
									/>
									<Text style={styles.orderInfoLabel}>{t('orderDate')}</Text>
								</View>
								<Text style={styles.orderInfoValue}>
									{formatDate(trackingOrder.created_at)}
								</Text>
							</View>

							<View style={styles.orderInfoRow}>
								<View style={styles.orderInfoLabelContainer}>
									<FontAwesome5
										name="map-marker-alt"
										size={16}
										color="#7CA982"
										style={styles.infoIcon}
									/>
									<Text style={styles.orderInfoLabel}>
										{t('deliveryAddress')}
									</Text>
								</View>
								<Text
									style={styles.orderInfoValue}
									numberOfLines={2}
									ellipsizeMode="tail"
								>
									{trackingOrder.order_deliver_address.length > 35
										? trackingOrder.order_deliver_address.slice(0, 35) + '...'
										: trackingOrder.order_deliver_address}
								</Text>
							</View>

							<View style={styles.orderInfoRow}>
								<View style={styles.orderInfoLabelContainer}>
									<FontAwesome5
										name="credit-card"
										size={16}
										color="#7CA982"
										style={styles.infoIcon}
									/>
									<Text style={styles.orderInfoLabel}>
										{t('paymentMethod')}
									</Text>
								</View>
								<Text style={[styles.orderInfoValue, styles.highlightedText]}>
									{trackingOrder.order_payment_method === 'cod'
										? t('cashOnDelivery')
										: t('onlinePayment')}
								</Text>
							</View>

							<View style={styles.orderInfoRow}>
								<View style={styles.orderInfoLabelContainer}>
									<FontAwesome5
										name="money-bill-wave"
										size={16}
										color="#7CA982"
										style={styles.infoIcon}
									/>
									<Text style={styles.orderInfoLabel}>
										{t('paymentStatus')}
									</Text>
								</View>
								<View style={styles.paymentStatusContainer}>
									<View
										style={[
											styles.paymentStatusDot,
											{
												backgroundColor: trackingOrder.order_is_paid
													? '#4CAF50'
													: '#FF9F67',
											},
										]}
									/>
									<Text
										style={[
											styles.paymentStatusText,
											{
												color: trackingOrder.order_is_paid
													? '#4CAF50'
													: '#FF9F67',
											},
										]}
									>
										{trackingOrder.order_is_paid ? t('paid') : t('unpaid')}
									</Text>
								</View>
							</View>
						</View>

						{/* Order items with vibrant styling */}
						{trackingOrder.order_items &&
							trackingOrder.order_items.length > 0 && (
								<View style={styles.orderItemsContainer}>
									<Text style={styles.sectionTitle}>{t('orderItems')}</Text>
									{trackingOrder.order_items.map((item, index) => (
										<View
											key={`${item.product_id}-${index}`}
											style={styles.orderItem}
										>
											<View style={styles.itemImageWrapper}>
												<Image
													source={{ uri: item.product_image }}
													style={styles.itemImage}
													resizeMode="cover"
												/>
											</View>
											<View style={styles.itemDetails}>
												<Text style={styles.itemName}>{item.product_name}</Text>
												<Text style={styles.itemSize}>{item.product_size}</Text>
												<View style={styles.itemPriceRow}>
													<Text style={styles.itemPrice}>
														{formatPrice(item.product_price, locale)}
													</Text>
													<View style={styles.quantityContainer}>
														<Text style={styles.itemQuantity}>
															x{item.product_quantity}
														</Text>
													</View>
												</View>
											</View>
										</View>
									))}
								</View>
							)}

						{/* Order summary with vibrant styling */}
						<View style={styles.orderSummaryContainer}>
							<Text style={styles.sectionTitle}>{t('orderSummary')}</Text>

							<View style={styles.summaryRow}>
								<Text style={styles.summaryLabel}>{t('subtotal')}</Text>
								<Text style={styles.summaryValue}>
									{formatPrice(trackingOrder.order_provisional_price, locale)}
								</Text>
							</View>

							<View style={styles.summaryRow}>
								<Text style={styles.summaryLabel}>{t('deliveryFee')}</Text>
								<Text style={styles.summaryValue}>
									{formatPrice(trackingOrder.order_deliver_cost, locale)}
								</Text>
							</View>

							{/* If there was a discount applied (voucher) */}
							{trackingOrder.voucher_id && (
								<View style={styles.summaryRow}>
									<Text style={styles.summaryLabel}>{t('discount')}</Text>
									<Text style={styles.discountValue}>
										-
										{formatPrice(
											trackingOrder.order_provisional_price +
												trackingOrder.order_deliver_cost -
												trackingOrder.order_total_price,
											locale
										)}
									</Text>
								</View>
							)}

							<View style={styles.divider} />

							<View style={styles.totalRow}>
								<Text style={styles.totalLabel}>{t('total')}</Text>
								<Text style={styles.totalValue}>
									{formatPrice(trackingOrder.order_total_price, locale)}
								</Text>
							</View>
						</View>

						{/* Additional notes with vibrant styling */}
						{trackingOrder.order_additional_note && (
							<View style={styles.notesContainer}>
								<Text style={styles.sectionTitle}>{t('additionalNotes')}</Text>
								<View style={styles.notesTextContainer}>
									<Text style={styles.notesText}>
										{trackingOrder.order_additional_note}
									</Text>
								</View>
							</View>
						)}

						{/* Decorative bottom pattern */}
						<View style={styles.patternContainerBottom}>
							<View style={[styles.patternLine, styles.patternLeft]}></View>
							<View style={styles.patternCircle}></View>
							<View style={[styles.patternLine, styles.patternRight]}></View>
						</View>
					</View>

					{/* Action buttons with vibrant styling */}
					<View style={styles.actionsContainer}>
						{canCancelOrder() && (
							<LinearGradient
								colors={['#FF6B6B', '#E74C3C']}
								style={styles.gradientButton}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
							>
								<Button
									text={t('cancelOrder')}
									onPress={handleCancelOrder}
									backgroundColor="transparent"
									loading={isCancelling}
									style={styles.cancelButton}
									textStyle={styles.buttonText}
								/>
							</LinearGradient>
						)}

						<LinearGradient
							colors={
								trackingOrder.order_status === 'delivered'
									? ['#66BB6A', '#4CAF50']
									: ['#FFA779', '#FF9F67']
							}
							style={styles.gradientButton}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
						>
							<Button
								text={
									trackingOrder?.order_status === 'delivered'
										? t('feedbackOrder')
										: t('backToHome')
								}
								onPress={() => {
									if (trackingOrder?.order_status === 'delivered') {
										router.navigate('/(home)/order/(checkout)/feedback')
									} else if (trackingOrder.order_status === 'cancelled') {
										router.navigate('/(home)/product') // go to home
									} else if (trackingOrder.order_status === 'pending') {
										router.navigate('/(home)/product') // go to home
									}
								}}
								backgroundColor="transparent"
								style={styles.backToHomeButton}
								textStyle={styles.buttonText}
							/>
						</LinearGradient>
					</View>

					{/* Bottom spacing */}
					<View style={styles.bottomSpacer} />
				</ScrollView>
			)}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FCF9F6', // Subtle cream background
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
		color: '#C67C4E', // Resilient brown
		letterSpacing: 0.5,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F9F5F0',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		fontFamily: 'Inter-Medium',
		color: '#FF9F67',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
		backgroundColor: '#F9F5F0',
	},
	errorText: {
		fontSize: 16,
		fontFamily: 'Inter-Medium',
		color: '#5D4037',
		textAlign: 'center',
		marginVertical: 16,
	},
	content: {
		flex: 1,
		padding: 16,
	},
	statusCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 24,
		padding: 20,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
		borderLeftWidth: 0, // Remove the left border for a cleaner look
	},
	patternContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 20,
	},
	patternContainerBottom: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 20,
	},
	patternLine: {
		flex: 1,
		height: 1,
		backgroundColor: '#F0E4D7', // Subtle neutral color
	},
	patternLeft: {
		marginRight: 10,
	},
	patternRight: {
		marginLeft: 10,
	},
	patternCircle: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#FF9F67', // Orange accent
	},
	statusHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	orderIdContainer: {
		flexDirection: 'column',
	},
	orderIdLabel: {
		fontSize: 13,
		fontFamily: 'Inter-Medium',
		color: '#9E9E9E',
		marginBottom: 4,
	},
	orderId: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E', // Resilient brown
		letterSpacing: 0.5,
	},
	statusBadge: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 100,
	},
	statusText: {
		fontSize: 13,
		fontFamily: 'Inter-Medium',
		letterSpacing: 0.3,
	},
	progressContainer: {
		marginVertical: 20,
	},
	progressTrack: {
		height: 6,
		backgroundColor: '#F5F5F5',
		borderRadius: 3,
		marginBottom: 24,
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		borderRadius: 3,
	},
	statusIconContainer: {
		alignItems: 'center',
	},
	statusIconCircle: {
		width: 60,
		height: 60,
		borderRadius: 30,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 10,
	},
	iconShadow: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 6,
	},
	statusIconInner: {
		textShadowColor: 'rgba(0,0,0,0.2)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
	statusDescription: {
		fontSize: 16,
		fontFamily: 'Inter-Medium',
		color: '#424242',
		textAlign: 'center',
		lineHeight: 22,
	},
	deliveryTimeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		marginVertical: 20,
		backgroundColor: '#EFF8F1', // Light green background
	},
	deliveryTimeIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
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
		marginLeft: 4,
		fontSize: 15,
		fontFamily: 'Inter-Medium',
		color: '#424242',
		flex: 1,
		lineHeight: 22,
	},
	orderDetailsContainer: {
		marginTop: 24,
		paddingTop: 24,
		borderTopWidth: 1,
		borderTopColor: '#F5F5F5',
	},
	sectionTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E', // Resilient brown
		marginBottom: 16,
		letterSpacing: 0.4,
	},
	orderInfoRow: {
		flexDirection: 'row',
		marginBottom: 20,
		alignItems: 'flex-start',
		justifyContent: 'space-between',
	},
	orderInfoLabelContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '50%',
	},
	infoIcon: {
		marginRight: 8,
		marginTop: 1,
		color: '#7CA982', // Resilient green
	},
	orderInfoLabel: {
		fontSize: 15,
		fontFamily: 'Inter-Regular',
		color: '#8E8E93',
	},
	orderInfoValue: {
		fontSize: 15,
		fontFamily: 'Inter-Medium',
		color: '#474747',
		flex: 1,
		textAlign: 'right',
	},
	highlightedText: {
		fontFamily: 'Inter-SemiBold',
		color: '#FF9F67', // Orange highlight
	},
	paymentStatusContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	paymentStatusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 6,
	},
	paymentStatusText: {
		fontSize: 15,
		fontFamily: 'Inter-SemiBold',
	},
	orderItemsContainer: {
		marginTop: 24,
		paddingTop: 24,
		borderTopWidth: 1,
		borderTopColor: '#F5F5F5',
	},
	orderItem: {
		flexDirection: 'row',
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#F5F5F5',
	},
	itemImageWrapper: {
		width: 70,
		height: 70,
		borderRadius: 12,
		overflow: 'hidden',
		marginRight: 16,
		backgroundColor: '#FFFFFF',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	itemImage: {
		width: '100%',
		height: '100%',
	},
	itemDetails: {
		flex: 1,
		justifyContent: 'space-between',
	},
	itemName: {
		fontSize: 16,
		fontFamily: 'Inter-Medium',
		color: '#212121',
		marginBottom: 4,
	},
	itemSize: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#9E9E9E',
		marginBottom: 8,
	},
	itemPriceRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	itemPrice: {
		fontSize: 15,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E', // Resilient brown
	},
	quantityContainer: {
		backgroundColor: '#F8F1FF', // Light purple/pink background
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 4,
	},
	itemQuantity: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#9C6ADE', // Purple/pink accent
	},
	orderSummaryContainer: {
		marginTop: 24,
		paddingTop: 24,
		borderTopWidth: 1,
		borderTopColor: '#F5F5F5',
	},
	summaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 14,
	},
	summaryLabel: {
		fontSize: 15,
		fontFamily: 'Inter-Regular',
		color: '#9E9E9E',
	},
	summaryValue: {
		fontSize: 15,
		fontFamily: 'Inter-Medium',
		color: '#424242',
	},
	discountValue: {
		fontSize: 15,
		fontFamily: 'Inter-Medium',
		color: '#E74C3C',
	},
	divider: {
		height: 1,
		backgroundColor: '#F5F5F5',
		marginVertical: 14,
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 6,
	},
	totalLabel: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#212121',
	},
	totalValue: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E', // Resilient brown
	},
	notesContainer: {
		marginTop: 24,
		paddingTop: 24,
		borderTopWidth: 1,
		borderTopColor: '#F5F5F5',
	},
	notesTextContainer: {
		padding: 16,
		borderRadius: 12,
		backgroundColor: '#FFF0F7', // Light pink background
	},
	notesText: {
		fontSize: 15,
		fontFamily: 'Inter-Regular',
		color: '#424242',
		lineHeight: 22,
	},
	actionsContainer: {
		marginTop: 16,
		gap: 16,
	},
	gradientButton: {
		borderRadius: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	cancelButton: {
		width: '100%',
		borderRadius: 16,
		backgroundColor: 'transparent',
	},
	backToHomeButton: {
		width: '100%',
		borderRadius: 16,
		backgroundColor: 'transparent',
	},
	buttonText: {
		fontFamily: 'Inter-SemiBold',
		color: '#FFFFFF',
		fontSize: 16,
	},
	actionButton: {
		marginTop: 20,
		backgroundColor: '#7CA982', // Resilient green
	},
	bottomSpacer: {
		height: 40,
	},
})
