import React, { useState, useContext } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	SafeAreaView,
	TouchableOpacity,
	Image,
	TextInput,
	Platform,
	Keyboard,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { useTranslation } from '@/providers/locale'
import { useAlert } from '@/hooks/useAlert'
import NavButton from '@/components/shared/NavButton'
import { orderAPI } from '@/utils/api'
import DishDecoration from '@/components/shared/DishDecoration'
import { CheckoutContext } from './_layout'
import { useAuth } from '@/providers/auth'
import { useMemo } from 'react'
import { useEffect } from 'react'
import { useBottomBarControl } from '@/providers/BottomBarControlProvider'
import * as ImagePicker from 'expo-image-picker'
import BottomSpacer from '@/components/shared/BottomSpacer'
import LinearGradientButton from '@/components/ui/LinearGradientButton'

export default function FeedbackScreen() {
	const { t } = useTranslation()
	const { AlertComponent, showInfo, showError, showSuccess } = useAlert()
	const { trackingOrder, setTrackingOrder } = useContext(CheckoutContext)

	// State
	const [rating, setRating] = useState(4)
	const [feedback, setFeedback] = useState('')
	const [images, setImages] = useState<string[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [selectedImproveTags, setSelectedImproveTags] = useState<string[]>([])
	const [isAnonymous, setIsAnonymous] = useState(false)
	const [isBottomContainerVisible, setIsBottomContainerVisible] = useState(true)
	const { authState } = useAuth()
	const { show: showBottomBar, hide: hideBottomBar } = useBottomBarControl()

	const params = useLocalSearchParams()
	const navigateBackToPath = params.navigateBackToPath || '/(home)/product'
	const presetOrderId = params.orderId ? Number(params.orderId) : null

	// Keyboard listener
	useEffect(() => {
		const showSub = Keyboard.addListener('keyboardDidShow', () => {
			hideBottomBar()
			setIsBottomContainerVisible(false)
		})
		const hideSub = Keyboard.addListener('keyboardDidHide', () => {
			showBottomBar()
			setIsBottomContainerVisible(true)
		})
		return () => {
			showSub.remove()
			hideSub.remove()
		}
	}, [])

	// If presetOrderId is provided, fetch the order details
	useEffect(() => {
		if (!trackingOrder && presetOrderId) {
			orderAPI
				.getOrderDetails(presetOrderId)
				.then((response) => {
					const orderDetails = response.data
					if (orderDetails && orderDetails.order_id) {
						setTrackingOrder(orderDetails)
					} else {
						showError(t('orderNotFound'))
					}
				})
				.catch((error) => {
					console.error('Error fetching order details:', error)
					showError(t('errorFetchingOrder'))
				})
		}
	}, [presetOrderId, trackingOrder, setTrackingOrder])

	const userDisplayName = useMemo(() => {
		if (isAnonymous) {
			return t('anonymousUser')
		}

		return authState.user?.name || ''
	}, [isAnonymous, authState])

	// Available improvement areas
	const availableImproveTags = [
		{ id: 'flavour', label: t('flavour') },
		{ id: 'act-of-service', label: t('actOfService') },
		{ id: 'packaging', label: t('packaging') },
		{ id: 'delivery-time', label: t('deliveryTime') },
	]

	// Toggle selection of improvement areas
	const toggleImproveTag = (id: string) => {
		if (selectedImproveTags.includes(id)) {
			setSelectedImproveTags(
				selectedImproveTags.filter((improveTagId) => improveTagId !== id)
			)
		} else {
			setSelectedImproveTags([...selectedImproveTags, id])
		}
	}

	console.log('Tracking Order: ', trackingOrder)

	useEffect(() => {
		console.log('Selected improve tags changed:', selectedImproveTags)
	}, [selectedImproveTags])

	// Handle rating change
	const handleRatingChange = (value: number) => {
		setRating(value)
	}

	// Format stars for display
	const renderStars = () => {
		const stars = []
		for (let i = 1; i <= 5; i++) {
			stars.push(
				<TouchableOpacity
					key={i}
					onPress={() => handleRatingChange(i)}
					style={styles.starContainer}
				>
					<AntDesign
						name={i <= rating ? 'star' : 'staro'}
						size={32}
						color={'#EA5982'}
					/>
				</TouchableOpacity>
			)
		}
		return stars
	}

	// Handle image picking
	const pickImage = async () => {
		if (images.length >= 3) {
			showInfo(t('maxImagesReached'))
			return
		}

		// Request permission
		const permissionResult =
			await ImagePicker.requestMediaLibraryPermissionsAsync()

		if (permissionResult.granted === false) {
			showError(t('permissionDenied'))
			return
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			// mediaTypes: ['images'],
			mediaTypes: ['images'],
			allowsEditing: false,
			aspect: [1, 1],
			quality: 0.7,
			base64: true,
		})

		if (!result.canceled && result.assets && result.assets.length > 0) {
			const imageAsset = result.assets[0]
			console.log('image asset: ', imageAsset)

			// Make sure we have base64 data
			if (!imageAsset.base64) {
				showError(t(''))
			}

			const base64str = `data:image/jpeg;base64,${imageAsset.base64}`
			setImages([...images, base64str])
		}
	}

	// Remove image from uploaded images
	const removeImage = (index: number) => {
		const newImages = [...images]
		newImages.splice(index, 1)
		setImages(newImages)
	}

	// Submit feedback
	const handleSendFeedback = async () => {
		if (rating === 0) {
			showError(t('pleaseRateOrder'))
			return
		}

		setIsSubmitting(true)

		console.log('selected improve tags: ', selectedImproveTags)
		console.log('images: ', images)
		try {
			if (!trackingOrder || trackingOrder.order_id == null) {
				showError(t('orderNotFound'))
				setIsSubmitting(false)
				return
			}

			const payload = {
				order_id: trackingOrder.order_id,
				content: feedback,
				rating,
				is_anonymous: isAnonymous,
				improve_tags: selectedImproveTags,
				images, // images are already base64 strings
			}

			await orderAPI.sendFeedback(payload)

			showSuccess(t('feedbackSubmitSuccess'), () =>
				router.replace(navigateBackToPath as any)
			)
		} catch (error) {
			console.error('Error submitting feedback:', error)
			showError(t('feedbackSubmitError'))
		} finally {
			setIsSubmitting(false)
		}
	}

	// Calculate rating label based on rating value
	const getRatingLabel = () => {
		switch (rating) {
			case 1:
				return t('terrible')
			case 2:
			case 3:
				return t('okay')
			case 4:
				return t('good')
			case 5:
				return t('excellent')
			default:
				return t('good')
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}

			{/* Header with gradient */}
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
					<Text style={styles.headerTitle}>{t('feedbackOrder')}</Text>
				</View>
			</LinearGradient>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* Order Items Preview */}
				<View style={styles.orderItemsPreview}>
					<Text style={styles.previewLabel}>
						<Text style={{ fontWeight: 'bold' }}>
							{t('shareExperienceUsername').replace('{name}', userDisplayName)}
						</Text>
						{t('shareExperience')}
					</Text>

					{trackingOrder?.order_items &&
						trackingOrder.order_items.length > 0 && (
							<View style={{ alignItems: 'center', marginTop: 16 }}>
								<View
									style={{ flexDirection: 'row', justifyContent: 'center' }}
								>
									{trackingOrder.order_items.map((item, index) => (
										<View
											key={index}
											style={{
												marginLeft: index === 0 ? 0 : -24,
												zIndex: trackingOrder.order_items.length - index,
											}}
										>
											<DishDecoration
												imageSource={{
													uri: item.product.product_images[0].product_image_url,
												}}
												size={80}
											/>
										</View>
									))}
								</View>
								{/* Product names below images, centered */}
								<Text
									style={{
										fontSize: 13,
										color: '#5D4037',
										fontFamily: 'Inter-Medium',
										textAlign: 'center',
										marginTop: 8,
									}}
									numberOfLines={1}
								>
									{(() => {
										const names = trackingOrder.order_items.map(
											(item: any) => item.product.product_name
										)
										const displayNames = names.slice(0, 2).join(', ')
										return names.length > 2
											? displayNames + ', ...'
											: displayNames
									})()}
								</Text>
							</View>
						)}
				</View>

				{/* Rating Stars */}
				<View style={styles.ratingSection}>
					<Text style={styles.ratingLabel}>{getRatingLabel()}</Text>
					<View style={styles.starsContainer}>{renderStars()}</View>
				</View>

				{/* Improvement Areas */}
				<View style={styles.improvementAreasSection}>
					<Text style={styles.sectionTitle}>{t('areasToImprove')}</Text>
					<View style={styles.areasContainer}>
						{availableImproveTags.map((tag) => (
							<TouchableOpacity
								key={tag.id}
								style={[
									styles.areaButton,
									selectedImproveTags.includes(tag.id) &&
										styles.selectedAreaButton,
								]}
								onPress={() => toggleImproveTag(tag.id)}
							>
								{selectedImproveTags.includes(tag.id) && (
									<Ionicons
										name="checkmark"
										size={16}
										color="#FFFFFF"
										style={styles.checkmark}
									/>
								)}
								<Text
									style={[
										styles.areaButtonText,
										selectedImproveTags.includes(tag.id) &&
											styles.selectedAreaText,
									]}
								>
									{tag.label}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Comment Input */}
				<View style={styles.commentSection}>
					<TextInput
						style={styles.commentInput}
						placeholder={t('feedbackContentPlaceholder')}
						placeholderTextColor="#B9B9B9"
						multiline={true}
						numberOfLines={4}
						value={feedback}
						maxLength={255}
						onChangeText={setFeedback}
						textAlignVertical="top"
					/>
				</View>

				{/* Image Upload */}
				<View style={styles.imageUploadSection}>
					<Text style={styles.uploadLabel}>{t('uploadImages')}</Text>

					<View style={styles.imagePreviewContainer}>
						{images.map((image, index) => (
							<View key={index} style={styles.imagePreview}>
								<Image source={{ uri: image }} style={styles.previewImage} />
								<TouchableOpacity
									style={styles.removeImageButton}
									onPress={() => removeImage(index)}
								>
									<Ionicons name="close" size={16} color="#FFFFFF" />
								</TouchableOpacity>
							</View>
						))}

						{images.length < 3 && (
							<TouchableOpacity
								style={styles.addImageButton}
								onPress={pickImage}
							>
								<Ionicons name="add" size={32} color="#FFFFFF" />
							</TouchableOpacity>
						)}
					</View>
				</View>

				<View style={styles.bottomSpacer} />
			</ScrollView>

			{/* Submit Button and Anonymous Checkbox on the same line */}
			{isBottomContainerVisible && (
				<View style={styles.bottomContainer}>
					<View style={styles.bottomInnerContainer}>
						{/* Submit as anonymous checkbox */}
						<View style={styles.anonymousContainer}>
							<TouchableOpacity
								style={[
									styles.checkbox,
									isAnonymous && {
										backgroundColor: '#406343',
										borderColor: '#406343',
									},
								]}
								onPress={() => setIsAnonymous((prev) => !prev)}
							>
								{isAnonymous && (
									<Ionicons name="checkmark" size={16} color="#fff" />
								)}
							</TouchableOpacity>
							<Text style={styles.anonymousText}>{t('submitAnonymously')}</Text>
						</View>

						<LinearGradientButton
							text={t('submit')}
							onPress={handleSendFeedback}
							loading={isSubmitting}
							style={{ marginLeft: 12, minWidth: 140 }}
							textStyle={{ fontSize: 16 }}
						/>
					</View>
				</View>
			)}
			<BottomSpacer height={90} />
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		// backgroundColor: '#FCF9F6', // Subtle cream background
		backgroundColor: '#FAF9F6', // Light cream background (less hot)
		paddingHorizontal: 5,
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
		alignSelf: 'center', // This ensures vertical centering
	},
	headerTitle: {
		fontSize: 20,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E', // Resilient brown
		letterSpacing: 0.5,
	},
	content: {
		flex: 1,
		padding: 16,
	},
	orderItemsPreview: {
		marginBottom: 20,
	},
	previewLabel: {
		fontSize: 15,
		fontFamily: 'Inter-Medium',
		color: '#3C3C3C',
		marginBottom: 16,
		textAlign: 'center',
		paddingHorizontal: 16,
	},
	orderItemsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		paddingVertical: 8,
	},
	orderItemCircle: {
		alignItems: 'center',
		marginHorizontal: 8,
		width: 100,
	},
	dishContainer: {
		backgroundColor: '#FFFFFF',
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	dishName: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: '#5D4037',
		textAlign: 'center',
		marginTop: 8,
	},
	ratingSection: {
		alignItems: 'center',
		marginVertical: 16,
	},
	ratingLabel: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#3C3C3C',
		marginBottom: 12,
	},
	starsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 8,
	},
	starContainer: {
		marginHorizontal: 4,
		padding: 4,
	},
	improvementAreasSection: {
		marginVertical: 16,
	},
	sectionTitle: {
		fontSize: 15,
		fontFamily: 'Inter-Medium',
		color: '#3C3C3C',
		marginBottom: 12,
	},
	areasContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginHorizontal: -4,
	},
	areaButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F5F5F5',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 100,
		margin: 4,
		borderWidth: 1,
		borderColor: '#F0F0F0',
	},
	selectedAreaButton: {
		backgroundColor: '#406343',
		borderColor: '#406343',
	},
	areaButtonText: {
		fontSize: 13,
		fontFamily: 'Inter-Medium',
		color: '#3C3C3C',
	},
	selectedAreaText: {
		color: '#FFFFFF',
	},
	checkmark: {
		marginRight: 4,
	},
	commentSection: {
		marginVertical: 16,
	},
	commentInput: {
		backgroundColor: '#FFFFFF',
		borderRadius: 8,
		padding: 12,
		height: 100,
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#3C3C3C',
		textAlignVertical: 'top',
		borderWidth: 1,
		borderColor: '#C67C4E',
	},
	imageUploadSection: {
		marginVertical: 16,
	},
	uploadLabel: {
		fontSize: 15,
		fontFamily: 'Inter-Medium',
		color: '#3C3C3C',
		marginBottom: 12,
	},
	imagePreviewContainer: {
		borderStyle: 'dashed',
		borderWidth: 1,
		borderColor: '#C67C4E',
		padding: 12,
		borderRadius: 30,
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginHorizontal: 2,
		alignItems: 'center', // Center items vertically
		height: 80,
	},
	imagePreview: {
		width: 60,
		height: 60,
		borderRadius: 30,
		margin: 4,
		position: 'relative',
		overflow: 'hidden',
	},
	previewImage: {
		width: '100%',
		height: '100%',
	},
	removeImageButton: {
		position: 'absolute',
		top: 6,
		right: 6,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		width: 24,
		height: 24,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.5)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.3,
		shadowRadius: 2,
		elevation: 3,
	},
	addImageButton: {
		width: 46,
		height: 46,
		borderRadius: 20,
		margin: 4,
		backgroundColor: '#385541',
		// borderWidth: 1,
		// borderColor: '#E0E0E0',
		// borderStyle: 'dashed',
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center', // Ensure vertical centering
	},
	anonymousContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 16,
	},
	checkbox: {
		width: 20,
		height: 20,
		borderWidth: 2,
		borderColor: '#9E9E9E',
		borderRadius: 4,
		marginRight: 8,
	},
	anonymousText: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#5D4037',
	},
	bottomSpacer: {
		height: 80,
	},
	bottomContainer: {
		position: 'absolute',
		bottom: 80,
		left: 0,
		right: 0,
		backgroundColor: 'white',
		paddingVertical: 16,
		paddingHorizontal: 20,
		opacity: 0.9,
		// borderTopWidth: 1,
		// borderTopColor: '#F5F5F5',
		// shadowColor: '#000',
		// shadowOffset: { width: 0, height: -2 },
		// shadowOpacity: 0.1,
		// shadowRadius: 4,
		elevation: 4,
	},
	bottomInnerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	gradientButton: {
		borderRadius: 16,
		backgroundColor: 'transparent',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 4,
	},
	submitButton: {
		width: '100%',
		borderRadius: 16,
		backgroundColor: 'transparent',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center', // Center items vertically
		paddingHorizontal: 20,
	},
	buttonText: {
		fontFamily: 'Inter-SemiBold',
		color: '#FFFFFF',
		fontSize: 16,
		backgroundColor: 'transparent',
	},
})
