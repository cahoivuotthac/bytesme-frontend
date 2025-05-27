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
	ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons, AntDesign, Feather, MaterialIcons } from '@expo/vector-icons'
import NavButton from '@/components/shared/NavButton'
import Button from '@/components/ui/Button'
import RegularProductCard from '@/components/product/RegularProductCard'
import { useTranslation } from '@/providers/locale'
import ImageCarousel from '@/components/shared/ImageCarousel'
import { APIClient, cartAPI, productAPI } from '@/utils/api'
import { useAlert } from '@/hooks/useAlert'
import QuantityControl from '@/components/ui/QuantityControl'
import BottomSpacer from '@/components/shared/BottomSpacer'

const { width, height } = Dimensions.get('window')

interface RelatedProduct {
	category_id: number
	discount_percentage: number
	product_id: number
	product_name: string
	image_url: string
	sizes: string[]
	prices: number[]
}

export default function ProductDetailScreen() {
	const params = useLocalSearchParams()
	const productId = Number(params.id)

	const { t } = useTranslation()
	const [product, setProduct] = useState<any>(null)
	const [isFavorite, setIsFavorite] = useState(false)
	const [selectedSize, setSelectedSize] = useState('M')
	const [quantity, setQuantity] = useState(1)
	const [descriptionModalVisible, setDescriptionModalVisible] = useState(false)
	const [sizeDropdownVisible, setSizeDropdownVisible] = useState(false)
	const [reviewsModalVisible, setReviewsModalVisible] = useState(false)
	const [selectedReviewImage, setSelectedReviewImage] = useState('')
	const [feedbackPageNum, setFeedbackPageNum] = useState(1)
	const [feedbacks, setFeedbacks] = useState<any[]>([])
	const [feedbackLoading, setFeedbackLoading] = useState(false)
	const [feedbackHasMore, setFeedbackHasMore] = useState(true)
	const FEEDBACK_PAGE_SIZE = 10
	const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
	const [loadingRelatedProducts, setLoadingRelatedProducts] = useState(false)
	const RELATED_PRODUCTS_LIMIT = 7

	const { AlertComponent, showError, showInfo } = useAlert()

	// Function to fetch product details
	const fetchProductDetails = async () => {
		try {
			const response = await productAPI.getProductDetails(productId)
			console.log('Fetched products: ', response.data)
			setProduct(response.data)
			setIsFavorite(response.data.is_favorited)
			if (response.data.sizes && response.data.sizes.length > 0) {
				setSelectedSize(response.data.sizes[0])
			}
		} catch (error) {
			console.error('Error fetching product details:', error)
			showError(t('errorFetchingProductDetails'))
		}
	}

	// Function to fetch feedbacks (reviews)
	const transformFeedback = (fb: any) => ({
		id: fb.order_feedback_id,
		userName: fb.user?.name || t('anonymousUser'),
		userAvatar: fb.user?.avatar,
		// userEmail: '', // If you have email, map it here
		rating: fb.num_star,
		text: fb.feedback_content || '',
		date: fb.created_at ? new Date(fb.created_at).toLocaleDateString() : '',
		images: (fb.feedback_images || []).map((img: any, idx: number) => ({
			id: idx,
			imageUrl: img.feedback_image,
		})),
	})

	const fetchProductFeedbacks = async (
		offset = 0,
		limit = FEEDBACK_PAGE_SIZE,
		append = false
	) => {
		setFeedbackLoading(true)
		try {
			const response = await productAPI.getProductFeedbacks(
				productId,
				offset,
				limit
			)
			const newFeedbacks = (response.data.product_feedbacks || []).map(
				transformFeedback
			)
			console.log('newFeedback: ', newFeedbacks)
			const hasMore =
				response.data.has_more !== undefined
					? response.data.has_more
					: newFeedbacks.length === limit
			if (append) {
				setFeedbacks((prev) => [...prev, ...newFeedbacks])
			} else {
				setFeedbacks(newFeedbacks)
			}
			setFeedbackHasMore(hasMore)
		} catch (err) {
			console.error('Error fetching feedbacks:', err)
			showError(t('errorFetchingProductDetails'))
		} finally {
			setFeedbackLoading(false)
		}
	}

	// Function to fetch similar products
	const fetchRelatedProducts = async () => {
		setLoadingRelatedProducts(true)
		try {
			const response = await productAPI.getRelatedProducts(
				productId,
				RELATED_PRODUCTS_LIMIT
			)
			console.log('Fetched related products: ', response.data)
			setRelatedProducts(response.data)
		} catch (error) {
			console.error('Error fetching similar products:', error)
			showError(t('errorFetchingProductDetails'))
		} finally {
			setLoadingRelatedProducts(false)
		}
	}

	useEffect(() => {
		if (productId) {
			fetchProductDetails()
			fetchProductFeedbacks(0, 5) // only fetch 5 on initial load
			fetchRelatedProducts() // Add this line to fetch related products
		}
	}, [productId])

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
	const viewReviewImage = (imageUrl: string) => {
		setSelectedReviewImage(imageUrl)
	}

	// Close review image view
	const closeReviewImageView = () => {
		setSelectedReviewImage('')
	}

	// Handle add to cart
	const handleAddToCart = async () => {
		// Implementation would depend on your cart management system
		try {
			await cartAPI.addItemToCart(productId, quantity, selectedSize)
			showInfo(t('addedToCart'))
			setQuantity(1) // Reset quantity
		} catch (err) {
			console.error('Error adding to cart:', err)
			showError(t('errorAddingToCart'))
		}
	}

	// Toggle description modal
	const toggleDescriptionModal = () => {
		setDescriptionModalVisible(!descriptionModalVisible)
	}

	// Custom Related Product Card Component
	const RelatedProductCard = ({ product }: { product: RelatedProduct }) => {
		const getSelectedSizeIndex = () => {
			return product.sizes
				? product.sizes.indexOf('M') !== -1
					? product.sizes.indexOf('M')
					: 0
				: 0
		}

		const getPrice = () => {
			const sizeIndex = getSelectedSizeIndex()
			return product.prices && product.prices[sizeIndex]
				? product.prices[sizeIndex]
				: 0
		}

		const getDiscountedPrice = () => {
			const originalPrice = getPrice()
			return Math.round(originalPrice * (1 - product.discount_percentage / 100))
		}

		const navigateToProduct = () => {
			router.push({
				pathname: '/(home)/product/[id]',
				params: { id: product.product_id },
			})
		}

		return (
			<TouchableOpacity
				style={styles.relatedProductCard}
				onPress={navigateToProduct}
				activeOpacity={0.8}
			>
				<View style={styles.relatedProductImageContainer}>
					<View style={styles.relatedProductImagePlaceholder}>
						{product.image_url ? (
							<Image
								source={{ uri: product.image_url }}
								style={{
									width: '100%',
									height: '100%',
									borderRadius: 10,
									resizeMode: 'cover',
								}}
							/>
						) : (
							<Ionicons name="image-outline" size={32} color="#C67C4E" />
						)}
					</View>
					{product.discount_percentage > 0 && (
						<View style={styles.relatedProductDiscountBadge}>
							<Text style={styles.relatedProductDiscountText}>
								-{product.discount_percentage}%
							</Text>
						</View>
					)}
				</View>

				<View style={styles.relatedProductInfo}>
					<Text style={styles.relatedProductName} numberOfLines={2}>
						{product.product_name}
					</Text>

					<View style={styles.relatedProductPriceContainer}>
						{product.discount_percentage > 0 ? (
							<>
								<Text style={styles.relatedProductDiscountedPrice}>
									{getDiscountedPrice().toLocaleString()}₫
								</Text>
								<Text style={styles.relatedProductOriginalPrice}>
									{getPrice().toLocaleString()}₫
								</Text>
							</>
						) : (
							<Text style={styles.relatedProductPrice}>
								{getPrice().toLocaleString()}₫
							</Text>
						)}
					</View>

					<View style={styles.relatedProductFooter}>
						<View style={styles.relatedProductSizeIndicator}>
							<Text style={styles.relatedProductSizeText}>
								{product.sizes && product.sizes.length > 0
									? product.sizes[0]
									: 'M'}
							</Text>
						</View>

						<TouchableOpacity
							style={styles.relatedProductAddButton}
							onPress={(e) => {
								e.stopPropagation()
								handleAddToCart()
							}}
						>
							<Ionicons name="add" size={16} color="#FFFFFF" />
						</TouchableOpacity>
					</View>
				</View>
			</TouchableOpacity>
		)
	}

	// Loading skeleton component for related products
	const RelatedProductSkeleton = () => (
		<View style={styles.relatedProductCard}>
			<View style={styles.relatedProductImageContainer}>
				<View
					style={[
						styles.relatedProductImagePlaceholder,
						styles.skeletonShimmer,
					]}
				/>
			</View>
			<View style={styles.relatedProductInfo}>
				<View
					style={[
						styles.skeletonLine,
						{ width: '80%', height: 16, marginBottom: 8 },
					]}
				/>
				<View
					style={[
						styles.skeletonLine,
						{ width: '60%', height: 14, marginBottom: 8 },
					]}
				/>
				<View style={styles.relatedProductFooter}>
					<View
						style={[
							styles.skeletonLine,
							{ width: 30, height: 20, borderRadius: 6 },
						]}
					/>
					<View
						style={[
							styles.skeletonLine,
							{ width: 28, height: 28, borderRadius: 8 },
						]}
					/>
				</View>
			</View>
		</View>
	)

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}
			<StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
			{!product ? (
				<View
					style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
				>
					<ActivityIndicator size="large" color="#C67C4E" />
				</View>
			) : (
				<ScrollView
					style={styles.scrollView}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollViewContent}
				>
					{/* Product Image Section */}
					<View style={styles.imageContainer}>
						<ImageCarousel
							items={
								product?.image_urls?.map((url: string, idx: number) => ({
									id: String(idx),
									imageUrl: url,
									title: '',
								})) || []
							}
							height={350}
							autoPlayInterval={0}
							showTextOverlay={false}
							enableNavigation={false}
							borderRadius={30}
							style={styles.carousel}
						/>
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
						<TouchableOpacity
							style={styles.favoriteButton}
							onPress={toggleFavorite}
						>
							<Ionicons
								name={isFavorite ? 'heart' : 'heart-outline'}
								size={24}
								color="#C67C4E"
							/>
						</TouchableOpacity>
					</View>

					{/* Product Details Section */}
					<View style={styles.detailsContainer}>
						<Text style={styles.productName}>{product?.product_name}</Text>
						<View style={styles.ratingContainer}>
							<View style={styles.starContainer}>
								{[1, 2, 3, 4, 5].map((star) => (
									<AntDesign
										key={star}
										name="star"
										size={16}
										color={
											product &&
											star <= Math.floor(product.product_overall_stars)
												? '#F3603F'
												: '#E0E0E0'
										}
										style={{ marginRight: 2 }}
									/>
								))}
							</View>
							<Text style={styles.ratingText}>
								{product?.product_overall_stars?.toFixed(1) || ''}
							</Text>
							<Text style={styles.reviewsText}>
								({product?.product_total_ratings || 0} {t('ratings')})
							</Text>
						</View>
						{/* Size Selection */}
						{product?.sizes && (
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
						)}
						{/* Quantity Selector and Price */}
						<View style={styles.quantityPriceContainer}>
							<QuantityControl
								value={quantity}
								onIncrement={incrementQuantity}
								onDecrement={decrementQuantity}
								size="large"
								style={styles.quantityControlCustom}
							/>
							<Text style={styles.priceText}>
								{product?.prices && product.prices.length > 0
									? `${product.prices[
											product.sizes?.indexOf(selectedSize) ?? 0
									  ]?.toLocaleString()}₫`
									: ''}
							</Text>
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
							<Text style={styles.descriptionText}>
								{product?.product_description}
							</Text>
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

							{feedbacks.slice(0, 2).map((review, index) => (
								<View key={`review-${review.id}`} style={styles.reviewCard}>
									<View style={styles.reviewHeaderRow}>
										<View style={styles.avatarWrapper}>
											{review.userAvatar ? (
												<Image
													source={{ uri: review.userAvatar }}
													style={styles.avatarImage}
												/>
											) : (
												<Text style={styles.avatarInitial}>
													{review.userName?.[0]?.toUpperCase() || 'U'}
												</Text>
											)}
										</View>
										<View style={styles.reviewHeaderText}>
											<Text style={styles.reviewerName}>{review.userName}</Text>
											<View style={styles.reviewRatingRow}>
												{[1, 2, 3, 4, 5].map((star) => (
													<AntDesign
														key={`star-${review.id}-${star}`}
														name="star"
														size={14}
														color={
															star <= Math.floor(review.rating)
																? '#FFB300'
																: '#E0E0E0'
														}
														style={{ marginRight: 1 }}
													/>
												))}
												<Text style={styles.reviewDate}>{review.date}</Text>
											</View>
										</View>
									</View>
									{review.text ? (
										<View style={styles.reviewTextBubble}>
											<Text style={styles.reviewText}>{review.text}</Text>
										</View>
									) : null}
									{review.images && review.images.length > 0 && (
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											style={styles.reviewImagesContainer}
											contentContainerStyle={styles.reviewImagesContent}
										>
											{review.images.map((image: any) => (
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
									{index < Math.min(1, feedbacks.length - 1) && (
										<View style={styles.reviewDivider} />
									)}
								</View>
							))}

							{/* See All Reviews Button */}
							<TouchableOpacity
								style={styles.seeAllReviewsButton}
								onPress={toggleReviewsModal}
							>
								<Text style={styles.seeAllReviewsText}>
									{t('seeAllReviews')}
								</Text>
								<MaterialIcons
									name="keyboard-arrow-right"
									size={18}
									color="#C67C4E"
								/>
							</TouchableOpacity>
						</View>
						<View style={styles.divider} />
						{/* Similar Products Section */}
						<View style={styles.relatedProductsSection}>
							<View style={styles.relatedProductsHeader}>
								<View style={styles.relatedProductsHeaderDecoration} />
								<Text style={styles.relatedProductsTitle}>
									{t('similarProducts')}
								</Text>
								<View style={styles.relatedProductsHeaderLine} />
							</View>

							<Text style={styles.relatedProductsSubtitle}>
								{t('relatedProducts')}
							</Text>

							{/* Related Products List */}
							{loadingRelatedProducts ? (
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={styles.relatedProductsScrollContent}
									style={styles.relatedProductsScroll}
								>
									{Array.from({ length: 3 }).map((_, index) => (
										<RelatedProductSkeleton key={`skeleton-${index}`} />
									))}
								</ScrollView>
							) : relatedProducts.length > 0 ? (
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={styles.relatedProductsScrollContent}
									style={styles.relatedProductsScroll}
								>
									{relatedProducts.map((product, index) => (
										<RelatedProductCard
											key={`related-${product.product_id}-${index}`}
											product={product}
										/>
									))}
								</ScrollView>
							) : (
								<View style={styles.noRelatedProductsContainer}>
									<Ionicons
										name="storefront-outline"
										size={48}
										color="#C67C4E"
									/>
									<Text style={styles.noRelatedProductsText}>
										{t('noRelatedProducts')}
									</Text>
								</View>
							)}
						</View>
						{/* Add extra space at the bottom to account for the buttons */}
						<View style={styles.bottomButtonSpacer} />
					</View>
				</ScrollView>
			)}

			{/* Add to Cart Button - Moved outside of ScrollView to be fixed at bottom */}
			<View style={styles.addToCartContainer}>
				<Button
					text={t('addToCart')}
					backgroundColor="#c67c4e"
					textColor="#ffffff"
					onPress={handleAddToCart}
					style={styles.addToCartButton}
				/>
			</View>

			{/* Description Modal */}
			{product && (
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
									<Text style={styles.productTitleInModal}>
										{product.product_name}
									</Text>
								</View>

								<Text style={styles.fullDescription}>
									{product.product_description}
								</Text>
							</ScrollView>
						</View>
					</View>
				</Modal>
			)}

			{/* Size Selection Modal */}
			{product && (
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
									{product.sizes.map((size: string) => (
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
													selectedSize === size &&
														styles.selectedSizeOptionText,
												]}
											>
												{size}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							</View>
						</View>
					</TouchableOpacity>
				</Modal>
			)}

			{/* Reviews Modal */}
			{product && (
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
								{feedbacks.map((review, index) => (
									<View
										key={`modal-review-${review.id}`}
										style={styles.reviewCard}
									>
										<View style={styles.reviewHeaderRow}>
											<View style={styles.avatarWrapper}>
												{review.userAvatar ? (
													<Image
														source={{ uri: review.userAvatar }}
														style={styles.avatarImage}
													/>
												) : (
													<Text style={styles.avatarInitial}>
														{review.userName?.[0]?.toUpperCase() || 'U'}
													</Text>
												)}
											</View>
											<View style={styles.reviewHeaderText}>
												<Text style={styles.reviewerName}>
													{review.userName}
												</Text>
												<View style={styles.reviewRatingRow}>
													{[1, 2, 3, 4, 5].map((star) => (
														<AntDesign
															key={`modal-star-${review.id}-${star}`}
															name="star"
															size={14}
															color={
																star <= Math.floor(review.rating)
																	? '#FFB300'
																	: '#E0E0E0'
															}
															style={{ marginRight: 1 }}
														/>
													))}
													<Text style={styles.reviewDate}>{review.date}</Text>
												</View>
											</View>
										</View>
										{review.text ? (
											<View style={styles.reviewTextBubble}>
												<Text style={styles.reviewText}>{review.text}</Text>
											</View>
										) : null}
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
										{index < feedbacks.length - 1 && (
											<View style={styles.reviewDivider} />
										)}
									</View>
								))}
								{feedbackLoading && (
									<ActivityIndicator
										size="small"
										color="#C67C4E"
										style={{ marginVertical: 16 }}
									/>
								)}
								{feedbackHasMore && !feedbackLoading && (
									<TouchableOpacity
										style={styles.seeAllReviewsButton}
										onPress={() =>
											fetchProductFeedbacks(
												feedbacks.length,
												FEEDBACK_PAGE_SIZE,
												true
											)
										}
									>
										<Text style={styles.seeAllReviewsText}>
											{t('viewMoreReviews')}
										</Text>
										<MaterialIcons
											name="keyboard-arrow-down"
											size={18}
											color="#C67C4E"
										/>
									</TouchableOpacity>
								)}
							</ScrollView>
						</View>
					</View>
				</Modal>
			)}

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
	avatarImage: {
		width: '100%',
		height: '100%',
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
	bottomButtonSpacer: {
		height: height * 0.01, // Additional space at the bottom of the content
	},
	addToCartContainer: {
		paddingHorizontal: 20,
		paddingVertical: 3,
		backgroundColor: 'transparent',
		position: 'absolute',
		bottom: 80, // Space for the bottom bar
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
	reviewCard: {
		backgroundColor: '#FFF',
		borderRadius: 16,
		padding: 16,
		marginBottom: 18,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 6,
		elevation: 2,
	},
	reviewHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	avatarWrapper: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: '#F3E9D7',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
		overflow: 'hidden',
	},
	avatarInitial: {
		fontSize: 18,
		fontFamily: 'Inter-Bold',
		color: '#C67C4E',
	},
	reviewHeaderText: {
		flex: 1,
	},
	reviewerName: {
		fontSize: 15,
		fontFamily: 'Inter-Bold',
		color: '#2D2D2D',
		marginBottom: 2,
	},
	reviewRatingRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	reviewDate: {
		fontSize: 12,
		color: '#B0AFAF',
		marginLeft: 8,
	},
	reviewTextBubble: {
		backgroundColor: '#F6F3ED',
		borderRadius: 10,
		padding: 12,
		marginTop: 4,
		marginBottom: 4,
	},
	reviewText: {
		fontSize: 14,
		color: '#3D3D3D',
		lineHeight: 20,
		fontFamily: 'Inter-Regular',
	},
	reviewImagesContainer: {
		marginTop: 8,
	},
	reviewImagesContent: {
		paddingVertical: 2,
	},
	reviewImageWrapper: {
		marginRight: 10,
		borderRadius: 12,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#F3E9D7',
	},
	reviewImage: {
		width: 80,
		height: 80,
		borderRadius: 12,
		backgroundColor: '#F8F1E9',
	},
	reviewDivider: {
		height: 1,
		backgroundColor: '#F3E9D7',
		marginVertical: 8,
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

	// Related Products Section Styles
	relatedProductsSection: {
		marginTop: 10,
		marginBottom: 20,
	},
	relatedProductsHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	relatedProductsHeaderDecoration: {
		width: 4,
		height: 24,
		backgroundColor: '#C67C4E',
		borderRadius: 2,
		marginRight: 12,
	},
	relatedProductsTitle: {
		fontSize: 18,
		fontFamily: 'Inter-Bold',
		color: '#2D2D2D',
		marginRight: 12,
	},
	relatedProductsHeaderLine: {
		flex: 1,
		height: 1,
		backgroundColor: '#E8E8E8',
	},
	relatedProductsSubtitle: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#7C7C7C',
		marginBottom: 16,
		marginLeft: 16,
	},
	relatedProductsScroll: {
		marginHorizontal: -20,
	},
	relatedProductsScrollContent: {
		paddingHorizontal: 20,
		paddingBottom: 8,
	},
	noRelatedProductsContainer: {
		alignItems: 'center',
		paddingVertical: 32,
		backgroundColor: '#FAFAFA',
		borderRadius: 16,
		marginHorizontal: 4,
	},
	noRelatedProductsText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#999999',
		marginTop: 12,
	},

	// Related Product Card Styles
	relatedProductCard: {
		width: width * 0.42,
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		marginRight: 16,
		shadowColor: '#C67C4E',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 4,
		borderWidth: 0.5,
		borderColor: 'rgba(198, 124, 78, 0.1)',
	},
	relatedProductImageContainer: {
		position: 'relative',
		height: width * 0.32,
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		overflow: 'hidden',
	},
	relatedProductImagePlaceholder: {
		flex: 1,
		backgroundColor: '#F8F4EF',
		justifyContent: 'center',
		alignItems: 'center',
	},
	relatedProductDiscountBadge: {
		position: 'absolute',
		top: 8,
		right: 8,
		backgroundColor: '#FF4757',
		borderRadius: 8,
		paddingHorizontal: 6,
		paddingVertical: 2,
	},
	relatedProductDiscountText: {
		fontSize: 10,
		fontFamily: 'Inter-Bold',
		color: '#FFFFFF',
	},
	relatedProductInfo: {
		padding: 12,
		flex: 1,
		justifyContent: 'space-between',
	},
	relatedProductName: {
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#2D2D2D',
		lineHeight: 18,
		marginBottom: 8,
		minHeight: 36,
	},
	relatedProductPriceContainer: {
		marginBottom: 8,
	},
	relatedProductPrice: {
		fontSize: 16,
		fontFamily: 'Inter-Bold',
		color: '#C67C4E',
	},
	relatedProductDiscountedPrice: {
		fontSize: 16,
		fontFamily: 'Inter-Bold',
		color: '#C67C4E',
		marginBottom: 2,
	},
	relatedProductOriginalPrice: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#999999',
		textDecorationLine: 'line-through',
	},
	relatedProductFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	relatedProductSizeIndicator: {
		backgroundColor: 'rgba(198, 124, 78, 0.1)',
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	relatedProductSizeText: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
	},
	relatedProductAddButton: {
		backgroundColor: '#C67C4E',
		borderRadius: 8,
		width: 28,
		height: 28,
		justifyContent: 'center',
		alignItems: 'center',
	},

	// Loading skeleton styles
	skeletonShimmer: {
		backgroundColor: '#F0F0F0',
	},
	skeletonLine: {
		backgroundColor: '#F0F0F0',
		borderRadius: 4,
	},
})
