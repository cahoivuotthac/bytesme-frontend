import React, { useEffect, useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Image,
	SafeAreaView,
	StatusBar,
	Dimensions,
	Modal,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons, AntDesign, Feather, MaterialIcons } from '@expo/vector-icons'
import NavButton from '@/components/shared/NavButton'
import Button from '@/components/ui/Button'
import RegularProductCard from '@/components/product/RegularProductCard'
import { useTranslation } from '@/providers/locale'
import ImageCarousel from '@/components/shared/ImageCarousel'
import { APIClient } from '@/utils/api'
import { useAlert } from '@/hooks/useAlert'
import QuantityControl from '@/components/ui/QuantityControl'

const { width, height } = Dimensions.get('window')

interface ProductData {
	product_id: string
	name: string
	sizes: []
	prices: number[]
	images: string[]
	overall_ratings: number
	is_favorite: boolean
}

// Mock product data - in real app this would be fetched based on the ID
const PRODUCT = {
	id: '1',
	name: 'Yakisoba Noodles',
	description:
		'Matcha Latte được làm từ Matcha và sữa, có thể uống được ở cả nóng và lạnh',
	longDescription: `Matcha Latte được làm từ Matcha và sữa, có thể uống được ở cả nóng và lạnh.
Matcha Latte – Sự hòa quyện tinh tế giữa truyền thống và hiện đại.
Với hương thơm dịu nhẹ và vị ngọt thanh đặc trưng, Matcha Latte mang đến cảm giác thư giãn và sảng khoái trong từng ngụm. Bột matcha nguyên chất từ lá trà xanh Nhật Bản kết hợp cùng sữa tươi mịn màng tạo nên một thức uống không chỉ ngon miệng mà còn tốt cho sức khỏe. Dành cho những ai yêu thích sự tinh tế và cần chút "xanh mát" cho ngày mới thêm năng lượng.`,
	price: 10,
	rating: 4.8,
	reviews: 124,
	images: [
		{
			id: '1',
			imageUrl:
				'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
			title: '', // Empty title to avoid display
		},
		{
			id: '2',
			imageUrl:
				'https://images.unsplash.com/photo-1632666806308-a0dd67a85ff7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
			title: '', // Empty title to avoid display
		},
		{
			id: '3',
			imageUrl:
				'https://images.unsplash.com/photo-1617196035154-1e7e6e28b300?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
			title: '', // Empty title to avoid display
		},
	],
	sizes: ['S', 'M', 'L'],
	isFavorite: false,
	// Reviews data with images
	reviewsData: [
		{
			id: '1',
			userName: 'Afsar Hossen',
			userEmail: 'Imshuvo97@gmail.com',
			userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
			rating: 4.5,
			text: 'Bánh có vị rất ngon, tôi thích sự kết hợp hương vị matcha và sữa. Sẽ mua lại!',
			date: '2024-04-28',
			images: [
				{
					id: 'rev-img-1',
					imageUrl:
						'https://images.unsplash.com/photo-1582651550657-86a00126121a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
				},
				{
					id: 'rev-img-2',
					imageUrl:
						'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
				},
				{
					id: 'rev-img-3',
					imageUrl:
						'https://images.unsplash.com/photo-1565599837634-889309cdb15b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
				},
			],
		},
		{
			id: '2',
			userName: 'Sarah Johnson',
			userEmail: 'sarah.j@example.com',
			userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
			rating: 5,
			text: 'Tuyệt vời! Đây là món ăn yêu thích của tôi tại cửa hàng này.',
			date: '2024-04-25',
			images: [
				{
					id: 'rev-img-4',
					imageUrl:
						'https://images.unsplash.com/photo-1612203985729-70726954388c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
				},
			],
		},
	],
}

// Mock similar products
const SIMILAR_PRODUCTS = [
	{
		productId: 2,
		name: 'Yakisoba Noodles',
		price: 10,
		imageUrl:
			'https://images.unsplash.com/photo-1552611052-33e04de081de?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
		rating: 4.2,
		isFavorite: false,
	},
	{
		productId: 3,
		name: 'Yakisoba Noodles',
		price: 10,
		imageUrl:
			'https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
		rating: 4.5,
		isFavorite: true,
	},
	{
		productId: 4,
		name: 'Yakisoba Noodles',
		price: 10,
		imageUrl:
			'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
		rating: 4.7,
		isFavorite: false,
	},
]

export default function ProductDetailScreen() {
	const { id: productId } = useLocalSearchParams()
	const { t } = useTranslation()
	const [isFavorite, setIsFavorite] = useState(PRODUCT.isFavorite)
	const [selectedSize, setSelectedSize] = useState('M')
	const [quantity, setQuantity] = useState(1)
	const [descriptionModalVisible, setDescriptionModalVisible] = useState(false)
	const [sizeDropdownVisible, setSizeDropdownVisible] = useState(false)
	const [reviewsModalVisible, setReviewsModalVisible] = useState(false)
	const [selectedReviewImage, setSelectedReviewImage] = useState(null)

	const { AlertComponent, showError } = useAlert()
	const [productData, setProductData] = useState<ProductData>({} as any)

	// Initialize data
	useEffect(() => {
		if (!productData) {
			return
		}

		setIsFavorite(productData.is_favorite)
	}, [productData])

	// Handle quantity changes
	const incrementQuantity = () => {
		setQuantity(quantity + 1)
	}

	const decrementQuantity = () => {
		if (quantity > 1) {
			setQuantity(quantity - 1)
		}
	}

	// Toggle favorite status
	const toggleFavorite = async () => {
		try {
			console.log('product ID: ', productId)
			await APIClient.post(`/user/wishlist/${isFavorite ? 'remove' : 'add'}`, {
				product_id: productId,
			})
			setIsFavorite(!isFavorite)
		} catch (err) {
			showError(t('errorAddingToWishlist'))
			console.error('Error toggling favorite:', err)
		}
	}

	// Toggle size dropdown
	const toggleSizeDropdown = () => {
		setSizeDropdownVisible(!sizeDropdownVisible)
	}

	// Handle size selection
	const handleSelectSize = (size: string) => {
		setSelectedSize(size)
		setSizeDropdownVisible(false)
	}

	// Toggle reviews modal
	const toggleReviewsModal = () => {
		setReviewsModalVisible(!reviewsModalVisible)
	}

	// View review image in full screen
	const viewReviewImage = (imageUrl) => {
		setSelectedReviewImage(imageUrl)
	}

	// Close review image view
	const closeReviewImageView = () => {
		setSelectedReviewImage(null)
	}

	// Handle add to cart
	const handleAddToCart = () => {
		console.log(
			`Added ${quantity} of ${PRODUCT.name} (${selectedSize}) to cart`
		)
		// Implementation would depend on your cart management system
	}

	// Toggle description modal
	const toggleDescriptionModal = () => {
		setDescriptionModalVisible(!descriptionModalVisible)
	}

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}

			<StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

			<ScrollView
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scrollViewContent}
			>
				{/* Product Image Section - Now using ImageCarousel for multiple images */}
				<View style={styles.imageContainer}>
					<ImageCarousel
						items={PRODUCT.images}
						height={350}
						autoPlayInterval={0} // Disable auto-play
						showTextOverlay={false} // Hide text overlay
						enableNavigation={false} // Disable navigation on press
						borderRadius={30} // Match the bottom radius in the design
						style={styles.carousel}
					/>

					{/* Back Button */}
					<View style={styles.backButtonContainer}>
						<NavButton
							direction="back"
							onPress={() => router.back()}
							size={40}
							backgroundColor="#FFFFFF"
							iconColor="#C67C4E"
							style={styles.backButton}
						/>
					</View>

					{/* Favorite Button */}
					<TouchableOpacity
						style={styles.favoriteButton}
						onPress={toggleFavorite}
					>
						<Ionicons
							name={isFavorite ? 'heart' : 'heart-outline'}
							size={24}
							color={isFavorite ? '#C67C4E' : '#C67C4E'}
						/>
					</TouchableOpacity>
				</View>

				{/* Product Details Section */}
				<View style={styles.detailsContainer}>
					{/* Product Name */}
					<Text style={styles.productName}>{PRODUCT.name}</Text>
					{/* Rating */}
					<View style={styles.ratingContainer}>
						<View style={styles.starContainer}>
							{[1, 2, 3, 4, 5].map((star) => (
								<AntDesign
									key={star}
									name="star"
									size={16}
									color={
										star <= Math.floor(PRODUCT.rating) ? '#F3603F' : '#E0E0E0'
									}
									style={{ marginRight: 2 }}
								/>
							))}
						</View>
						<Text style={styles.ratingText}>{PRODUCT.rating}</Text>
						<Text style={styles.reviewsText}>
							({PRODUCT.reviews} {t('ratings')})
						</Text>
					</View>
					{/* Size Selection */}
					<View style={styles.sizeSelectionContainer}>
						<TouchableOpacity
							style={styles.sizeDropdown}
							onPress={toggleSizeDropdown}
						>
							<Text style={styles.sizeText}>
								{t('size')} {selectedSize}
							</Text>
							<MaterialIcons
								name="keyboard-arrow-down"
								size={20}
								color="#BEBDBA"
							/>
						</TouchableOpacity>
					</View>

					{/* Quantity Selector and Price */}
					<View style={styles.quantityPriceContainer}>
						<QuantityControl
							value={quantity}
							onIncrement={incrementQuantity}
							onDecrement={decrementQuantity}
							size="large"
							style={styles.quantityControlCustom}
						/>

						<Text style={styles.priceText}>${PRODUCT.price.toFixed(2)}</Text>
					</View>
					{/* Description Section */}
					<TouchableOpacity
						style={styles.sectionContainer}
						onPress={toggleDescriptionModal}
						activeOpacity={0.7}
					>
						<Text style={styles.sectionTitle}>
							{t('description').toUpperCase()}
						</Text>
						<Text style={styles.descriptionText}>{PRODUCT.description}</Text>
						<View style={styles.readMoreContainer}>
							<Text style={styles.readMoreText}>{t('readMore')}</Text>
							<MaterialIcons
								name="keyboard-arrow-right"
								size={18}
								color="#C67C4E"
							/>
						</View>
					</TouchableOpacity>
					<View style={styles.divider} />
					{/* Reviews Section */}
					<View style={styles.sectionContainer}>
						<Text style={styles.sectionTitle}>
							{t('reviews').toUpperCase()}
						</Text>

						{PRODUCT.reviewsData.map((review, index) => (
							<View
								key={`review-${review.id}`}
								style={[
									styles.reviewItem,
									index > 0 && styles.reviewItemBorder,
								]}
							>
								{/* Reviewer Information */}
								<View style={styles.reviewerContainer}>
									{/* Profile Image */}
									<View style={styles.profileImageContainer}>
										<Image
											source={{ uri: review.userAvatar }}
											style={styles.profileImage}
										/>
									</View>

									{/* Reviewer Details */}
									<View style={styles.reviewerDetails}>
										<Text style={styles.reviewerName}>{review.userName}</Text>
										<Text style={styles.reviewerEmail}>{review.userEmail}</Text>

										{/* User Rating */}
										<View style={styles.userRatingContainer}>
											{[1, 2, 3, 4, 5].map((star) => (
												<AntDesign
													key={`star-${review.id}-${star}`}
													name="star"
													size={14}
													color={
														star <= Math.floor(review.rating)
															? '#F3603F'
															: '#E0E0E0'
													}
													style={{ marginRight: 2 }}
												/>
											))}
											<Text style={styles.reviewDate}>{review.date}</Text>
										</View>
									</View>
								</View>

								{/* Review Text */}
								<View style={styles.reviewTextContainer}>
									<Text style={styles.reviewText}>{review.text}</Text>
								</View>

								{/* Review Images */}
								{review.images && review.images.length > 0 && (
									<ScrollView
										horizontal
										showsHorizontalScrollIndicator={false}
										style={styles.reviewImagesContainer}
										contentContainerStyle={styles.reviewImagesContent}
									>
										{review.images.map((image) => (
											<TouchableOpacity
												key={`review-img-${image.id}`}
												activeOpacity={0.9}
												style={styles.reviewImageWrapper}
												onPress={() => viewReviewImage(image.imageUrl)}
											>
												<Image
													source={{ uri: image.imageUrl }}
													style={styles.reviewImage}
													resizeMode="cover"
												/>
											</TouchableOpacity>
										))}
									</ScrollView>
								)}
							</View>
						))}

						{/* See All Reviews Button */}
						<TouchableOpacity
							style={styles.seeAllReviewsButton}
							onPress={toggleReviewsModal}
						>
							<Text style={styles.seeAllReviewsText}>{t('seeAllReviews')}</Text>
							<MaterialIcons
								name="keyboard-arrow-right"
								size={18}
								color="#C67C4E"
							/>
						</TouchableOpacity>
					</View>
					<View style={styles.divider} />
					{/* Similar Products Section */}
					<View style={styles.sectionContainer}>
						<Text style={styles.similarProductsTitle}>
							{t('similarProducts').toUpperCase()}
						</Text>

						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.similarProductsScrollContent}
						>
							{SIMILAR_PRODUCTS.map((product) => (
								<RegularProductCard
									key={product.productId}
									product={product}
									onToggleFavorite={() => {}}
									style={styles.similarProductCard}
								/>
							))}
						</ScrollView>
					</View>
					{/* Add extra space at the bottom to account for the buttons */}
					<View style={styles.bottomSpacer} />
				</View>
			</ScrollView>

			{/* Description Modal */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={descriptionModalVisible}
				onRequestClose={toggleDescriptionModal}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalContent}>
						{/* Modal Header */}
						<View style={styles.modalHeader}>
							<TouchableOpacity
								style={styles.closeButton}
								onPress={toggleDescriptionModal}
							>
								<Ionicons name="close" size={24} color="#000" />
							</TouchableOpacity>
							<Text style={styles.modalTitle}>{t('description')}</Text>
							<View style={{ width: 24 }} />
						</View>

						{/* Modal Body with Scrollable Content */}
						<ScrollView
							style={styles.modalBody}
							showsVerticalScrollIndicator={false}
						>
							<View style={styles.modalTitleContainer}>
								<View style={styles.modalTitleDecoration} />
								<Text style={styles.productTitleInModal}>{PRODUCT.name}</Text>
							</View>

							<Text style={styles.fullDescription}>
								{PRODUCT.longDescription}
							</Text>
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Size Selection Modal */}
			<Modal
				animationType="fade"
				transparent={true}
				visible={sizeDropdownVisible}
				onRequestClose={toggleSizeDropdown}
			>
				<TouchableOpacity
					style={styles.sizeModalOverlay}
					activeOpacity={1}
					onPress={toggleSizeDropdown}
				>
					<View style={styles.sizeModalContainer}>
						<View style={styles.sizeModalContent}>
							<View style={styles.sizeModalHeader}>
								<Text style={styles.sizeModalTitle}>{t('selectSize')}</Text>
								<TouchableOpacity onPress={toggleSizeDropdown}>
									<Ionicons name="close" size={24} color="#383838" />
								</TouchableOpacity>
							</View>

							<View style={styles.sizeOptionsContainer}>
								{PRODUCT.sizes.map((size) => (
									<TouchableOpacity
										key={size}
										style={[
											styles.sizeOption,
											selectedSize === size && styles.selectedSizeOption,
										]}
										onPress={() => handleSelectSize(size)}
									>
										<Text
											style={[
												styles.sizeOptionText,
												selectedSize === size && styles.selectedSizeOptionText,
											]}
										>
											{size}
										</Text>
									</TouchableOpacity>
								))}
							</View>

							{/* <TouchableOpacity
								style={styles.applyButton}
								onPress={toggleSizeDropdown}
							>
								<Text style={styles.applyButtonText}>{t('apply')}</Text>
							</TouchableOpacity> */}
						</View>
					</View>
				</TouchableOpacity>
			</Modal>

			{/* Reviews Modal */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={reviewsModalVisible}
				onRequestClose={toggleReviewsModal}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalContent}>
						{/* Modal Header */}
						<View style={styles.modalHeader}>
							<TouchableOpacity
								style={styles.closeButton}
								onPress={toggleReviewsModal}
							>
								<Ionicons name="close" size={24} color="#000" />
							</TouchableOpacity>
							<Text style={styles.modalTitle}>{t('reviews')}</Text>
							<View style={{ width: 24 }} />
						</View>

						{/* Modal Body with Scrollable Content */}
						<ScrollView
							style={styles.modalBody}
							showsVerticalScrollIndicator={false}
						>
							{PRODUCT.reviewsData.map((review) => (
								<View
									key={`modal-review-${review.id}`}
									style={styles.reviewItem}
								>
									{/* Reviewer Information */}
									<View style={styles.reviewerContainer}>
										{/* Profile Image */}
										<View style={styles.profileImageContainer}>
											<Image
												source={{ uri: review.userAvatar }}
												style={styles.profileImage}
											/>
										</View>

										{/* Reviewer Details */}
										<View style={styles.reviewerDetails}>
											<Text style={styles.reviewerName}>{review.userName}</Text>
											<Text style={styles.reviewerEmail}>
												{review.userEmail}
											</Text>

											{/* User Rating */}
											<View style={styles.userRatingContainer}>
												{[1, 2, 3, 4, 5].map((star) => (
													<AntDesign
														key={`modal-star-${review.id}-${star}`}
														name="star"
														size={14}
														color={
															star <= Math.floor(review.rating)
																? '#F3603F'
																: '#E0E0E0'
														}
														style={{ marginRight: 2 }}
													/>
												))}
												<Text style={styles.reviewDate}>{review.date}</Text>
											</View>
										</View>
									</View>

									{/* Review Text */}
									<View style={styles.reviewTextContainer}>
										<Text style={styles.reviewText}>{review.text}</Text>
									</View>

									{/* Review Images */}
									{review.images && review.images.length > 0 && (
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											style={styles.reviewImagesContainer}
											contentContainerStyle={styles.reviewImagesContent}
										>
											{review.images.map((image) => (
												<TouchableOpacity
													key={`modal-review-img-${image.id}`}
													activeOpacity={0.9}
													style={styles.reviewImageWrapper}
													onPress={() => viewReviewImage(image.imageUrl)}
												>
													<Image
														source={{ uri: image.imageUrl }}
														style={styles.reviewImage}
														resizeMode="cover"
													/>
												</TouchableOpacity>
											))}
										</ScrollView>
									)}
								</View>
							))}
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Review Image Fullscreen Modal */}
			<Modal
				animationType="fade"
				transparent={true}
				visible={!!selectedReviewImage}
				onRequestClose={closeReviewImageView}
			>
				<TouchableOpacity
					style={styles.fullscreenImageOverlay}
					activeOpacity={1}
					onPress={closeReviewImageView}
				>
					<Image
						source={
							selectedReviewImage ? { uri: selectedReviewImage } : undefined
						}
						style={styles.fullscreenImage}
						resizeMode="contain"
					/>
				</TouchableOpacity>
			</Modal>

			{/* Add to Cart Button */}
			<View style={styles.addToCartContainer}>
				<Button
					text={t('addToCart')}
					backgroundColor="#c67c4e"
					textColor="#ffffff"
					onPress={handleAddToCart}
					style={styles.addToCartButton}
				/>
			</View>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	scrollView: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	scrollViewContent: {
		paddingBottom: 130, // Add padding to account for the Add to Cart button and bottom bar
	},
	imageContainer: {
		position: 'relative',
		width: '100%',
		height: 350,
	},
	carousel: {
		width: '100%',
		height: '100%',
	},
	backButtonContainer: {
		position: 'absolute',
		top: 15,
		left: 15,
	},
	backButton: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	favoriteButton: {
		position: 'absolute',
		top: 15,
		right: 15,
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	detailsContainer: {
		paddingHorizontal: 20,
		paddingTop: 20,
	},
	productName: {
		fontSize: 24,
		fontFamily: 'Inter-SemiBold',
		color: '#383838',
		marginBottom: 10,
	},
	ratingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	starContainer: {
		flexDirection: 'row',
		marginRight: 8,
	},
	ratingText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#383838',
		marginRight: 5,
	},
	reviewsText: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#7C7C7C',
	},
	sizeSelectionContainer: {
		marginBottom: 20,
	},
	sizeDropdown: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: 'rgba(191, 173, 142, 0.15)',
		borderRadius: 10,
		paddingHorizontal: 15,
		paddingVertical: 12,
	},
	sizeText: {
		fontSize: 16,
		fontFamily: 'Inter-Regular',
		color: '#000000',
	},
	quantityPriceContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 20,
	},
	quantityControlCustom: {
		backgroundColor: '#F9F9F9',
		borderRadius: 40,
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	priceText: {
		fontSize: 24,
		fontFamily: 'Inter-Medium',
		color: '#968B7B',
	},
	sectionContainer: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#000000',
		marginBottom: 10,
	},
	descriptionText: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#7C7C7C',
		lineHeight: 22,
	},
	divider: {
		height: 1,
		backgroundColor: '#E2E2E2',
		marginVertical: 20,
	},
	reviewerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 15,
	},
	profileImageContainer: {
		width: 54,
		height: 54,
		borderRadius: 27,
		overflow: 'hidden',
		marginRight: 15,
		backgroundColor: '#EDE9E0',
	},
	profileImage: {
		width: '100%',
		height: '100%',
	},
	reviewerDetails: {
		flex: 1,
	},
	reviewerName: {
		fontSize: 14,
		fontFamily: 'Inter-Bold',
		color: '#181725',
		marginBottom: 2,
	},
	reviewerEmail: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#7C7C7C',
	},
	reviewTextContainer: {
		backgroundColor: '#EDE9E0',
		borderRadius: 12,
		padding: 15,
	},
	reviewText: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#000000',
	},
	similarProductsTitle: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#000000',
		textAlign: 'center',
		marginBottom: 15,
	},
	similarProductsScrollContent: {
		paddingBottom: 5,
	},
	similarProductCard: {
		width: width * 0.35,
		marginRight: 15,
	},
	bottomSpacer: {
		height: height * 0.01, // Additional space at the bottom of the content
	},
	addToCartContainer: {
		paddingHorizontal: 20,
		paddingVertical: 3,
		backgroundColor: 'transparent',
		position: 'absolute',
		bottom: 12, // Space for the bottom bar
		left: 0,
		right: 0,
		zIndex: 1000, // Ensure it's above the content
	},
	addToCartButton: {
		width: '100%',
	},
	readMoreContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
	},
	readMoreText: {
		color: '#C67C4E',
		fontFamily: 'Inter-Medium',
		fontSize: 14,
	},
	modalContainer: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 30,
		borderTopRightRadius: 30,
		paddingBottom: 25,
		height: height * 0.7,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 15,
		paddingHorizontal: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#F1F1F1',
	},
	closeButton: {
		padding: 5,
	},
	modalTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E',
		textAlign: 'center',
	},
	modalBody: {
		paddingHorizontal: 20,
		paddingTop: 20,
	},
	modalTitleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	modalTitleDecoration: {
		width: 4,
		height: 20,
		backgroundColor: '#C67C4E',
		marginRight: 10,
		borderRadius: 2,
	},
	productTitleInModal: {
		fontSize: 18,
		fontFamily: 'Inter-Bold',
		color: '#000000',
	},
	fullDescription: {
		fontSize: 16,
		fontFamily: 'Inter-Regular',
		color: '#7C7C7C',
		lineHeight: 24,
		letterSpacing: 0.5,
	},
	reviewItem: {
		marginBottom: 20,
	},
	reviewItemBorder: {
		borderTopWidth: 1,
		borderTopColor: '#E2E2E2',
		paddingTop: 20,
	},
	userRatingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 5,
	},
	reviewDate: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#7C7C7C',
		marginLeft: 10,
	},
	reviewImagesContainer: {
		marginTop: 15,
	},
	reviewImagesContent: {
		paddingVertical: 5,
	},
	reviewImageWrapper: {
		marginRight: 12,
		borderRadius: 30,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#E2E2E2',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	reviewImage: {
		width: 120,
		height: 120,
		borderRadius: 12,
	},
	seeAllReviewsButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 15,
		padding: 12,
		backgroundColor: '#F9F9F9',
		borderRadius: 12,
	},
	seeAllReviewsText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
		marginRight: 5,
	},
	sizeModalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	sizeModalContainer: {
		width: '80%',
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		padding: 20,
	},
	sizeModalContent: {
		alignItems: 'center',
	},
	sizeModalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		marginBottom: 20,
	},
	sizeModalTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#383838',
	},
	sizeOptionsContainer: {
		width: '100%',
	},
	sizeOption: {
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: 10,
		backgroundColor: '#F9F9F9',
		marginBottom: 10,
	},
	selectedSizeOption: {
		backgroundColor: '#C67C4E',
	},
	sizeOptionText: {
		fontSize: 16,
		fontFamily: 'Inter-Regular',
		color: '#383838',
		textAlign: 'center',
	},
	selectedSizeOptionText: {
		color: '#FFFFFF',
	},
	applyButton: {
		marginTop: 20,
		backgroundColor: '#C67C4E',
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 10,
	},
	applyButtonText: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#FFFFFF',
		textAlign: 'center',
	},
	fullscreenImageOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.9)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	fullscreenImage: {
		width: '90%',
		height: '90%',
	},
})
