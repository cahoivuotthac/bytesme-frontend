import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { notificationAPI } from "@/utils/api";
import { router } from "expo-router";

// Configure notification behavior
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
});

export class NotificationService {
	private static instance: NotificationService;
	private expoPushToken: string | null = null;

	static getInstance(): NotificationService {
		if (!NotificationService.instance) {
			NotificationService.instance = new NotificationService();
		}
		return NotificationService.instance;
	}

	/**
	 * Register for push notifications and get token
	 */
	async registerForPushNotifications(): Promise<string | null> {
		// Check existing permissions
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		// Request permissions if not granted
		if (existingStatus !== "granted") {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== "granted") {
			console.log("Failed to get push token for push notification!");
			return null;
		}

		try {
			// Get the token
			const token = await Notifications.getExpoPushTokenAsync({
				projectId:
					Constants.expoConfig?.extra?.eas?.projectId ??
					Constants.easConfig?.projectId,
			});

			console.log("Expo Push Token:", token.data);
			this.expoPushToken = token.data;

			// Send token to your Laravel backend
			await this.sendTokenToBackend(token.data);

			return token.data;
		} catch (error) {
			console.error("Error getting push token:", error);
			return null;
		}
	}

	/**
	 * Send token to Laravel backend
	 */
	private async sendTokenToBackend(token: string): Promise<void> {
		try {
			await notificationAPI.updateExpoPushToken(token);
			console.log("Token sent to backend successfully");
		} catch (error) {
			console.error("Error sending token to backend:", error);
		}
	}

	/**
	 * Set up notification listeners
	 */
	setupNotificationListeners() {
		// Handle notification received while app is in foreground
		const foregroundSubscription =
			Notifications.addNotificationReceivedListener((notification) => {
				console.log(
					"Notification received in foreground:",
					notification
				);
				// You can customize foreground notification behavior here
			});

		// Handle notification tapped/clicked
		const responseSubscription =
			Notifications.addNotificationResponseReceivedListener(
				(response) => {
					console.log("Notification tapped:", response);
					console.log(
						"Notification content:",
						response.notification.request.content
					);

					// Handle navigation based on notification data
					this.handleNotificationTap(response.notification);
				}
			);

		return {
			foregroundSubscription,
			responseSubscription,
		};
	}

	/**
	 * Handle notification tap navigation
	 */
	private handleNotificationTap(notification: any) {
		console.log(
			"Handling notification tap for the following notification:",
			notification
		);

		// Specific handlers
		const handleOrderStatusNotification = (notfication: any) => {
			console.log("Handling order status notification:");

			const data = notification.request.content?.data;

			if (data && data?.order_id) {
				console.log("Order ID:", data.order_id);
				router.push({
					pathname: "/(home)/order/(checkout)/tracking",
					params: {
						orderId: data.order_id,
					},
				});
			} else {
				router.push("/notifications");
			}
		};

		const notificationTypeToHandler = {
			order_status: handleOrderStatusNotification,
		};

		const notificationType = (notification.request.content.data?.type ||
			"") as keyof typeof notificationTypeToHandler;
		const handler = notificationTypeToHandler[notificationType];
		handler?.(notification);
	}

	/**
	 * Get current push token
	 */
	getCurrentToken(): string | null {
		return this.expoPushToken;
	}

	/**
	 * Clear notification badge (iOS)
	 */
	async clearBadge() {
		if (Platform.OS === "ios") {
			await Notifications.setBadgeCountAsync(0);
		}
	}
}
