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
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from '@/providers/locale'
import { useAlert } from '@/hooks/useAlert'
import { notificationAPI, orderAPI } from '@/utils/api'
import { formatDistanceToNow } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import BottomSpacer from '@/components/shared/BottomSpacer'

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

	const [notifications, setNotifications] = useState<BaseNotification[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all')

	useEffect(() => {
		fetchNotifications()
	}, [])

	const fetchNotifications = async () => {
		try {
			setIsLoading(true)
			const response = await notificationAPI.getNotifications()
			setNotifications(response.data.notifications || [])
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
			setNotifications((prev) =>
				prev.map((notification) =>
					notification.id === notificationId
						? { ...notification, read_at: new Date().toISOString() }
						: notification
				)
			)
		} catch (error) {
			console.error('Error marking notification as read:', error)
		}
	}

	const markAllAsRead = async () => {
		try {
			await notificationAPI.markAllAsRead()
			setNotifications((prev) =>
				prev.map((notification) => ({
					...notification,
					read_at: notification.read_at || new Date().toISOString(),
				}))
			)
			showSuccess(t('allNotificationsMarkedRead'))
		} catch (error) {
			console.error('Error marking all notifications as read:', error)
			showError(t('errorMarkingAllRead'))
		}
	}

	const handleRemoveNotification = async (notificationId: string) => {
		try {
			await notificationAPI.deleteNotification(notificationId)
			setNotifications((prev) =>
				prev.filter((notification) => notification.id !== notificationId)
			)
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
			return 'receipt-outline'
		} else if (type.includes('OnlinePaymentNotification')) {
			return 'card-outline'
		}
		return 'notifications-outline'
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

	const renderNotificationItem = ({ item }: { item: BaseNotification }) => (
		<TouchableOpacity
			style={[
				styles.notificationItem,
				!item.read_at && styles.unreadNotification,
			]}
			onPress={() => handleNotificationPress(item)}
			activeOpacity={0.7}
		>
			<View style={styles.notificationContent}>
				<View style={styles.notificationHeader}>
					<View style={styles.iconContainer}>
						<Ionicons
							name={getNotificationIcon(item.type) as any}
							size={24}
							color={!item.read_at ? '#C67C4E' : '#8B7355'}
						/>
						{!item.read_at && <View style={styles.unreadDot} />}
					</View>

					<View style={styles.notificationText}>
						<Text
							style={[
								styles.notificationTitle,
								!item.read_at && styles.unreadTitle,
							]}
						>
							{getNotificationTitle(item)}
						</Text>
						<Text style={styles.notificationMessage} numberOfLines={2}>
							{getNotificationMessage(item)}
						</Text>
						<Text style={styles.notificationTime}>
							{getTimeAgo(item.created_at)}
						</Text>
					</View>

					<TouchableOpacity
						style={styles.deleteButton}
						onPress={() => handleRemoveNotification(item.id)}
						hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
					>
						<Ionicons name="close" size={20} color="#9B9B9B" />
					</TouchableOpacity>
				</View>
			</View>
		</TouchableOpacity>
	)

	const renderEmptyState = () => (
		<View style={styles.emptyContainer}>
			<Ionicons name="notifications-outline" size={64} color="#CCCCCC" />
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
					<ActivityIndicator size="large" color="#C67C4E" />
					<Text style={styles.loadingText}>{t('loadingNotifications')}</Text>
				</View>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}

			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.headerTitle}>{t('notifications')}</Text>
				{unreadCount > 0 && (
					<TouchableOpacity
						style={styles.markAllReadButton}
						onPress={markAllAsRead}
					>
						<Text style={styles.markAllReadText}>{t('markAllRead')}</Text>
					</TouchableOpacity>
				)}
			</View>

			{/* Filter Tabs */}
			<View style={styles.filterContainer}>
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
						{t('all')} ({notifications.length})
					</Text>
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
						{t('unread')} ({unreadCount})
					</Text>
				</TouchableOpacity>
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
					/>
				}
				ListEmptyComponent={renderEmptyState}
				ListFooterComponent={<BottomSpacer height={90} />}
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
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		fontFamily: 'Inter-Medium',
		color: '#8B7355',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 16,
		backgroundColor: '#FFFFFF',
		borderBottomWidth: 1,
		borderBottomColor: '#F1F1F1',
	},
	headerTitle: {
		fontSize: 20,
		fontFamily: 'Inter-Bold',
		color: '#2F2D2C',
	},
	markAllReadButton: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 16,
		backgroundColor: 'rgba(198, 124, 78, 0.1)',
	},
	markAllReadText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
	},
	filterContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: '#FFFFFF',
		borderBottomWidth: 1,
		borderBottomColor: '#F1F1F1',
	},
	filterTab: {
		flex: 1,
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 16,
		marginRight: 8,
		backgroundColor: '#F8F8F8',
		alignItems: 'center',
	},
	activeFilterTab: {
		backgroundColor: '#C67C4E',
	},
	filterTabText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#8B7355',
	},
	activeFilterTabText: {
		color: '#FFFFFF',
	},
	listContainer: {
		paddingVertical: 8,
		flexGrow: 1,
		gap: 10,
	},
	notificationItem: {
		backgroundColor: '#FFFFFF',
		marginHorizontal: 16,
		marginVertical: 4,
		borderRadius: 16,
		padding: 16,
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
	notificationContent: {
		flex: 1,
	},
	notificationHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	iconContainer: {
		position: 'relative',
		marginRight: 12,
		marginTop: 2,
	},
	unreadDot: {
		position: 'absolute',
		top: -2,
		right: -2,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#FF6B6B',
	},
	notificationText: {
		flex: 1,
		marginRight: 8,
	},
	notificationTitle: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#2F2D2C',
		marginBottom: 4,
	},
	unreadTitle: {
		color: '#1A1A1A',
	},
	notificationMessage: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#6B6B6B',
		lineHeight: 20,
		marginBottom: 8,
	},
	notificationTime: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: '#9B9B9B',
	},
	deleteButton: {
		padding: 4,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
		paddingTop: 64,
	},
	emptyTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#8B7355',
		marginTop: 16,
		marginBottom: 8,
	},
	emptySubtitle: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#9B9B9B',
		textAlign: 'center',
		lineHeight: 20,
	},
})
