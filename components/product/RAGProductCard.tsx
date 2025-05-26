import React, { useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@/utils/display'
import { useTranslation } from '@/providers/locale'
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
	const [selectedQuantity, setSelectedQuantity] = useState(0)
	const { locale } = useTranslation()

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
					: [typeof priceValue === 'number' ? priceValue : parseInt(priceValue || '0', 10)]

			console.log('Parsed sizes:', sizes)
			console.log('Parsed prices:', prices)

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
				<Image
					source={{ uri: imageUrl }}
					style={styles.image}
					resizeMode="cover"
				/>

				<View style={styles.content}>
					<View style={styles.tagContainer}>
						<Text style={styles.tag}>{product.category_name}</Text>
						{product.total_orders && product.total_orders > 100 && (
							<Text style={styles.hot}>HOT</Text>
						)}
					</View>
					<Text style={styles.name} numberOfLines={2}>
						{product.product_name}
					</Text>

					{/* Size selector if multiple sizes are available */}
					{hasMultipleSizes && (
						<View style={styles.sizesContainer}>
							{sizes.map((size, index) => (
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

					{/* Rating display if available */}
					{formattedRating && (
						<View style={styles.ratingContainer}>
							<Ionicons name="star" size={14} color="#FFD700" />
							<Text style={styles.rating}>{formattedRating}</Text>
							{product.total_ratings && (
								<Text style={styles.totalRating}>
									({product.total_ratings})
								</Text>
							)}
							{product.total_orders && (
								<Text style={styles.soldCount}>
									• Đã bán {product.total_orders}
								</Text>
							)}
						</View>
					)}

					{/* Price display with discount if applicable */}
					<View style={styles.priceContainer}>
						{product.discount_percentage ? (
							<>
								<Text style={styles.price}>
									{formatPrice(finalPrice, locale)}
								</Text>
								<Text style={styles.originalPrice}>
									{formatPrice(currentPrice, locale)}
								</Text>
								<View style={styles.discountBadge}>
									<Text style={styles.discountText}>
										-{product.discount_percentage}%
									</Text>
								</View>
							</>
						) : (
							<Text style={styles.price}>
								{formatPrice(currentPrice, locale)}
							</Text>
						)}
					</View>

					{/* Add to cart button */}
					{/* <TouchableOpacity style={styles.addButton}>
						<Ionicons name="add" size={18} color="#FFFFFF" />
					</TouchableOpacity> */}

					<View style={styles.quantityControlContainer}>
						<QuantityControl
							value={selectedQuantity}
							onIncrement={() => setSelectedQuantity((prev) => prev + 1)}
							onDecrement={() =>
								setSelectedQuantity((prev) => Math.max(prev - 1, 0))
							}
							// productId={product.product_id}
							// productCode={product.product_code}
							// size={sizes[selectedSizeIndex]}
							// price={currentPrice}
							// style={styles.addButton}
						/>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	sizesContainer: {
		flexDirection: 'row',
		marginBottom: 8,
	},
	sizeButton: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#DEDEDE',
		marginRight: 6,
		backgroundColor: '#F8F8F8',
	},
	selectedSizeButton: {
		borderColor: '#C67C4E',
		backgroundColor: '#FFF0E6',
	},
	sizeText: {
		fontSize: 11,
		fontFamily: 'Inter-Medium',
		color: '#6A6A6A',
	},
	selectedSizeText: {
		color: '#C67C4E',
	},

	container: {
		width: width - 32,
		marginHorizontal: 16,
		marginVertical: 6,
	},
	card: {
		flexDirection: 'row',
		backgroundColor: '#FFFFFF',
		borderRadius: 23,
		// height: "40%",
		overflow: 'hidden',
		shadowColor: '#222',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		borderColor: '#EDC8C9', // Soft pink border
		borderWidth: 1,
	},
	image: {
		width: '30%',
		height: '100%',
		borderTopRightRadius: 20,
		borderBottomRightRadius: 20,
	},
	content: {
		flex: 1,
		padding: 12,
		position: 'relative',
	},
	tagContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
	},
	tag: {
		fontSize: 11,
		color: '#666',
		backgroundColor: '#F4F4F4',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 8,
		overflow: 'hidden',
		fontFamily: 'Inter-Regular',
		marginRight: 6,
	},
	hot: {
		fontSize: 11,
		color: '#FFFFFF',
		backgroundColor: '#FF6B4E',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 8,
		overflow: 'hidden',
		fontFamily: 'Inter-Medium',
	},
	name: {
		fontSize: 15,
		fontFamily: 'Inter-Medium',
		color: '#303030',
		marginBottom: 6,
		height: 40, // Fixed height for 2 lines
	},
	ratingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
	},
	rating: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: '#303030',
		marginLeft: 2,
	},
	totalRating: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#888',
		marginLeft: 2,
	},
	soldCount: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#888',
		marginLeft: 8,
	},
	priceContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 40, // Make room for the add button
	},
	price: {
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#C67C4E',
	},
	originalPrice: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#999',
		textDecorationLine: 'line-through',
		marginLeft: 6,
	},
	discountBadge: {
		backgroundColor: '#FFEBE5',
		borderRadius: 4,
		paddingHorizontal: 4,
		paddingVertical: 2,
		marginLeft: 6,
	},
	discountText: {
		fontSize: 10,
		fontFamily: 'Inter-Medium',
		color: '#FF6B4E',
	},
	stockStatus: {
		position: 'absolute',
		bottom: 12,
		right: 12,
		backgroundColor: '#EFEFEF',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	outOfStockText: {
		fontSize: 10,
		fontFamily: 'Inter-Medium',
		color: '#888',
	},
	quantityControlContainer: {
		position: 'absolute',
		bottom: 12,
		right: 20,
		// backgroundColor: '#C67C4E',
		width: 28,
		height: 28,
		borderRadius: 14,
		justifyContent: 'center',
		alignItems: 'center',
	},
})

export default RAGProductCard
