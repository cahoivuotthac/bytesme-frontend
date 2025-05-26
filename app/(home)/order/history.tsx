import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
	Animated,
	View,
	Text,
	StyleSheet,
	ScrollView,
	SafeAreaView,
	TouchableOpacity,
	TouchableWithoutFeedback,
	ActivityIndicator,
	FlatList,
	RefreshControl,
	Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useTranslation } from '@/providers/locale'
import { useAlert } from '@/hooks/useAlert'
import { cartAPI, orderAPI } from '@/utils/api'
import { formatPrice, formatDateTime } from '@/utils/display'
import DishDecoration from '@/components/shared/DishDecoration'
import DatePickerModal from '@/components/shared/DatePickerModal'

// Updated Order status types to match API
type OrderStatus = 'pending' | 'delivering' | 'delivered' | 'cancelled'

// Tab types
type TabType = 'current' | 'history'

// Filter types for current orders
type FilterType = 'all' | 'pending' | 'delivering' | 'delivered'

// Updated Order interface to match real API response
interface Order {
	order_id: number
	status: OrderStatus
	created_at: string
	total_price: number
	payment_method: string
	deliver_address: string
	items_count: number
	did_feedback: true
	items: OrderItem[]
}

// Updated Order item interface to match real API response
interface OrderItem {
	product_id: number
	product_name: string
	product_category_id: number
	quantity: number
	size: string
	unit_price: number
	image_url: string
}

// API Response interface
interface OrderHistoryResponse {
	orders: Order[]
	has_more: boolean
	offset: string
	limit: string
}

const STATUS_ICONS: Record<OrderStatus, string> = {
	pending: 'timer-outline',
	delivering: 'bicycle-outline',
	delivered: 'checkmark-circle-outline',
	cancelled: 'close-circle-outline',
}

export default function OrderHistoryScreen() {
	const { t, locale } = useTranslation()
	const { AlertComponent, showInfo, showError, showSuccess } = useAlert()

	// State
	const [activeTab, setActiveTab] = useState<TabType>('current')
	const [selectedFilter, setSelectedFilter] = useState<FilterType>('all')
	const [orders, setOrders] = useState<Order[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [hasMoreOrders, setHasMoreOrders] = useState(true)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [currentOffset, setCurrentOffset] = useState(0)
	const [fromDate, setFromDate] = useState<Date | null>(null)
	const [toDate, setToDate] = useState<Date | null>(null)
	const [showFromPicker, setShowFromPicker] = useState(false)
	const [showToPicker, setShowToPicker] = useState(false)

	const FOOD_CATEGORY_IDS = new Set([1, 3, 4, 5, 6, 7, 8, 9])

	// Animated scale for order cards
	const scale = useRef(new Animated.Value(1)).current

	const pageSize = 10

	// Fetch orders from API
	const fetchOrders = useCallback(
		async (offset: number = 0, refresh: boolean = false) => {
			try {
				if (refresh) {
					setIsRefreshing(true)
					setCurrentOffset(0)
					setHasMoreOrders(true)
				} else if (offset === 0) {
					setIsLoading(true)
				} else {
					setIsLoadingMore(true)
				}

				const response = await orderAPI.getOrderHistory(offset, pageSize)
				const data: OrderHistoryResponse = response.data
				const newOrders = data.orders || []

				if (refresh || offset === 0) {
					setOrders(newOrders)
				} else {
					setOrders((prevOrders) => [...prevOrders, ...newOrders])
				}

				setHasMoreOrders(data.has_more)
				setCurrentOffset(offset + newOrders.length)
			} catch (error) {
				console.error('Error fetching orders:', error)
				showError(t('errorLoadingOrders'))
			} finally {
				setIsLoading(false)
				setIsRefreshing(false)
				setIsLoadingMore(false)
			}
		},
		[t, showError]
	)

	// Initial load
	useEffect(() => {
		fetchOrders(0)
	}, [fetchOrders])

	// Handle refresh
	const handleRefresh = useCallback(() => {
		fetchOrders(0, true)
	}, [fetchOrders])

	// Handle load more
	const handleLoadMore = useCallback(() => {
		if (!isLoadingMore && hasMoreOrders) {
			fetchOrders(currentOffset)
		}
	}, [fetchOrders, isLoadingMore, hasMoreOrders, currentOffset])

	// Filter orders based on active tab, selected filter, and date range
	const filteredOrders = orders.filter((order) => {
		if (activeTab === 'current') {
			// Current orders: pending, delivering
			const isCurrentOrder = ['pending', 'delivering'].includes(order.status)
			if (!isCurrentOrder) return false

			if (selectedFilter === 'all') return true
			return order.status === selectedFilter
		} else {
			// History: delivered, cancelled
			const isHistory = ['delivered', 'cancelled'].includes(order.status)
			if (!isHistory) return false
			if (fromDate && new Date(order.created_at) < fromDate) return false
			if (toDate && new Date(order.created_at) > toDate) return false
			return true
		}
	})

	// Handle feedback
	const handleFeedback = (orderId: number) => {
		router.push({
			pathname: '/(home)/order/(checkout)/feedback',
			params: {
				orderId: orderId.toString(),
				navigateBackToPath: '/(home)/order/history',
			},
		})
	}

	// Handle reorder
	const handleReorder = async (orderId: number) => {
		cartAPI.addItemsFromOrder(orderId, {
			onSuccess: () => {
				showSuccess(t('orderReorderSuccess'), () => {
					router.navigate('/(home)/(profile)/cart')
				})
			},
			onCartItemExists: () => {
				showInfo(t('cartAlreadyOccupied'))
			},
			onOrderNotFound: (orderId) => {
				showError(t('orderNotFound'))
			},
			onProductNotFound: (productId, productName) => {
				showError(
					t('productNotFoundInOrder').replace('{productName}', productName)
				)
			},
			onItemOutOfStock: (productId, productName) => {
				showError(
					t('itemOutOfStockInOrder').replace('{productName}', productName)
				)
			},
			onError: (err) => {
				showError(t('errorReordering'))
			},
		})
	}

	// Navigate to order tracking
	const navigateToTracking = (orderId: number) => {
		router.push({
			pathname: '/(home)/order/(checkout)/tracking',
			params: { orderId: orderId.toString() },
		})
	}

	const navigateToDetails = (orderId: number) => {
		router.push({
			pathname: '/(home)/order/[id]',
			params: { id: orderId.toString() },
		})
	}

	// Get main product name from order items
	const getMainProductName = (items: OrderItem[]) => {
		return items[0]?.product_name || 'Product'
	}

	// Count total items in order
	const getTotalItems = (items: OrderItem[]) => {
		return items.reduce((total, item) => total + item.quantity, 0)
	}

	const getProductClassification = (items: OrderItem[]) => {
		const hasFood = items.some((item) =>
			FOOD_CATEGORY_IDS.has(item.product_category_id)
		)
		const hasBeverage = items.some(
			(item) => !FOOD_CATEGORY_IDS.has(item.product_category_id)
		)

		if (hasFood && hasBeverage) return t('foodAndDrink')
		if (hasFood) return t('food')
		return t('drink')
	}

	// Render filter chips for current orders
	const renderFilterChips = () => {
		if (activeTab !== 'current') return null

		return (
			<View style={styles.filterContainer}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filterScrollContent}
				>
					<TouchableOpacity
						style={[
							styles.filterChip,
							selectedFilter === 'all' && styles.filterChipActive,
						]}
						onPress={() => setSelectedFilter('all')}
					>
						<Text
							style={[
								styles.filterChipText,
								selectedFilter === 'all' && styles.filterChipTextActive,
							]}
						>
							{t('all')}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.filterChip,
							selectedFilter === 'pending' && styles.filterChipActive,
						]}
						onPress={() => setSelectedFilter('pending')}
					>
						<Text
							style={[
								styles.filterChipText,
								selectedFilter === 'pending' && styles.filterChipTextActive,
							]}
						>
							{t('pending')}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.filterChip,
							selectedFilter === 'delivering' && styles.filterChipActive,
						]}
						onPress={() => setSelectedFilter('delivering')}
					>
						<Text
							style={[
								styles.filterChipText,
								selectedFilter === 'delivering' && styles.filterChipTextActive,
							]}
						>
							{t('delivering')}
						</Text>
					</TouchableOpacity>

					{/* <TouchableOpacity
						style={[
							styles.filterChip,
							selectedFilter === 'delivered' && styles.filterChipActive,
						]}
						onPress={() => setSelectedFilter('delivered')}
					>
						<Text
							style={[
								styles.filterChipText,
								selectedFilter === 'delivered' && styles.filterChipTextActive,
							]}
						>
							Đã giao
						</Text>
					</TouchableOpacity> */}
				</ScrollView>
			</View>
		)
	}

	// Date range filter bar for history tab
	const renderDateRangeFilter = () => {
		if (activeTab !== 'history') return null

		const hasDateFilters = fromDate !== null || toDate !== null

		return (
			<View style={styles.dateFilterContainer}>
				<View style={styles.datePickersRow}>
					<TouchableOpacity
						onPress={() => setShowFromPicker(true)}
						style={styles.datePickerButton}
					>
						<Ionicons
							name="calendar-outline"
							size={18}
							color="#B76245"
							style={{ marginRight: 4 }}
						/>
						<Text style={styles.datePickerText}>
							{fromDate
								? formatDateTime(fromDate.toISOString(), locale).split(' ')[0]
								: t('fromDate')}
						</Text>
					</TouchableOpacity>
					<Ionicons
						name="arrow-forward"
						size={18}
						color="#B76245"
						style={{ marginHorizontal: 4 }}
					/>
					<TouchableOpacity
						onPress={() => setShowToPicker(true)}
						style={styles.datePickerButton}
					>
						<Text style={styles.datePickerText}>
							{toDate
								? formatDateTime(toDate.toISOString(), locale).split(' ')[0]
								: t('toDate')}
						</Text>
					</TouchableOpacity>
				</View>

				{hasDateFilters && (
					<TouchableOpacity
						style={styles.clearDateButton}
						onPress={() => {
							setFromDate(null)
							setToDate(null)
						}}
					>
						<Ionicons name="close-circle" size={18} color="#B76245" />
						<Text style={styles.clearDateText}>{t('clear')}</Text>
					</TouchableOpacity>
				)}

				<DatePickerModal
					visible={showFromPicker}
					onClose={() => setShowFromPicker(false)}
					onSelect={(date) => {
						setFromDate(date)
						setShowFromPicker(false)
					}}
					currentDate={fromDate || new Date()}
					maxDate={toDate || undefined}
					locale={locale}
				/>

				<DatePickerModal
					visible={showToPicker}
					onClose={() => setShowToPicker(false)}
					onSelect={(date) => {
						setToDate(date)
						setShowToPicker(false)
					}}
					currentDate={toDate || new Date()}
					minDate={fromDate || undefined}
					locale={locale}
				/>
			</View>
		)
	}

	// Render individual order card
	const renderOrderCard = ({ item: order }: { item: Order }) => {
		const isCurrentOrder = ['pending', 'delivering'].includes(order.status)

		// Determine card background color based on status
		const cardBackgroundColor = isCurrentOrder ? '#B76245' : '#3B9256'

		// Get first 3 items for the image display
		const displayItems = order.items.slice(0, 3)
		const extraItemsCount = Math.max(0, order.items.length - 3)

		const statusIconName = STATUS_ICONS[order.status] || 'help-circle-outline'

		const onPressIn = () => {
			Animated.spring(scale, {
				toValue: 0.95,
				useNativeDriver: true,
			}).start()
		}

		const onPressOut = () => {
			Animated.spring(scale, {
				toValue: 1,
				useNativeDriver: true,
			}).start()
		}

		const onPress = () => {
			navigateToDetails(order.order_id)
		}

		return (
			<TouchableWithoutFeedback
				onPress={onPress}
				onPressIn={onPressIn}
				onPressOut={onPressOut}
			>
				<Animated.View
					style={[
						styles.orderCard,
						{ backgroundColor: cardBackgroundColor },
						{
							transform: [{ scale }],
						},
					]}
				>
					{/* Order items image display */}
					<View style={styles.orderImagesRow}>
						<View style={styles.orderImagesInfo}>
							<View style={styles.orderImagesCompound}>
								{displayItems.map((item, index) => (
									<View
										key={`${item.product_id}-${index}`}
										style={[styles.dishImageContainer, { zIndex: 3 - index }]}
									>
										<DishDecoration
											imageSource={{ uri: item.image_url }}
											size={index === 0 ? 100 : 85}
											adjustForBowl={false}
											imageScale={1}
											containerStyle={{ backgroundColor: '#FFFFFF' }}
										/>
									</View>
								))}
								{extraItemsCount > 0 && (
									<View style={styles.extraItemsBadge}>
										<Text style={styles.extraItemsText}>
											+{extraItemsCount}
										</Text>
									</View>
								)}
							</View>
						</View>

						{/* Order ID and Date */}
						<View style={styles.orderIdAndDate}>
							<Text style={[styles.orderNumber]}>#{order.order_id}</Text>
							<Text style={styles.orderDate}>
								{formatDateTime(order.created_at, locale)}
							</Text>
						</View>
					</View>

					{/* Order content - name, type, price */}
					<View style={styles.cardMiddleRow}>
						<View style={styles.orderContent}>
							<Text style={styles.orderName} numberOfLines={1}>
								{getMainProductName(order.items)}
								{order.items.length > 1 ? '...' : ''}
							</Text>
							<Text style={styles.orderType}>
								{getProductClassification(order.items)}
							</Text>
							<Text style={styles.orderPrice}>
								{formatPrice(order.total_price, locale)} ({order.items_count}{' '}
								{t('items')})
							</Text>
						</View>
					</View>
					<View style={styles.cardFooterRow}>
						<View style={styles.statusIconContainer}>
							<View style={styles.statusIconCircle}>
								<Ionicons
									name={statusIconName as any}
									size={28}
									color="#000000"
								/>
							</View>
						</View>
						<View style={styles.actionButtonContainer}>
							<TouchableOpacity
								style={[styles.actionButton, { backgroundColor: '#EA5982' }]}
								onPress={() => {
									if (isCurrentOrder) {
										navigateToTracking(order.order_id)
									} else {
										if (order.did_feedback) {
											handleReorder(order.order_id)
										} else {
											handleFeedback(order.order_id)
										}
									}
								}}
							>
								<Text style={styles.actionButtonText}>
									{isCurrentOrder
										? t('followOrder')
										: order.did_feedback
										? t('orderAgain')
										: t('giveFeedback')}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Animated.View>
			</TouchableWithoutFeedback>
		)
	}

	// Render empty state
	const renderEmptyState = () => (
		<View style={styles.emptyState}>
			<Ionicons name="receipt-outline" size={64} color="#C0C0C0" />
			<Text style={styles.emptyStateText}>
				{activeTab === 'current' ? t('noRecentOrders') : t('noHistoryOrders')}
			</Text>
		</View>
	)

	// Render loading footer
	const renderLoadingFooter = () => {
		if (!isLoadingMore) return null
		return (
			<View style={styles.loadingFooter}>
				<ActivityIndicator size="small" color="#C67C4E" />
			</View>
		)
	}

	return (
		<LinearGradient colors={['#F6F1E8', '#F8F8F8']} style={{ flex: 1 }}>
			<SafeAreaView
				style={[styles.container, { backgroundColor: 'transparent' }]}
			>
				{AlertComponent}

				{/* Header */}
				<View style={styles.headerSection}>
					<TouchableOpacity
						style={styles.backCircle}
						onPress={() => router.back()}
					>
						<Ionicons name="arrow-back" size={24} color="#fff" />
					</TouchableOpacity>
					<Text style={styles.headerTitleModern}>{t('orderHistory')}</Text>
				</View>

				{/* Tab navigation with underline */}
				<View style={styles.tabRow}>
					<TouchableOpacity
						style={styles.tabModern}
						onPress={() => setActiveTab('current')}
					>
						<Text
							style={[
								styles.tabModernText,
								activeTab === 'current' && styles.tabModernTextActive,
							]}
						>
							Hiện tại
						</Text>
						{activeTab === 'current' && <View style={styles.tabUnderline} />}
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.tabModern}
						onPress={() => setActiveTab('history')}
					>
						<Text
							style={[
								styles.tabModernText,
								activeTab === 'history' && styles.tabModernTextActive,
							]}
						>
							{t('history')}
						</Text>
						{activeTab === 'history' && <View style={styles.tabUnderline} />}
					</TouchableOpacity>
				</View>

				{/* Date range filter for history tab */}
				{renderDateRangeFilter()}

				{/* Filter chips */}
				{renderFilterChips()}

				{/* Orders list */}
				{isLoading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color="#C67C4E" />
						<Text style={styles.loadingText}>{t('loadingOrders')}</Text>
					</View>
				) : (
					<FlatList
						data={filteredOrders}
						renderItem={renderOrderCard}
						keyExtractor={(item) => item.order_id.toString()}
						contentContainerStyle={styles.ordersList}
						showsVerticalScrollIndicator={false}
						refreshControl={
							<RefreshControl
								refreshing={isRefreshing}
								onRefresh={handleRefresh}
								colors={['#C67C4E']}
								tintColor="#C67C4E"
							/>
						}
						onEndReached={handleLoadMore}
						onEndReachedThreshold={0.1}
						ListEmptyComponent={renderEmptyState}
						ListFooterComponent={renderLoadingFooter}
					/>
				)}
			</SafeAreaView>
		</LinearGradient>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F8F8F8',
	},
	headerContent: {
		paddingTop: Platform.OS === 'ios' ? 8 : 16,
		paddingBottom: 16,
		paddingHorizontal: 20,
		borderBottomLeftRadius: 15,
		borderBottomRightRadius: 15,
	},
	orderImagesCompound: {
		flexDirection: 'row',
		left: -5, // Overflow order card
		top: -50,
		alignItems: 'center',
		justifyContent: 'flex-start',
		gap: -30, // Overlap images
		marginRight: 20, // Space for extra items badge
	},
	headerSection: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: 24,
		paddingBottom: 12,
		backgroundColor: 'transparent',
	},
	backCircle: {
		width: 35,
		height: 35,
		borderRadius: 20,
		backgroundColor: '#C89B7B',
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		left: 20,
		zIndex: 2,
	},
	headerTitleModern: {
		flex: 1,
		textAlign: 'center',
		fontFamily: 'Inter-Bold',
		fontSize: 22,
		color: '#222',
		letterSpacing: 0.1,
	},
	tabRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'flex-end',
		backgroundColor: 'transparent',
		borderBottomWidth: 1,
		borderBottomColor: '#F0E8DE',
		marginBottom: 4,
		marginTop: 0,
		paddingHorizontal: 0,
		paddingBottom: 0,
	},
	tabModern: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 8,
		backgroundColor: 'transparent',
		position: 'relative',
		overflow: 'visible',
	},
	tabModernText: {
		fontFamily: 'Inter-Bold',
		fontSize: 15,
		color: '#A6A6A6',
		flexShrink: 1, // Added to allow text to shrink if needed
		flexWrap: 'wrap', // Added to wrap text
		textAlign: 'center', // Added to center text
	},
	tabModernTextActive: {
		color: '#FF8500',
	},
	tabUnderline: {
		height: 3,
		borderRadius: 2,
		backgroundColor: '#FF8500',
		width: 40,
		marginTop: 4,
	},
	filterContainer: {
		marginTop: 16,
		marginHorizontal: 20,
		marginBottom: 16,
	},
	filterScrollContent: {
		paddingRight: 20,
	},
	filterChip: {
		paddingHorizontal: 20,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 100,
		backgroundColor: '#FFFFFF',
		marginRight: 12,
	},
	filterChipActive: {
		backgroundColor: '#55C8F2',
	},
	filterChipText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#9E9E9E',
	},
	filterChipTextActive: {
		color: '#FFFFFF',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#9E9E9E',
	},
	ordersList: {
		marginTop: 20,
		padding: 20,
		paddingTop: 20,
		paddingBottom: 100,
		gap: 40,
	},
	orderCard: {
		borderRadius: 30,
		// padding: 20,
		paddingTop: 25,
		paddingHorizontal: 22,
		height: 240,
		marginBottom: 20,
		overflow: 'visible',
		// height: "40%"
	},
	orderImagesRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		height: 70,
		gap: 10,
	},
	orderImagesInfo: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start',
		maxWidth: '60%',
	},
	orderIdAndDate: {
		flexShrink: 0,
		alignItems: 'flex-end',
		paddingRight: 10,
	},
	orderNumber: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#FFFFFF',
		marginBottom: 4,
	},
	orderDate: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#FFFFFF',
		textAlign: 'right',
	},
	orderContent: {
		// marginBottom: 20,
	},
	orderName: {
		fontSize: 17,
		fontFamily: 'Inter-SemiBold',
		color: '#FFFFFF',
		marginBottom: 4,
		textAlign: 'left',
		// marginRight: 7,
	},
	orderType: {
		fontSize: 16,
		fontFamily: 'Inter-Regular',
		// color: 'rgba(255, 255, 255, 0.8)',
		color: '#F8BF40',
		marginBottom: 8,
	},
	orderPrice: {
		fontSize: 20,
		fontFamily: 'Inter-Bold',
		color: '#FFFFFF',
	},
	actionButtonContainer: {
		// marginBottom: 24,
		width: '40%',
		alignSelf: 'flex-end',
		// bottom: -70
		bottom: 25,
		// marginVertical: 'auto'
	},
	actionButton: {
		padding: 7,
		paddingVertical: 14,
		borderRadius: 25,
		justifyContent: 'center',
		alignItems: 'center',
	},
	actionButtonText: {
		fontSize: 14,
		fontFamily: 'Inter-Bold',
		color: '#FFFFFF',
		textAlign: 'center',
	},
	dishImageContainer: {
		marginLeft: -25,
		position: 'relative',
		top: -10,
		zIndex: 1,
		shadowColor: '#C89B7B',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.32,
		shadowRadius: 16,
		elevation: 16,
	},
	extraItemsBadge: {
		// position: 'absolute',
		top: 0,
		// right: -10,
		left: -20,
		backgroundColor: '#FFCC00',
		borderRadius: 15,
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'flex-start',
		zIndex: 10,
	},
	cardMiddleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 10,
		// marginBottom: 10,
	},
	cardFooterRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		// marginTop: 2,
		// marginBottom: -5
	},
	extraItemsText: {
		fontSize: 16,
		fontFamily: 'Inter-Bold',
		color: '#000000',
	},
	statusIconContainer: {
		// position: 'absolute',
		left: 40,
		bottom: -20,
	},
	statusIconCircle: {
		width: 50,
		height: 50,
		borderRadius: 30,
		borderWidth: 3,
		borderColor: '#FFFFFF',
		backgroundColor: '#FFCC00',
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyStateText: {
		fontSize: 16,
		fontFamily: 'Inter-Medium',
		color: '#9E9E9E',
		marginTop: 16,
		textAlign: 'center',
	},
	loadingFooter: {
		padding: 20,
		alignItems: 'center',
	},
	headerGradient: {
		paddingTop: Platform.OS === 'ios' ? 8 : 16,
		paddingBottom: 16,
		paddingHorizontal: 20,
		borderBottomLeftRadius: 15,
		borderBottomRightRadius: 15,
	},
	dateFilterContainer: {
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: 15,
		gap: 10,
	},
	datePickersRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	datePickerButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF8F0',
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 20,
	},
	datePickerText: {
		color: '#B76245',
		fontFamily: 'Inter-Medium',
		fontSize: 15,
	},
	clearDateButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFEBEE',
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 20,
	},
	clearDateText: {
		color: '#B76245',
		fontFamily: 'Inter-Medium',
		fontSize: 13,
		marginLeft: 4,
	},
})
