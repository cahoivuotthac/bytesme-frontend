import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	FlatList,
	Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { getWishlist, removeFromWishlist } from '@/utils/api'
import { useAlert } from '@/hooks/useAlert'
import DishDecoration from '@/components/shared/DishDecoration'
import { useTranslation } from '@/providers/locale'

const { width } = Dimensions.get('window')
const ITEM_WIDTH = width * 0.9

// Mocked data - replace with your actual API call
// const FAVORITE_PRODUCTS = [
// 	{
// 		productId: 1,
// 		name: 'Tiramisu Cake',
// 		price: 45000,
// 		imageUrl: 'https://example.com/tiramisu.jpg',
// 		sizes: ['S', 'M', 'L'],
// 		isFavorite: true,
// 	},
// 	{
// 		productId: 2,
// 		name: 'Chocolate Croissant',
// 		price: 35000,
// 		imageUrl: 'https://example.com/croissant.jpg',
// 		sizes: ['S', 'M'],
// 		isFavorite: true,
// 	},
// 	{
// 		productId: 3,
// 		name: 'Caramel Macchiato',
// 		price: 55000,
// 		imageUrl: 'https://example.com/macchiato.jpg',
// 		sizes: ['S', 'M', 'L'],
// 		isFavorite: true,
// 	},
// ]

interface Product {
	productId: number
	name: string
	prices: number[]
	imageUrl: string
	sizes: string[]
	isFavorite: boolean
}

export default function FavoritesScreen() {
	const { t } = useTranslation()
	const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
	const [productSizes, setProductSizes] = useState<Record<number, string>>({})
	const [productPrices, setProductPrices] = useState<Record<number, number>>({}) // Price according to size of products
	const [isLoading, setIsLoading] = useState(false)
	const [removingProductId, setRemovingProductId] = useState<number | null>(
		null
	)

	const { AlertComponent, showError } = useAlert()

	// Initialize sizes and prices of products
	useEffect(() => {
		const initialSizes: Record<number, string> = {}
		const initialPrices: Record<number, number> = {}

		wishlistProducts.forEach((product: Product) => {
			initialSizes[product.productId] = product.sizes[0]
			initialPrices[product.productId] = product.prices[0]
		})

		setProductSizes(initialSizes)
		setProductPrices(initialPrices)
	}, [wishlistProducts])

	// Fetch wishlist products from API on mount
	useEffect(() => {
		setIsLoading(true)

		const fetchWishlistProducts = async () => {
			try {
				const response = await getWishlist()

				// pre-processing if needed
				const products = response.data.wishlist.map((item: any) => {
					return {
						productId: item.product_id,
						name: item.product.product_name,
						prices: [20000, 30000, 40000],
						imageUrl: item.product.product_images[0].product_image_url,
						sizes: ['S', 'M', 'L'],
						isFavorite: true,
					}
				}) as Product[]

				setWishlistProducts(products)
			} catch (error) {
				console.error('Failed to fetch wishlist:', error)
				showError(t('errorFetchingWishlist'))
			} finally {
				setIsLoading(false)
			}
		}

		fetchWishlistProducts()
	}, [])

	// Format price with Vietnamese dong symbol
	const formatPrice = (price: number | undefined) => {
		if (typeof price !== 'number' || isNaN(price)) {
			return '0đ'
		}
		return `${price.toLocaleString('vi-VN')}đ`
	}

	// Handle size selection
	const changeSize = (product: Product, sizeIndex: number) => {
		const selectedSize = product.sizes[sizeIndex]
		const selectedPrice = product.prices[sizeIndex]
		setProductSizes((prev) => ({
			...prev,
			[product.productId]: selectedSize,
		}))
		setProductPrices((prev) => ({
			...prev,
			[product.productId]: selectedPrice,
		}))
	}

	// Remove from wishlist
	const handleRemoveFromWishlist = async (productId: number) => {
		setRemovingProductId(productId)
		try {
			// Call your API to remove from wishlist
			await removeFromWishlist(productId)

			// Update local state
			setWishlistProducts((prev) =>
				prev.filter((product) => product.productId !== productId)
			)
		} catch (error) {
			console.error('Failed to remove from favorites:', error)
		} finally {
			setRemovingProductId(null)
		}
	}

	// Add item to cart
	const handleAddToCart = (productId: number) => {
		const product = wishlistProducts.find((p) => p.productId === productId)
		if (product) {
			console.log('Adding to cart:', {
				id: product.productId,
				size: productSizes[productId] || product.sizes[0],
				quantity: 1, // Default to 1 when adding from wishlist
			})

			// Implement your cart addition logic here
			// You might want to show a success toast
		}
	}

	// Render a single favorite item
	const renderFavoriteItem = ({ item }: { item: Product }) => (
		<View style={styles.favoriteItem}>
			<View style={styles.productImageContainer}>
				<DishDecoration
					imageSource={{ uri: item.imageUrl }}
					size={80}
					containerStyle={styles.dishContainer}
					imageStyle={styles.dishImage}
				/>
			</View>

			<View style={styles.productInfoContainer}>
				<View style={styles.productNameRow}>
					<Text style={styles.productName} numberOfLines={1}>
						{item.name}
					</Text>
					<TouchableOpacity
						onPress={() => handleRemoveFromWishlist(item.productId)}
						style={styles.favoriteButton}
						hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
					>
						{removingProductId === item.productId ? (
							<ActivityIndicator size="small" color="#FF5E5E" />
						) : (
							<Ionicons name="heart" size={24} color="#FF5E5E" />
						)}
					</TouchableOpacity>
				</View>

				<Text style={styles.productPrice}>
					{formatPrice(productPrices[item.productId])}
				</Text>

				<View style={styles.productControls}>
					<View style={styles.sizeSelector}>
						{item.sizes.map((size: string, sizeIndex: number) => (
							<TouchableOpacity
								key={size}
								style={[
									styles.sizeButton,
									productSizes[item.productId] === size &&
										styles.selectedSizeButton,
								]}
								onPress={() => changeSize(item, sizeIndex)}
							>
								<Text
									style={[
										styles.sizeButtonText,
										productSizes[item.productId] === size &&
											styles.selectedSizeButtonText,
									]}
								>
									{size}
								</Text>
							</TouchableOpacity>
						))}
					</View>

					<TouchableOpacity
						style={styles.addToCartButton}
						onPress={() => handleAddToCart(item.productId)}
					>
						<Ionicons name="cart-outline" size={18} color="#FFFFFF" />
					</TouchableOpacity>
				</View>
			</View>
		</View>
	)

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}
			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#C67C4E" />
				</View>
			) : wishlistProducts.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Ionicons name="heart-outline" size={64} color="#CCCCCC" />
					<Text style={styles.emptyText}>{t('noFavorites')}</Text>
					<TouchableOpacity
						style={styles.browseButton}
						onPress={() => router.push('/(home)/product')}
					>
						<Text style={styles.browseButtonText}>{t('browseProducts')}</Text>
					</TouchableOpacity>
				</View>
			) : (
				<FlatList
					data={wishlistProducts}
					renderItem={renderFavoriteItem}
					keyExtractor={(item) => item.productId.toString()}
					contentContainerStyle={styles.listContainer}
					showsVerticalScrollIndicator={false}
					ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
				/>
			)}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	listContainer: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 100,
	},
	favoriteItem: {
		width: ITEM_WIDTH,
		flexDirection: 'row',
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 12,
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 3,
	},
	itemSeparator: {
		height: 16,
	},
	productImageContainer: {
		width: 80,
		height: 80,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	dishContainer: {
		backgroundColor: '#EDE9E0',
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 5,
	},
	dishImage: {
		width: '85%',
		height: '85%',
	},
	productInfoContainer: {
		flex: 1,
		justifyContent: 'space-between',
	},
	productNameRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	productName: {
		fontFamily: 'Inter-SemiBold',
		fontSize: 16,
		color: '#383838',
		flex: 1,
		marginRight: 8,
	},
	favoriteButton: {
		padding: 4,
	},
	productPrice: {
		fontFamily: 'Inter-Medium',
		fontSize: 14,
		color: '#968B7B',
		marginBottom: 8,
	},
	productControls: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	sizeSelector: {
		flexDirection: 'row',
	},
	sizeButton: {
		width: 30,
		height: 24,
		borderRadius: 6,
		backgroundColor: 'rgba(191, 173, 142, 0.3)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
	},
	selectedSizeButton: {
		backgroundColor: '#C67C4E',
	},
	sizeButtonText: {
		fontFamily: 'Inter-Medium',
		fontSize: 12,
		color: '#000000',
	},
	selectedSizeButtonText: {
		color: '#FFFFFF',
	},
	addToCartButton: {
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: '#C67C4E',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 2,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
	},
	emptyText: {
		fontFamily: 'Inter-Medium',
		fontSize: 16,
		color: '#9B9B9B',
		marginTop: 16,
		marginBottom: 24,
	},
	browseButton: {
		backgroundColor: '#C67C4E',
		borderRadius: 16,
		paddingVertical: 14,
		paddingHorizontal: 24,
	},
	browseButtonText: {
		fontFamily: 'Inter-Bold',
		fontSize: 14,
		color: '#FFFFFF',
	},
})
