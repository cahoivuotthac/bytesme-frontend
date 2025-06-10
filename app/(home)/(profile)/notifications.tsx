import React, { useState, useEffect, useCallback } from 'react'
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
	Alert,
	Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from '@/providers/locale'
import { useAlert } from '@/hooks/useAlert'
import { notificationAPI, orderAPI } from '@/utils/api'
import { formatDistanceToNow } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import BottomSpacer from '@/components/shared/BottomSpacer'
import { LinearGradient } from 'expo-linear-gradient'
import { useBottomBarControl } from '@/providers/BottomBarControlProvider'

// Notification interfaces based on your Laravel backend
interface BaseNotification {
	id: string
	type: string
	notifiable_type: string
	notifiable_id: number
	read_at: string | null
	created_at: string
	updated_at: string
	data: any
}

interface OrderStatusNotificationData {
	order_id: number
	status: string
	message: string
	timestamp: string
	payment_method: string
}

interface OnlinePaymentNotificationData {
	order_id: number
	payment_status: string
	payment_method: string
	pay_urls: string | null
	timestamp: string
}

export default function NotificationsScreen() {
	const { t, locale } = useTranslation()
	const { AlertComponent, showError, showSuccess } = useAlert()
	const { setUnreadNotificationCount } =
		useBottomBarControl()

	const [notifications, setNotifications] = useState<BaseNotification[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all')

	// Animation values for notification items
	const fadeAnim = new Animated.Value(0)
	const slideAnim = new Animated.Value(20)

	useEffect(() => {
		fetchNotifications()
		// Animate in the screen
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 600,
				useNativeDriver: true,
			}),
			Animated.timing(slideAnim, {
				toValue: 0,
				duration: 600,
				useNativeDriver: true,
			}),
		]).start()
	}, [])

	const fetchNotifications = async () => {
		try {
			setIsLoading(true)
			const response = await notificationAPI.getNotifications()
			const fetchedNotifications = response.data.notifications || []
			setNotifications(fetchedNotifications)

			// Update bottom bar notification count
			const unreadCount = fetchedNotifications.filter(
				(n: BaseNotification) => !n.read_at
			).length
			setUnreadNotificationCount(unreadCount)
		} catch (error) {
			console.error('Error fetching notifications:', error)
			showError(t('errorFetchingNotifications'))
		} finally {
			setIsLoading(false)
		}
	}

	const onRefresh = useCallback(async () => {
		setIsRefreshing(true)
		await fetchNotifications()
		setIsRefreshing(false)
	}, [])

	const markAsRead = async (notificationId: string) => {
		try {
			await notificationAPI.markAsRead(notificationId)
			setNotifications((prev) => {
				const updated = prev.map((notification) =>
					notification.id === notificationId
						? { ...notification, read_at: new Date().toISOString() }
						: notification
				)

				// Update bottom bar notification count
				const unreadCount = updated.filter((n) => !n.read_at).length
				setUnreadNotificationCount(unreadCount)

				return updated
			})
		} catch (error) {
			console.error('Error marking notification as read:', error)
		}
	}

	const markAllAsRead = async () => {
		try {
			await notificationAPI.markAllAsRead()
			setNotifications((prev) => {
				const updated = prev.map((notification) => ({
					...notification,
					read_at: notification.read_at || new Date().toISOString(),
				}))

				// Update bottom bar notification count to 0
				setUnreadNotificationCount(0)

				return updated
			})
			showSuccess(t('allNotificationsMarkedRead'))
		} catch (error) {
			console.error('Error marking all notifications as read:', error)
			showError(t('errorMarkingAllRead'))
		}
	}

	const handleRemoveNotification = async (notificationId: string) => {
		try {
			await notificationAPI.deleteNotification(notificationId)
			setNotifications((prev) => {
				const updated = prev.filter(
					(notification) => notification.id !== notificationId
				)

				// Update bottom bar notification count
				const unreadCount = updated.filter((n) => !n.read_at).length
				setUnreadNotificationCount(unreadCount)

				return updated
			})
		} catch (error) {
			console.log('Error deleting notification:', error)
			showError(t('errorDeletingNotification'))
		}
	}

	const handleNotificationPress = async (notification: BaseNotification) => {
		// Mark as read if unread
		if (!notification.read_at) {
			await markAsRead(notification.id)
		}

		// Navigate based on notification type
		if (notification.type.includes('OrderStatusNotification')) {
			const data = notification.data as OrderStatusNotificationData
			switch (data.status) {
				case 'online_payment_pending':
					break
				default:
					router.push({
						pathname: '/(home)/order/(checkout)/tracking',
						params: {
							orderId: data.order_id,
						},
					})
					break
			}
		} else if (notification.type.includes('OnlinePaymentNotification')) {
			const data = notification.data as OnlinePaymentNotificationData
			const { order_status: orderStatus } = (
				await orderAPI.getOrderStatus(data.order_id)
			).data
			console.log('OnlinePaymentNotification notification data:', data)
			switch (data.payment_status) {
				case 'created':
					console.log('Order status: ', orderStatus)
					if (orderStatus === 'online_payment_pending') {
						router.push({
							pathname: '/(home)/order/(checkout)/online-payment-pending',
							params: {
								orderId: data.order_id,
								paymentMethodId: data.payment_method,
								payUrls: data.pay_urls,
							},
						})
					} else {
						router.push({
							pathname: '/(home)/order/(checkout)/tracking',
							params: {
								orderId: data.order_id,
							},
						})
					}
					break
				case 'success':
				case 'failed':
				default:
					break
			}
		}
	}

	const getNotificationIcon = (type: string) => {
		if (type.includes('OrderStatusNotification')) {
			return 'receipt'
		} else if (type.includes('OnlinePaymentNotification')) {
			return 'card'
		}
		return 'notifications'
	}

	const getNotificationColor = (type: string) => {
		if (type.includes('OrderStatusNotification')) {
			return {
				primary: '#C67C4E',
				light: '#FEF7ED',
				gradient: ['#C67C4E', '#E5A663'],
			}
		} else if (type.includes('OnlinePaymentNotification')) {
			return {
				primary: '#10B981',
				light: '#F0FDF4',
				gradient: ['#10B981', '#34D399'],
			}
		}
		return {
			primary: '#8B5CF6',
			light: '#F5F3FF',
			gradient: ['#8B5CF6', '#A78BFA'],
		}
	}

	const getNotificationTitle = (notification: BaseNotification) => {
		if (notification.type.includes('OrderStatusNotification')) {
			const data = notification.data as OrderStatusNotificationData
			return t('orderStatusUpdate')
		} else if (notification.type.includes('OnlinePaymentNotification')) {
			const data = notification.data as OnlinePaymentNotificationData
			return t('paymentUpdate')
		}
		return t('notification')
	}

	const getNotificationMessage = (notification: BaseNotification) => {
		if (notification.type.includes('OrderStatusNotification')) {
			const data = notification.data as OrderStatusNotificationData
			return data.message || t('orderStatusChanged')
		} else if (notification.type.includes('OnlinePaymentNotification')) {
			const data = notification.data as OnlinePaymentNotificationData
			const statusText =
				data.payment_status === 'success'
					? t('paymentSuccessful')
					: t('paymentPending')
			return `${statusText} - ${data.payment_method}`
		}
		return t('newNotification')
	}

	const getTimeAgo = (dateString: string) => {
		const date = new Date(dateString)
		const localeToUse = locale === 'vi' ? vi : enUS
		return formatDistanceToNow(date, { addSuffix: true, locale: localeToUse })
	}

	const filteredNotifications = notifications.filter((notification) => {
		if (selectedFilter === 'unread') {
			return !notification.read_at
		}
		return true
	})

	const unreadCount = notifications.filter((n) => !n.read_at).length

	const renderNotificationItem = ({
		item,
		index,
	}: {
		item: BaseNotification
		index: number
	}) => {
		const colors = getNotificationColor(item.type)

		return (
			<TouchableOpacity
				style={[
					styles.notificationItem,
					!item.read_at && styles.unreadNotification,
				]}
				onPress={() => handleNotificationPress(item)}
				activeOpacity={0.8}
			>
				<LinearGradient
					colors={
						!item.read_at ? ['#FFFFFF', colors.light] : ['#FFFFFF', '#FFFFFF']
					}
					style={styles.notificationGradient}
				>
					<View style={styles.notificationContent}>
						<View style={styles.notificationHeader}>
							<View
								style={[
									styles.iconContainer,
									{ backgroundColor: colors.light },
								]}
							>
								<LinearGradient
									colors={colors.gradient as [string, string]}
									style={styles.iconGradient}
								>
									<Ionicons
										name={getNotificationIcon(item.type) as any}
										size={20}
										color="#FFFFFF"
									/>
								</LinearGradient>
								{!item.read_at && <View style={styles.unreadDot} />}
							</View>

							<View style={styles.notificationText}>
								<View style={styles.titleRow}>
									<Text
										style={[
											styles.notificationTitle,
											!item.read_at && styles.unreadTitle,
										]}
									>
										{getNotificationTitle(item)}
									</Text>
									<Text style={styles.notificationTime}>
										{getTimeAgo(item.created_at)}
									</Text>
								</View>
								<Text style={styles.notificationMessage} numberOfLines={2}>
									{getNotificationMessage(item)}
								</Text>
							</View>

							<TouchableOpacity
								style={styles.deleteButton}
								onPress={() => handleRemoveNotification(item.id)}
								hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
							>
								<View style={styles.deleteIconContainer}>
									<Ionicons name="close" size={18} color="#9CA3AF" />
								</View>
							</TouchableOpacity>
						</View>
					</View>

					{!item.read_at && (
						<View
							style={[
								styles.unreadIndicator,
								{ backgroundColor: colors.primary },
							]}
						/>
					)}
				</LinearGradient>
			</TouchableOpacity>
		)
	}

	const renderEmptyState = () => (
		<View style={styles.emptyContainer}>
			<LinearGradient
				colors={['#F8FAFC', '#F1F5F9']}
				style={styles.emptyIconContainer}
			>
				<Ionicons name="notifications-outline" size={48} color="#94A3B8" />
			</LinearGradient>
			<Text style={styles.emptyTitle}>
				{selectedFilter === 'unread'
					? t('noUnreadNotifications')
					: t('noNotifications')}
			</Text>
			<Text style={styles.emptySubtitle}>
				{t('notificationsWillAppearHere')}
			</Text>
		</View>
	)

	if (isLoading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<View style={styles.loadingContent}>
						<ActivityIndicator size="large" color="#C67C4E" />
						<Text style={styles.loadingText}>{t('loadingNotifications')}</Text>
					</View>
				</View>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}

			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Text style={styles.headerTitle}>{t('notifications')}</Text>
					{unreadCount > 0 && (
						<View style={styles.unreadBadge}>
							<Text style={styles.unreadBadgeText}>{unreadCount}</Text>
						</View>
					)}
				</View>
				{unreadCount > 0 && (
					<TouchableOpacity
						style={styles.markAllReadButton}
						onPress={markAllAsRead}
					>
						<Ionicons name="checkmark-done" size={16} color="#C67C4E" />
						<Text style={styles.markAllReadText}>{t('markAllRead')}</Text>
					</TouchableOpacity>
				)}
			</View>

			{/* Filter Tabs */}
			<View style={styles.filterContainer}>
				<View style={styles.filterTabs}>
					<TouchableOpacity
						style={[
							styles.filterTab,
							selectedFilter === 'all' && styles.activeFilterTab,
						]}
						onPress={() => setSelectedFilter('all')}
					>
						<Text
							style={[
								styles.filterTabText,
								selectedFilter === 'all' && styles.activeFilterTabText,
							]}
						>
							{t('all')}
						</Text>
						<View
							style={[
								styles.filterTabBadge,
								selectedFilter === 'all' && styles.activeFilterTabBadge,
							]}
						>
							<Text
								style={[
									styles.filterTabBadgeText,
									selectedFilter === 'all' && styles.activeFilterTabBadgeText,
								]}
							>
								{notifications.length}
							</Text>
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.filterTab,
							selectedFilter === 'unread' && styles.activeFilterTab,
						]}
						onPress={() => setSelectedFilter('unread')}
					>
						<Text
							style={[
								styles.filterTabText,
								selectedFilter === 'unread' && styles.activeFilterTabText,
							]}
						>
							{t('unread')}
						</Text>
						<View
							style={[
								styles.filterTabBadge,
								selectedFilter === 'unread' && styles.activeFilterTabBadge,
							]}
						>
							<Text
								style={[
									styles.filterTabBadgeText,
									selectedFilter === 'unread' &&
										styles.activeFilterTabBadgeText,
								]}
							>
								{unreadCount}
							</Text>
						</View>
					</TouchableOpacity>
				</View>
			</View>

			{/* Notifications List */}
			<FlatList
				data={filteredNotifications}
				renderItem={renderNotificationItem}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContainer}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={onRefresh}
						colors={['#C67C4E']}
						tintColor="#C67C4E"
						progressBackgroundColor="#FFFFFF"
					/>
				}
				ListEmptyComponent={renderEmptyState}
				ListFooterComponent={<BottomSpacer height={100} />}
			/>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FAF8F5',
	},
	loadingContainer: {
		flex: 1,
		backgroundColor: '#FAF8F5',
	},
	loadingContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 20,
		fontSize: 16,
		fontFamily: 'Inter-Medium',
		color: '#8B7355',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 16,
		backgroundColor: '#FFFFFF',
		borderBottomWidth: 1,
		borderBottomColor: '#F1F1F1',
	},
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 24,
		fontFamily: 'Inter-Bold',
		color: '#2F2D2C',
		marginRight: 12,
	},
	unreadBadge: {
		backgroundColor: '#FF6B6B',
		borderRadius: 20,
		paddingHorizontal: 8,
		paddingVertical: 4,
		minWidth: 24,
		height: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},
	unreadBadgeText: {
		fontSize: 12,
		fontFamily: 'Inter-Bold',
		color: '#FFFFFF',
	},
	markAllReadButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 12,
		backgroundColor: 'rgba(198, 124, 78, 0.1)',
		borderRadius: 20,
		gap: 6,
	},
	markAllReadText: {
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E',
	},
	filterContainer: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: '#FFFFFF',
		borderBottomWidth: 1,
		borderBottomColor: '#F1F1F1',
	},
	filterTabs: {
		flexDirection: 'row',
		backgroundColor: '#F8F8F8',
		borderRadius: 12,
		padding: 4,
	},
	filterTab: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 8,
		gap: 8,
	},
	activeFilterTab: {
		backgroundColor: '#C67C4E',
	},
	filterTabText: {
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#8B7355',
	},
	activeFilterTabText: {
		color: '#FFFFFF',
	},
	filterTabBadge: {
		backgroundColor: '#E5E5E5',
		borderRadius: 12,
		paddingHorizontal: 8,
		paddingVertical: 2,
		minWidth: 20,
		height: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	activeFilterTabBadge: {
		backgroundColor: 'rgba(255, 255, 255, 0.25)',
	},
	filterTabBadgeText: {
		fontSize: 11,
		fontFamily: 'Inter-Bold',
		color: '#8B7355',
	},
	activeFilterTabBadgeText: {
		color: '#FFFFFF',
	},
	listContainer: {
		paddingTop: 16,
		paddingHorizontal: 20,
		flexGrow: 1,
	},
	notificationItem: {
		marginBottom: 12,
		borderRadius: 16,
		overflow: 'hidden',
		backgroundColor: '#FFFFFF',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 2,
	},
	unreadNotification: {
		backgroundColor: '#FFF9F5',
		borderLeftWidth: 4,
		borderLeftColor: '#C67C4E',
	},
	notificationGradient: {
		position: 'relative',
	},
	notificationContent: {
		padding: 16,
	},
	notificationHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	iconContainer: {
		position: 'relative',
		marginRight: 12,
		borderRadius: 12,
		padding: 8,
	},
	iconGradient: {
		width: 32,
		height: 32,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	unreadDot: {
		position: 'absolute',
		top: 4,
		right: 4,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#FF6B6B',
		borderWidth: 2,
		borderColor: '#FFFFFF',
	},
	notificationText: {
		flex: 1,
		marginRight: 12,
	},
	titleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	notificationTitle: {
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#2F2D2C',
		flex: 1,
		marginRight: 8,
	},
	unreadTitle: {
		color: '#1A1A1A',
	},
	notificationTime: {
		fontSize: 11,
		fontFamily: 'Inter-Medium',
		color: '#9B9B9B',
	},
	notificationMessage: {
		fontSize: 13,
		fontFamily: 'Inter-Regular',
		color: '#6B6B6B',
		lineHeight: 18,
	},
	deleteButton: {
		padding: 4,
	},
	deleteIconContainer: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: '#F8F8F8',
		justifyContent: 'center',
		alignItems: 'center',
	},
	unreadIndicator: {
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		width: 3,
		borderTopRightRadius: 2,
		borderBottomRightRadius: 2,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
		paddingTop: 60,
	},
	emptyIconContainer: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: '#F8F8F8',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	emptyTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#2F2D2C',
		marginBottom: 8,
		textAlign: 'center',
	},
	emptySubtitle: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#8B7355',
		textAlign: 'center',
		lineHeight: 20,
		maxWidth: 280,
	},
})
