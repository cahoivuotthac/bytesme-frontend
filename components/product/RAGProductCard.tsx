import React, { useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	Dimensions,
	ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@/utils/display'
import { useTranslation } from '@/providers/locale'
import { cartAPI } from '@/utils/api'
import { useAlert } from '@/hooks/useAlert'
import { LinearGradient } from 'expo-linear-gradient'
import { useBottomBarControl } from '@/providers/BottomBarControlProvider'
import QuantityControl from '../ui/QuantityControl'

// Get screen dimensions for responsive sizing
const { width } = Dimensions.get('window')

interface RAGProductCardProps {
	/**
	 * Product data from the RAG search results
	 */
	product: {
		product_id: number
		product_code: string
		product_name: string
		category_name: string
		description: string
		image_url?: string
		sizes_prices: Record<string, any>
		overall_stars?: number
		total_ratings?: number
		total_orders?: number
		discount_percentage?: number
	}
}

/**
 * A component to display products returned by RAG search
 */
const RAGProductCard: React.FC<RAGProductCardProps> = ({ product }) => {
	// State to track selected size index
	const [selectedSizeIndex, setSelectedSizeIndex] = useState(0)
	const [selectedQuantity, setSelectedQuantity] = useState(1) // Default to 1 instead of 0
	const [addingToCart, setAddingToCart] = useState(false)
	const { locale, t } = useTranslation()
	const { showError, showSuccess } = useAlert()
	const { incrementCartItemCount } = useBottomBarControl()

	// Parse the sizes_prices JSON string
	const parseSizesAndPrices = () => {
		try {
			let sizesPricesObj

			// Check if sizes_prices is already an object or needs parsing
			if (typeof product.sizes_prices === 'string') {
				try {
					sizesPricesObj = JSON.parse(product.sizes_prices)
				} catch (e) {
					console.log('Failed to parse sizes_prices string:', e)
					// Fallback to default
					return {
						sizes: ['Standard'],
						prices: [0],
						hasMultipleSizes: false,
					}
				}
			} else {
				// Already an object, use directly
				sizesPricesObj = product.sizes_prices
			}

			// Now safely extract sizes and prices
			const sizes =
				sizesPricesObj && sizesPricesObj.product_sizes
					? sizesPricesObj.product_sizes.split('|')
					: ['Standard']

			const priceValue =
				sizesPricesObj && sizesPricesObj.product_prices
					? sizesPricesObj.product_prices
					: 0

			// Handle case where prices might be a single value or an array
			const prices =
				typeof priceValue === 'string' && priceValue.includes('|')
					? priceValue.split('|').map((p) => parseInt(p, 10))
					: [
							typeof priceValue === 'number'
								? priceValue
								: parseInt(priceValue || '0', 10),
					  ]

			return {
				sizes,
				prices,
				hasMultipleSizes: sizes.length > 1 && sizes[0] !== 'Standard',
			}
		} catch (error) {
			console.error('Error parsing sizes and prices:', error)
			return {
				sizes: ['Standard'],
				prices: [0],
				hasMultipleSizes: false,
			}
		}
	}

	// Get parsed sizes and prices
	const { sizes, prices, hasMultipleSizes } = parseSizesAndPrices()

	// Handle add to cart button press
	const handleAddToCart = async () => {
		if (selectedQuantity <= 0) {
			showError(t('pleaseSelectQuantity'))
			return
		}

		setAddingToCart(true)
		try {
			await cartAPI.addItemToCart(
				product.product_id,
				selectedQuantity,
				sizes[selectedSizeIndex]
			)
			showSuccess(t('productAddedToCart'))
			setSelectedQuantity(1) // Reset quantity after adding
			incrementCartItemCount() // Increment cart item count badge
		} catch (error) {
			console.error('Error adding to cart:', error)
			showError(t('errorAddingToCart'))
		} finally {
			setAddingToCart(false)
		}
	}

	const handlePress = () => {
		// Navigate to product detail page using the product code
		router.push({
			pathname: '/(home)/product/[id]',
			params: { id: product.product_id },
		})
	}

	// Handle size selection
	const handleSizeSelect = (index: number) => {
		setSelectedSizeIndex(index)
	}

	// Use placeholder image if no image URL is provided
	const placeholderImage =
		'https://varenychok.com/wp-content/uploads/2024/05/img-placeholder.webp'
	const imageUrl = product.image_url || placeholderImage

	// Format ratings to one decimal place if available
	const formattedRating = product.overall_stars
		? product.overall_stars.toFixed(1)
		: null

	// Calculate current price based on selected size
	const currentPrice = prices[selectedSizeIndex] || 0

	// Calculate final price if there's a discount
	const finalPrice = product.discount_percentage
		? currentPrice * (1 - product.discount_percentage / 100)
		: currentPrice

	return (
		<TouchableOpacity
			style={styles.container}
			onPress={handlePress}
			activeOpacity={0.9}
		>
			<View style={styles.card}>
				<View style={styles.imageContainer}>
					<Image
						source={{ uri: imageUrl }}
						style={styles.image}
						resizeMode="cover"
					/>
					{product.discount_percentage && (
						<View style={styles.discountTag}>
							<Text style={styles.discountText}>
								-{product.discount_percentage}%
							</Text>
						</View>
					)}
				</View>

				<View style={styles.content}>
					<View>
						{/* Fix the category and HOT tag rendering */}
						<View style={styles.categoryContainer}>
							<Text style={styles.category} numberOfLines={1}>
								{product.category_name}
							</Text>
							{product.total_orders && product.total_orders > 100 && (
								<Text style={styles.hotTag}>HOT</Text>
							)}
						</View>

						<Text style={styles.name} numberOfLines={2}>
							{product.product_name}
						</Text>

						{/* Rating row */}
						{formattedRating && (
							<View style={styles.ratingRow}>
								<Ionicons name="star" size={14} color="#FFD700" />
								<Text style={styles.rating}>{formattedRating}</Text>
								{product.total_ratings && (
									<Text style={styles.ratingCount}>
										({product.total_ratings})
									</Text>
								)}
							</View>
						)}
					</View>

					{/* Size selection row */}
					{hasMultipleSizes && (
						<View style={styles.sizesRow}>
							{sizes.map((size: string, index: number) => (
								<TouchableOpacity
									key={index}
									style={[
										styles.sizeButton,
										selectedSizeIndex === index && styles.selectedSizeButton,
									]}
									onPress={() => handleSizeSelect(index)}
								>
									<Text
										style={[
											styles.sizeText,
											selectedSizeIndex === index && styles.selectedSizeText,
										]}
									>
										{size}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					)}

					{/* Bottom row with price and controls */}
					<View style={styles.bottomRow}>
						<View style={styles.priceContainer}>
							<Text style={styles.price}>
								{formatPrice(finalPrice, locale)}
							</Text>
							{product.discount_percentage && (
								<Text style={styles.originalPrice}>
									{formatPrice(currentPrice, locale)}
								</Text>
							)}
						</View>

						<View style={styles.controls}>
							<QuantityControl
								value={selectedQuantity}
								onIncrement={() => setSelectedQuantity((prev) => prev + 1)}
								onDecrement={() =>
									setSelectedQuantity((prev) => Math.max(prev - 1, 1))
								}
								style={styles.quantityControl}
								minValue={1}
							/>

							<TouchableOpacity
								style={styles.addButton}
								onPress={handleAddToCart}
								disabled={addingToCart}
							>
								{addingToCart ? (
									<ActivityIndicator size="small" color="#FFFFFF" />
								) : (
									<Ionicons name="cart-outline" size={20} color="#FFFFFF" />
								)}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		width: width - 32,
		marginHorizontal: 16,
		marginBottom: 12,
	},
	card: {
		flexDirection: 'row',
		backgroundColor: 'white',
		borderRadius: 16,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 2,
		elevation: 2,
		borderColor: '#E8E8E8',
		borderWidth: 1,
		height: 'auto', // Let content determine height
		minHeight: 120, // Set minimum height
	},
	imageContainer: {
		width: width * 0.28,
		height: '100%', // Fill entire card height
		position: 'relative',
	},
	image: {
		width: '100%',
		height: '100%', // Fill entire container
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	discountTag: {
		position: 'absolute',
		top: 8,
		left: 0,
		backgroundColor: '#FF6B4E',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderTopRightRadius: 8,
		borderBottomRightRadius: 8,
	},
	discountText: {
		color: 'white',
		fontSize: 10,
		fontFamily: 'Inter-SemiBold',
	},
	content: {
		flex: 1,
		padding: 12,
		justifyContent: 'space-between',
	},
	categoryContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 4,
	},
	category: {
		fontSize: 12,
		color: '#666',
		fontFamily: 'Inter-Regular',
		flex: 1,
	},
	hotTag: {
		color: '#FFFFFF',
		backgroundColor: '#FF6B4E',
		fontSize: 10,
		fontFamily: 'Inter-SemiBold',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		marginLeft: 4,
	},
	name: {
		fontSize: 15,
		fontFamily: 'Inter-SemiBold',
		color: '#303030',
		marginBottom: 4,
		lineHeight: 20,
	},
	ratingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	rating: {
		fontSize: 12,
		color: '#303030',
		fontFamily: 'Inter-Medium',
		marginLeft: 4,
	},
	ratingCount: {
		fontSize: 11,
		color: '#888',
		marginLeft: 3,
		fontFamily: 'Inter-Regular',
	},
	sizesRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginVertical: 6,
	},
	sizeButton: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		marginRight: 6,
		marginBottom: 6,
		backgroundColor: '#F9F9F9',
	},
	selectedSizeButton: {
		borderColor: '#C67C4E',
		backgroundColor: '#FFF0E6',
	},
	sizeText: {
		fontSize: 11,
		fontFamily: 'Inter-Regular',
		color: '#6A6A6A',
	},
	selectedSizeText: {
		color: '#C67C4E',
		fontFamily: 'Inter-Medium',
	},
	bottomRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 8,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: '#F5F5F5',
	},
	priceContainer: {
		flex: 1,
	},
	price: {
		fontSize: 15,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E',
	},
	originalPrice: {
		fontSize: 12,
		color: '#999',
		textDecorationLine: 'line-through',
		fontFamily: 'Inter-Regular',
	},
	controls: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	quantityControl: {
		height: 28,
		marginRight: 8,
	},
	addButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#C67C4E',
		justifyContent: 'center',
		alignItems: 'center',
	},
})

export default RAGProductCard
