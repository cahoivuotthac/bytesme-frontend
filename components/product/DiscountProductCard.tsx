import React, { useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Dimensions,
	Platform,
	ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import DishDecoration from '@/components/shared/DishDecoration'
import { useTranslation } from '@/providers/locale'
import { addToWishlist, removeFromWishlist } from '@/utils/api'
import { Svg, Path, G } from 'react-native-svg'

// Get screen dimensions for responsive sizing
const { width } = Dimensions.get('window')
const CARD_WIDTH = width * 0.33 // Card takes up ~40% of screen width

interface DiscountProductCardProps {
	/**
	 * Product data object
	 */
	product: {
		productId: number
		name: string
		price: number
		originalPrice: number
		discountPercentage: number
		imageUrl: string
		isFavorite?: boolean
	}
	/**
	 * Optional style overrides
	 */
	style?: object
	/**
	 * Handler for favorite button press
	 */
	onToggleFavorite?: (productId: number) => void
}

/**
 * Discount product card component that shows a product with discount information
 */
const DiscountProductCard: React.FC<DiscountProductCardProps> = ({
	product,
	style,
	onToggleFavorite,
}) => {
	const { t } = useTranslation()
	const [isFavorite, setIsFavorite] = useState(product.isFavorite || false)
	const [isLoading, setIsLoading] = useState(false)

	// Format price with Vietnamese dong symbol
	const formatPrice = (price: number) => {
		return `${price.toLocaleString('vi-VN')} đ`
	}

	// Navigate to product details page
	const handlePress = () => {
		router.push({
			pathname: '/(home)/product/[id]',
			params: { id: product.productId },
		})
	}

	// Toggle favorite status with API call
	const handleFavoritePress = async (e: any) => {
		e.stopPropagation()

		try {
			setIsLoading(true)

			if (isFavorite) {
				// Remove from wishlist
				await removeFromWishlist(product.productId)
			} else {
				// Add to wishlist
				await addToWishlist(product.productId)
			}

			// Update local state
			setIsFavorite(!isFavorite)

			// Call the parent handler if provided
			if (onToggleFavorite) {
				onToggleFavorite(product.productId)
			}
		} catch (error) {
			console.error('Wishlist operation failed:', error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<TouchableOpacity
			style={[styles.container, style]}
			activeOpacity={0.7}
			onPress={handlePress}
		>
			{/* Discount badge positioned over the floating dish */}
			<View style={styles.discountBadgeContainer}>
				<Svg
					// xmlns="http://www.w3.org/2000/svg"
					width={CARD_WIDTH * 0.5}
					height={CARD_WIDTH * 0.5}
				>
					{/* <title>{t('discount')}</title> */}
					<G id="sale_fill" fill="none" fillRule="evenodd">
						<Path d="M24 0v24H0V0zM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01z" />
						<Path
							fill="#C67C4EFF"
							d="M9.405 2.897a4 4 0 0 1 5.02-.136l.17.136.376.32a2 2 0 0 0 .96.45l.178.022.493.04a4 4 0 0 1 3.648 3.468l.021.2.04.494a2 2 0 0 0 .36.996l.11.142.322.376a4 4 0 0 1 .136 5.02l-.136.17-.321.376a2 2 0 0 0-.45.96l-.022.178-.039.493a4 4 0 0 1-3.468 3.648l-.201.021-.493.04a2 2 0 0 0-.996.36l-.142.111-.377.32a4 4 0 0 1-5.02.137l-.169-.136-.376-.321a2 2 0 0 0-.96-.45l-.178-.021-.493-.04a4 4 0 0 1-3.648-3.468l-.021-.2-.04-.494a2 2 0 0 0-.36-.996l-.111-.142-.321-.377a4 4 0 0 1-.136-5.02l.136-.169.32-.376a2 2 0 0 0 .45-.96l.022-.178.04-.493A4 4 0 0 1 7.197 3.75l.2-.021.494-.04a2 2 0 0 0 .996-.36l.142-.111zM14.5 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m-.207-4.707-6 6a1 1 0 1 0 1.414 1.414l6-6a1 1 0 0 0-1.414-1.414M9.5 8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"
						/>
					</G>
				</Svg>
				<Text style={styles.discountText}>{product.discountPercentage}</Text>
			</View>

			{/* Dish decoration positioned to float above card */}
			<View style={styles.dishWrapper}>
				<DishDecoration
					imageSource={{ uri: product.imageUrl }}
					size={CARD_WIDTH * 0.7}
					containerStyle={styles.dishContainer}
					imageStyle={styles.dishImage}
					resizeMode="cover"
				/>
			</View>

			{/* Card container */}
			<View style={styles.card}>
				{/* Empty space for the dish that floats above */}
				<View style={styles.imageContainer} />

				{/* Product info */}
				<View style={styles.infoContainer}>
					<Text style={styles.name} numberOfLines={1}>
						{product.name}
					</Text>

					<View style={styles.priceContainer}>
						<Text style={styles.originalPrice}>
							{formatPrice(product.originalPrice)}
						</Text>
						<Text style={styles.price}>{formatPrice(product.price)}</Text>
					</View>
				</View>

				{/* Favorite button */}
				<TouchableOpacity
					style={styles.favoriteButton}
					onPress={handleFavoritePress}
					hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
					accessibilityLabel={
						isFavorite ? t('removeFromFavorites') : t('addToFavorites')
					}
				>
					<View>
						{isLoading ? (
							<ActivityIndicator size="small" color="#C67C4E" />
						) : (
							<Svg width="24" height="24" viewBox="0 0 24 24">
								{/* <title>{isFavorite ? t('favorite') : t('notFavorite')}</title> */}
								<G id="love_fill" fill="none">
									<Path d="M24 0v24H0V0zM12.594 23.258l-.012.002-.071.035-.02.004-.014-.004-.071-.036c-.01-.003-.019 0-.024.006l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.016-.018m.264-.113-.014.002-.184.093-.01.01-.003.011.018.43.005.012.008.008.201.092c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.003-.011.018-.43-.003-.012-.01-.01z" />
									<Path
										// fill={isFavorite ? '#FF5E5E' : 'FFFFFF'}
										fill={isFavorite ? '#FF5E5E' : '#D1D1D1'}
										d="M9.498 5.793c1.42-1.904 3.555-2.46 5.519-1.925 2.12.577 3.984 2.398 4.603 4.934.032.13.06.26.083.39a4.453 4.453 0 0 0-2.774-.07c-1.287-.952-2.881-1.112-4.298-.59-1.775.655-3.161 2.316-3.482 4.406-.41 2.676 1.22 5.08 3.525 7.124l.388.336c-.313.022-.631-.027-.935-.092a9.474 9.474 0 0 1-.466-.112l-.537-.15C6.35 18.701 3.154 16.6 2.237 13.46c-.732-2.506-.028-5.015 1.52-6.575 1.434-1.445 3.56-2.031 5.741-1.092m1.628 7.448c.428-2.792 3.657-4.168 5.315-1.772a.104.104 0 0 0 .144.025c2.377-1.684 4.94.713 4.387 3.483-.32 1.606-1.81 2.94-4.47 4l-.435.17-.263.108c-.227.089-.467.16-.684.122-.216-.038-.417-.188-.6-.348l-.31-.28c-2.313-1.991-3.341-3.827-3.084-5.508"
									/>
								</G>
							</Svg>
						)}
					</View>
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		width: CARD_WIDTH * 1.1,
		marginHorizontal: 8,
		marginVertical: 10,
		position: 'relative',
		paddingTop: CARD_WIDTH * 0.18, // Make space for the floating dish
	},
	dishWrapper: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		zIndex: 10,
		alignItems: 'center',
	},
	card: {
		borderRadius: 34, // Increased from 16 to 24 for more curvature to match other variants
		backgroundColor: '#F9F5F0', // Updated to a warm cream color
		height: CARD_WIDTH,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#E4D5C9', // Subtle border color
		padding: 10,
		paddingTop: CARD_WIDTH * 0.35, // Space for the dish that overlaps
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 5,
	},
	imageContainer: {
		width: '100%',
		height: CARD_WIDTH * 0.23, // Reduced height since dish is now above
	},
	dishContainer: {
		backgroundColor: '#FFF',
		shadowColor: '#3E6B59', // Darker green shadow
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.35,
		shadowRadius: 12,
		elevation: 11,
	},
	dishImage: {
		width: '85%',
		height: '85%',
	},
	discountBadge: {
		display: 'flex',
		flexDirection: 'column',
	},
	discountBadgeContainer: {
		position: 'absolute',
		top: 28,
		left: 2,
		zIndex: 20,
	},
	discountText: {
		position: 'absolute',
		top: 16,
		left: 8,
		color: '#FF9F67',
		elevation: 8,
		fontFamily: 'Inter-Bold',
		fontSize: 17,
	},
	infoContainer: {
		paddingHorizontal: 6,
	},
	name: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 13,
		color: '#2D2113', // Changed to a darker, richer brown
		marginBottom: 4,
		textAlign: 'center',
	},
	priceContainer: {
		flexDirection: 'column',
		alignItems: 'center',
	},
	price: {
		fontFamily: 'Inter-Bold',
		fontSize: 12,
		color: '#C67C4E', // Updated to our primary coffee color
	},
	originalPrice: {
		fontFamily: 'Inter-Medium',
		fontSize: 11,
		color: '#9B9B9B',
		textDecorationLine: 'line-through',
		marginBottom: 2,
	},
	favoriteButton: {
		position: 'absolute',
		top: CARD_WIDTH * 0.7,
		right: 10,
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		// backgroundColor: 'rgba(255, 255, 255, 0.5)',
		backgroundColor: 'rgba(255,255,255,0.5)', // Semi-transparent background
		// padding: 5,
		// zIndex: 5,
	},
})

export default DiscountProductCard
