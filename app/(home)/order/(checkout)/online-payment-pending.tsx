import React, { useEffect, useRef, useState, useContext } from 'react'
import {
	StyleSheet,
	View,
	Text,
	SafeAreaView,
	Dimensions,
	TouchableOpacity,
	Image,
	Animated,
	Easing,
	ActivityIndicator,
	Platform,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useTranslation } from '@/providers/locale'
import { CheckoutContext } from './_layout'
import { useEchoChannel } from '@/hooks/useEchoChannel'
import { LinearGradient } from 'expo-linear-gradient'
import { useAlert } from '@/hooks/useAlert'
import { useMemo } from 'react'

const ACCENT_ORANGE = '#FF9F67' // Slightly deeper orange for better contrast
const SOFT_ORANGE = '#FFE5D0'
const CARD_BG = '#FFFFFF'
const BG = '#FCF9F6'
const TEXT = '#232323' // Darker text for better readability
const SUBTEXT = '#6B6B6B' // Slightly darker subtext
const SUCCESS_GREEN = '#5CBF8A' // Slightly deeper green for contrast
const ACCENT_PINK = '#FFD6E3'

interface OnlinePaymentEvent {
	orderId: number
	paymentStatus: 'success' | 'failed'
	paymentMethod: string
}

export default function OnlinePaymentPendingScreen() {
	const { t } = useTranslation()
	const { orderId } = useContext(CheckoutContext)
	const { AlertComponent, showInfo, showError, showSuccess } = useAlert()

	const params = useLocalSearchParams()

	// Animation values
	const pulseAnim = useRef(new Animated.Value(1)).current
	const rotateAnim = useRef(new Animated.Value(0)).current
	const scaleAnim = useRef(new Animated.Value(0.95)).current
	const bobAnim = useRef(new Animated.Value(0)).current

	// Animated loading dots
	const dot1 = useRef(new Animated.Value(0.5)).current
	const dot2 = useRef(new Animated.Value(0.5)).current
	const dot3 = useRef(new Animated.Value(0.5)).current

	// Payment method
	const paymentMethodId = params.paymentMethodId as string
	const paymentMethodTitle = useMemo(() => {
		switch (paymentMethodId) {
			case 'momo':
				return t('momoPaymentMethod')
			case 'zalopay':
				return t('zalopayPaymentMethod')
			case 'vnpay':
				return t('vnpayPaymentMethod')
			case 'bank':
				return 'Bank Transfer'
			default:
				return t('onlinePayment')
		}
	}, [paymentMethodId])

	// Payment status
	const [paymentStatus, setPaymentStatus] = useState<
		'pending' | 'success' | 'failed'
	>('pending')
	// const [paymentMethod, setPaymentMethod] = useState<string>('')

	// Handle Payment types
	const payUrls = JSON.parse(params.payUrls as string) as {
		qr: string // e.g momo://app?action=payWithApp&isScanQR=true&serviceType=qr&sid=TU9NT3wxMDAwMDEx&v=3.0
		mobile: string // Deep link for mobile (opens Momo app), e.g momo  ://app?action=payWithApp&isScanQR=false&serviceType=app&sid=TU9NT3wxMDAwMDEx&v=3.0
		web: string // A web-based payment link provided by the payment gateway
	}

	// Start animations
	useEffect(() => {
		// Pulse animation for glowing effect
		const pulsating = Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.15,
					duration: 1800,
					easing: Easing.bezier(0.4, 0, 0.2, 1),
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 1800,
					easing: Easing.bezier(0.4, 0, 0.2, 1),
					useNativeDriver: true,
				}),
			])
		)

		// Gentle rotation animation
		const rotation = Animated.loop(
			Animated.timing(rotateAnim, {
				toValue: 1,
				duration: 12000,
				easing: Easing.linear,
				useNativeDriver: true,
			})
		)

		// Scale animation for elements
		const scaling = Animated.loop(
			Animated.sequence([
				Animated.timing(scaleAnim, {
					toValue: 1.08,
					duration: 2000,
					easing: Easing.bezier(0.4, 0, 0.2, 1),
					useNativeDriver: true,
				}),
				Animated.timing(scaleAnim, {
					toValue: 0.95,
					duration: 2000,
					easing: Easing.bezier(0.4, 0, 0.2, 1),
					useNativeDriver: true,
				}),
			])
		)

		// Gentle bobbing animation
		const bobbing = Animated.loop(
			Animated.sequence([
				Animated.timing(bobAnim, {
					toValue: -10,
					duration: 1500,
					easing: Easing.bezier(0.4, 0, 0.2, 1),
					useNativeDriver: true,
				}),
				Animated.timing(bobAnim, {
					toValue: 0,
					duration: 1500,
					easing: Easing.bezier(0.4, 0, 0.2, 1),
					useNativeDriver: true,
				}),
			])
		)

		// Start all animations
		pulsating.start()
		rotation.start()
		scaling.start()
		bobbing.start()

		// Cleanup
		return () => {
			pulsating.stop()
			rotation.stop()
			scaling.stop()
			bobbing.stop()
		}
	}, [])

	useEffect(() => {
		const animate = () => {
			Animated.sequence([
				Animated.timing(dot1, {
					toValue: 1,
					duration: 350,
					useNativeDriver: true,
					easing: Easing.inOut(Easing.ease),
				}),
				Animated.timing(dot1, {
					toValue: 0.5,
					duration: 350,
					useNativeDriver: true,
					easing: Easing.inOut(Easing.ease),
				}),
			]).start()
			setTimeout(() => {
				Animated.sequence([
					Animated.timing(dot2, {
						toValue: 1,
						duration: 350,
						useNativeDriver: true,
						easing: Easing.inOut(Easing.ease),
					}),
					Animated.timing(dot2, {
						toValue: 0.5,
						duration: 350,
						useNativeDriver: true,
						easing: Easing.inOut(Easing.ease),
					}),
				]).start()
			}, 200)
			setTimeout(() => {
				Animated.sequence([
					Animated.timing(dot3, {
						toValue: 1,
						duration: 350,
						useNativeDriver: true,
						easing: Easing.inOut(Easing.ease),
					}),
					Animated.timing(dot3, {
						toValue: 0.5,
						duration: 350,
						useNativeDriver: true,
						easing: Easing.inOut(Easing.ease),
					}),
				]).start()
			}, 400)
		}
		const interval = setInterval(animate, 1050)
		animate()
		return () => clearInterval(interval)
	}, [])

	// Listen for payment events
	const { channel } = useEchoChannel(
		'online-payment',
		'.OnlinePaymentEvent',
		false,
		(data: OnlinePaymentEvent) => {
			// Subscribe to the channel
			console.log('Received payment event:', data)

			// Check if this event is for our order
			if (data.orderId === orderId) {
				// Update state based on payment status

				if (data.paymentStatus === 'success') {
					setPaymentStatus('success')
					showSuccess(t('paymentSuccess'))

					// Navigate to order success screen after a brief delay
					setTimeout(() => {
						router.replace('/(home)/order/(checkout)/order-placed')
					}, 1500)
				} else {
					setPaymentStatus('failed')
					showError(t('paymentFailed'))
					router.replace('/(home)/product') // back to homepage
				}
			}
		},
		!!orderId // Condition for this listener hook to be active
	)

	// Set time limit for pending payment, if exceed, it's failed
	useEffect(() => {
		return () => {
			// Clean up channel subscription
			if (channel) {
				channel.stopListening('OnlinePaymentEvent')
			}
		}
	}, [orderId])

	// Convert rotation value to interpolated string
	const spin = rotateAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '360deg'],
	})

	// Navigate back to products page
	const handleReturnToShopping = () => {
		router.replace('/(home)/product')
	}

	// Try payment again
	const handleTryAgain = () => {
		// Reset to checkout page
		router.replace('/(home)/order/(checkout)/checkout')
	}

	// Render different UI based on payment status
	const renderContent = () => {
		switch (paymentStatus) {
			case 'success':
				return (
					<View style={styles.statusContainer}>
						<View style={styles.successIconContainer}>
							<View style={styles.successCircleOuter}>
								<View style={styles.successCircleInner}>
									<Ionicons name="checkmark" size={36} color="#FFFFFF" />
								</View>
							</View>
						</View>
						<View style={styles.contentBox}>
							<Text style={styles.successTitle}>{t('paymentSuccess')}</Text>
							<Text style={styles.successMessage}>
								{t('redirectingToOrderStatus')}
							</Text>
							<ActivityIndicator
								color={ACCENT_ORANGE}
								size="small"
								style={styles.smallLoader}
							/>
						</View>
					</View>
				)
			case 'failed':
				return (
					<View style={styles.statusContainer}>
						<View style={styles.failureIconContainer}>
							<View style={styles.failureCircleOuter}>
								<View style={styles.failureCircleInner}>
									<Ionicons name="close" size={36} color="#FFFFFF" />
								</View>
							</View>
						</View>
						<View style={styles.contentBox}>
							<Text style={styles.failureTitle}>{t('paymentFailed')}</Text>
							<Text style={styles.failureMessage}>
								{t('paymentFailedMessage')}
							</Text>
							<View style={styles.buttonsContainer}>
								<TouchableOpacity
									style={styles.tryAgainButton}
									onPress={handleTryAgain}
								>
									<Text style={styles.tryAgainText}>{t('tryAgain')}</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.returnButton}
									onPress={handleReturnToShopping}
								>
									<Text style={styles.returnText}>{t('returnToShopping')}</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				)
			default:
				return (
					<View style={styles.loadingContainer}>
						{/* Top subtle gradient with pink/green accent */}
						<LinearGradient
							colors={[ACCENT_PINK, BG, '#B6E2D3']}
							style={styles.topBannerContainer}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
						>
							<Text style={styles.topBannerText}>{paymentMethodTitle}</Text>
						</LinearGradient>
						<View style={styles.houseIconWrapper}>
							<MaterialIcons
								name="storefront"
								size={40}
								color={ACCENT_ORANGE}
							/>
						</View>
						<View style={styles.houseLabel}>
							<Text style={styles.houseLabelText}>
								{t('processingPayment')}
							</Text>
						</View>
						<View style={styles.orderIdCard}>
							<Text style={styles.orderIdLabel}>{t('orderNumber')}</Text>
							<Text style={styles.orderIdValue}>#{orderId}</Text>
						</View>
						{/* Animated loading dots */}
						<View style={styles.loadingDotsContainer}>
							<Animated.View
								style={[
									styles.loadingDot,
									{
										backgroundColor: ACCENT_PINK,
										transform: [{ scale: dot1 }],
									},
								]}
							/>
							<Animated.View
								style={[
									styles.loadingDot,
									{
										backgroundColor: ACCENT_ORANGE,
										transform: [{ scale: dot2 }],
									},
								]}
							/>
							<Animated.View
								style={[
									styles.loadingDot,
									{
										backgroundColor: SUCCESS_GREEN,
										transform: [{ scale: dot3 }],
									},
								]}
							/>
						</View>
						<Text style={styles.loadingText}>{t('connecting')}</Text>
						<View style={styles.transactionInfoContainer}>
							<Text style={styles.infoText}>{t('paymentPendingInfo')}</Text>
						</View>
					</View>
				)
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}
			{renderContent()}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: BG,
	},
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	statusContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	topBannerContainer: {
		position: 'absolute',
		top: 0,
		width: '100%',
		height: '30%',
		justifyContent: 'center',
		alignItems: 'center',
		borderBottomLeftRadius: 24,
		borderBottomRightRadius: 24,
		marginBottom: 24,
	},
	topBannerText: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 25,
		color: ACCENT_ORANGE,
		letterSpacing: 1,
		textShadowColor: 'rgba(255,255,255,0.5)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
	houseIconWrapper: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: CARD_BG,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
		shadowColor: ACCENT_ORANGE,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 4,
	},
	houseLabel: {
		backgroundColor: ACCENT_ORANGE,
		paddingHorizontal: 24,
		paddingVertical: 8,
		borderRadius: 20,
		marginBottom: 16,
	},
	houseLabelText: {
		fontFamily: 'Inter-Bold',
		fontSize: 16,
		color: '#FFF',
		letterSpacing: 0.2,
		textShadowColor: 'rgba(0,0,0,0.08)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 1,
	},
	orderIdCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: CARD_BG,
		borderRadius: 12,
		paddingVertical: 6,
		paddingHorizontal: 16,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: SOFT_ORANGE,
	},
	orderIdLabel: {
		fontFamily: 'Inter-Regular',
		fontSize: 14,
		color: SUBTEXT,
		marginRight: 8,
		letterSpacing: 0.1,
	},
	orderIdValue: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 16,
		color: ACCENT_ORANGE,
		letterSpacing: 0.2,
	},
	loadingDotsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 10,
	},
	loadingDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginHorizontal: 4,
		// backgroundColor set dynamically
	},
	loadingText: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 15,
		color: ACCENT_ORANGE,
		letterSpacing: 1,
		marginBottom: 16,
		textShadowColor: 'rgba(255,255,255,0.5)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 1,
	},
	transactionInfoContainer: {
		backgroundColor: CARD_BG,
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: SOFT_ORANGE,
		shadowColor: ACCENT_ORANGE,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 4,
		elevation: 2,
		marginBottom: 30,
		width: '90%',
	},
	infoText: {
		fontFamily: 'Inter-Medium',
		fontSize: 15,
		color: TEXT,
		textAlign: 'center',
		lineHeight: 22,
		letterSpacing: 0.1,
	},
	contentBox: {
		backgroundColor: CARD_BG,
		borderRadius: 24,
		padding: 30,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: SOFT_ORANGE,
		shadowColor: ACCENT_ORANGE,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
		width: '90%',
		zIndex: 5,
	},
	successTitle: {
		fontFamily: 'Inter-Bold',
		fontSize: 24,
		color: ACCENT_ORANGE,
		marginBottom: 12,
		textAlign: 'center',
		letterSpacing: 0.2,
		textShadowColor: 'rgba(255,255,255,0.5)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
	successMessage: {
		fontFamily: 'Inter-Regular',
		fontSize: 16,
		color: TEXT,
		textAlign: 'center',
		marginBottom: 24,
		letterSpacing: 0.1,
	},
	smallLoader: {
		marginTop: 12,
	},
	successIconContainer: {
		alignItems: 'center',
		marginBottom: 24,
	},
	successCircleOuter: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: SOFT_ORANGE,
		justifyContent: 'center',
		alignItems: 'center',
	},
	successCircleInner: {
		width: 70,
		height: 70,
		borderRadius: 35,
		backgroundColor: ACCENT_ORANGE,
		justifyContent: 'center',
		alignItems: 'center',
	},
	failureIconContainer: {
		alignItems: 'center',
		marginBottom: 24,
	},
	failureCircleOuter: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: '#FFE5E5',
		justifyContent: 'center',
		alignItems: 'center',
	},
	failureCircleInner: {
		width: 70,
		height: 70,
		borderRadius: 35,
		backgroundColor: '#FF6B6B',
		justifyContent: 'center',
		alignItems: 'center',
	},
	failureTitle: {
		fontFamily: 'Inter-Bold',
		fontSize: 24,
		color: '#FF6B6B',
		marginBottom: 12,
		textAlign: 'center',
		letterSpacing: 0.2,
		textShadowColor: 'rgba(255,255,255,0.5)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
	failureMessage: {
		fontFamily: 'Inter-Regular',
		fontSize: 16,
		color: TEXT,
		textAlign: 'center',
		marginBottom: 36,
		lineHeight: 24,
		letterSpacing: 0.1,
	},
	buttonsContainer: {
		width: '100%',
		alignItems: 'center',
		gap: 16,
	},
	tryAgainButton: {
		width: '90%',
		backgroundColor: ACCENT_ORANGE,
		paddingVertical: 16,
		borderRadius: 30,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: ACCENT_ORANGE,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	tryAgainText: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 16,
		color: '#FFF',
	},
	returnButton: {
		width: '90%',
		backgroundColor: SOFT_ORANGE,
		paddingVertical: 16,
		borderRadius: 30,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: ACCENT_ORANGE,
	},
	returnText: {
		fontFamily: 'Inter-Medium',
		fontSize: 16,
		color: ACCENT_ORANGE,
	},
})
