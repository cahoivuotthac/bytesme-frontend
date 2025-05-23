import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	SafeAreaView,
	StatusBar,
	Dimensions,
	ActivityIndicator,
	RefreshControl,
	ScrollView,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import PinterestProductCard from '@/components/product/PinterestProductCard'
import { useTranslation } from '@/providers/locale'
import BottomSpacer from '@/components/shared/BottomSpacer'
import { addToWishlist, productAPI, removeFromWishlist } from '@/utils/api'
import { useAlert } from '@/hooks/useAlert'

const { width } = Dimensions.get('window')

// Category banner images mapping
const CATEGORY_BANNERS = {
	1: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800',
	3: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
	4: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800',
	5: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
	6: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
	7: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800',
	8: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800',
	9: 'https://img.freepik.com/free-vector/hand-drawn-donuts-party-twitter-header_23-2149164950.jpg?semt=ais_hybrid&w=740',
	10: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800',
	11: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800',
	12: 'https://images.unsplash.com/photo-1549007953-2f2dc0b24019?w=800',
	13: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800',
}

// Category description mapping
const CATEGORY_DESC_KEYS = {
	1: 'categoryDesc_bingsu',
	3: 'categoryDesc_cakesPastries',
	4: 'categoryDesc_layeredCakesCrispyBread',
	5: 'categoryDesc_bread',
	6: 'categoryDesc_coldCreamCakes',
	7: 'categoryDesc_cookies',
	8: 'categoryDesc_seasonalSpecial',
	9: 'categoryDesc_productSets',
	10: 'categoryDesc_icedDrinks',
	11: 'categoryDesc_tea',
	12: 'categoryDesc_chocolateCacao',
	13: 'categoryDesc_coffee',
}

// Category name mapping
const CATEGORY_NAME_KEYS = {
	1: 'bingsu',
	3: 'cakesPastries',
	4: 'layeredCakesCrispyBread',
	5: 'bread',
	6: 'coldCreamCakes',
	7: 'cookies',
	8: 'seasonalSpecial',
	9: 'productSets',
	10: 'icedDrinks',
	11: 'tea',
	12: 'chocolateCacao',
	13: 'coffee',
}

// Helper to split products into two columns for Pinterest effect
function splitProductsToColumns(products: any[]) {
	const left: any[] = []
	const right: any[] = []
	let leftHeight = 0
	let rightHeight = 0
	products.forEach((item, idx) => {
		// For demo, use a random height for each card (simulate image+desc height)
		const estHeight = 180 + Math.floor(Math.random() * 80)
		if (leftHeight <= rightHeight) {
			left.push({ ...item, _pinterestHeight: estHeight })
			leftHeight += estHeight
		} else {
			right.push({ ...item, _pinterestHeight: estHeight })
			rightHeight += estHeight
		}
	})
	return [left, right]
}

export default function CategoryScreen() {
	const params = useLocalSearchParams()
	const categoryId = Number(params.categoryId)
	const { t } = useTranslation()

	const [products, setProducts] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [refreshing, setRefreshing] = useState(false)
	const [page, setPage] = useState(1)
	const [hasMoreProducts, setHasMoreProducts] = useState(true)
	const [favorites, setFavorites] = useState<number[]>([])
	const [loadingMore, setLoadingMore] = useState(false)
	const pageSize = 10
	const { showError } = useAlert()

	// Get category information
	const categoryNameKey =
		CATEGORY_NAME_KEYS[categoryId as keyof typeof CATEGORY_NAME_KEYS]
	const categoryDescKey =
		CATEGORY_DESC_KEYS[categoryId as keyof typeof CATEGORY_DESC_KEYS]
	const categoryBanner =
		CATEGORY_BANNERS[categoryId as keyof typeof CATEGORY_BANNERS]

	const categoryName = categoryNameKey ? t(categoryNameKey) : 'Category'
	const categoryDescription = categoryDescKey ? t(categoryDescKey) : ''

	// Transform backend product data to match PinterestProductCard props
	const transformProduct = (p: any) => ({
		productId: p.product_id,
		name: p.product_name,
		price: p.product_price,
		imageUrl: p.product_image_url || '', // fallback or placeholder if needed
		description: p.product_description,
		isFavorite: p.is_wishlisted,
		rating: p.product_overall_stars,
		discountPercentage: p.product_discount_percentage,
	})

	// Fetch products (mock implementation)
	const fetchProducts = async (
		pageNum: number = 1,
		isRefresh: boolean = false
	) => {
		if (isRefresh) {
			setRefreshing(true)
		} else if (pageNum === 1) {
			setLoading(true)
		} else {
			setLoadingMore(true)
		}

		try {
			const offset = (pageNum - 1) * pageSize
			const response = await productAPI.getProductsByCategory(
				categoryId,
				offset,
				pageSize
			)
			const newProducts = (response.data.products || []).map(transformProduct)
			const hasMore = response.data.has_more // <-- use this from backend

			if (isRefresh || pageNum === 1) {
				setProducts(newProducts)
				setPage(1)
				setHasMoreProducts(hasMore)
			} else {
				setProducts((prev) => [...prev, ...newProducts])
				setHasMoreProducts(hasMore)
			}
		} catch (error) {
			console.error('Error fetching products:', error)
		} finally {
			setLoading(false)
			setRefreshing(false)
			setLoadingMore(false)
		}
	}

	// Load more products when reaching end
	const loadMoreProducts = () => {
		if (!loading && hasMoreProducts) {
			const nextPage = page + 1
			setPage(nextPage)
			fetchProducts(nextPage)
		}
	}

	// Detect scroll near bottom to load more
	const handleScroll = (event: any) => {
		const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
		const paddingToBottom = 120
		if (
			layoutMeasurement.height + contentOffset.y >=
				contentSize.height - paddingToBottom &&
			!loadingMore &&
			hasMoreProducts
		) {
			const nextPage = page + 1
			setPage(nextPage)
			fetchProducts(nextPage)
		}
	}

	// Handle refresh
	const handleRefresh = () => {
		setHasMoreProducts(true)
		fetchProducts(1, true)
	}

	// Toggle favorite status
	const handleToggleFavorite = async (productId: number) => {
		console.log('Handle toggle favorite for productId:', productId)
		const favoriteFlipState = !favorites.includes(productId)
		if (!favorites.includes(productId)) {
			console.log('product is not favorited')
			try {
				// Remove from wishlsit
				await addToWishlist(productId)
				// setFavorites((prev) => {
				// 	return [...prev, productId]
				// })
				setProducts((prev) =>
					prev.map((item) =>
						item.productId === productId ? { ...item, isFavorite: true } : item
					)
				)
			} catch (err) {
				console.error('Error toggling favorite:', err)
				showError(t('errorAddingToWishlist'))
			}
		} else {
			console.log('product is already favorited')
			try {
				await removeFromWishlist(productId)
				setProducts((prev) =>
					prev.map((item) =>
						item.productId === productId ? { ...item, isFavorite: false } : item
					)
				)
			} catch (err) {
				console.error('Error toggling favorite:', err)
				showError(t('errorRemovingFromWishlist'))
			}
		}
	}

	// Load initial products
	useEffect(() => {
		fetchProducts(1)
	}, [categoryId])

	const [leftCol, rightCol] = splitProductsToColumns(products)

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="dark-content" backgroundColor="#FAF5ED" />

			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Ionicons name="arrow-back" size={24} color="#C67C4E" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>{categoryName}</Text>
				<View style={styles.placeholder} />
			</View>

			{/* Category Banner */}
			{categoryBanner && (
				<View style={styles.bannerContainer}>
					<Image
						source={{ uri: categoryBanner }}
						style={styles.bannerImage}
						resizeMode="cover"
					/>
					<LinearGradient
						colors={['transparent', 'rgba(0,0,0,0.7)']}
						style={styles.bannerGradient}
					/>
					<View style={styles.bannerContent}>
						<Text style={styles.bannerTitle}>{categoryName}</Text>
					</View>
				</View>
			)}

			<ScrollView
				contentContainerStyle={{
					flexDirection: 'row',
					paddingHorizontal: 16,
					paddingBottom: 100,
				}}
				showsVerticalScrollIndicator={false}
				onScroll={handleScroll}
				scrollEventThrottle={16}
			>
				<View style={{ flex: 1, marginRight: 8 }}>
					{/* Category Description */}
					{categoryDescription && (
						<View style={styles.descriptionContainer}>
							<Text style={styles.descriptionText}>{categoryDescription}</Text>
						</View>
					)}
					{leftCol.map((item, idx) => (
						<PinterestProductCard
							key={item.productId}
							product={{ ...item }}
							onToggleFavorite={handleToggleFavorite}
							style={{ ...styles.productCard, marginBottom: 16 }}
						/>
					))}
				</View>
				<View style={{ flex: 1 }}>
					{rightCol.map((item, idx) => (
						<PinterestProductCard
							key={item.productId}
							product={{ ...item }}
							onToggleFavorite={handleToggleFavorite}
							style={{ ...styles.productCard, marginBottom: 16 }}
						/>
					))}
				</View>
				{/* Loading more indicator */}
				{loadingMore && (
					<View
						style={{
							position: 'absolute',
							bottom: 24,
							left: 0,
							right: 0,
							alignItems: 'center',
						}}
					>
						<ActivityIndicator size="small" color="#C67C4E" />
					</View>
				)}
				<BottomSpacer />
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F8F1E9',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 15,
		backgroundColor: '#FFFFFF',
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
		zIndex: 1,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#FFF3E0',
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 18,
		fontFamily: 'Inter-Bold',
		color: '#3D3D3D',
		flex: 1,
		textAlign: 'center',
	},
	placeholder: {
		width: 40,
	},
	contentContainer: {
		paddingBottom: 100,
	},
	bannerContainer: {
		height: 200,
		marginBottom: 20,
		position: 'relative',
	},
	bannerImage: {
		width: '100%',
		height: '100%',
	},
	bannerGradient: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: 100,
	},
	bannerContent: {
		position: 'absolute',
		bottom: 20,
		left: 20,
		right: 20,
	},
	bannerTitle: {
		fontSize: 28,
		fontFamily: 'Inter-Bold',
		color: '#FFFFFF',
		textShadowColor: 'rgba(0, 0, 0, 0.5)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 3,
	},
	descriptionContainer: {
		backgroundColor: '#FFFFFF',
		marginHorizontal: 16,
		marginBottom: 20,
		padding: 20,
		borderRadius: 16,
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	descriptionText: {
		fontSize: 15,
		lineHeight: 24,
		fontFamily: 'Inter-Regular',
		color: '#6C6C6C',
		textAlign: 'justify',
	},
	productsHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		marginBottom: 16,
	},
	productsTitle: {
		fontSize: 18,
		fontFamily: 'Inter-Bold',
		color: '#3D3D3D',
	},
	row: {
		justifyContent: 'space-between',
		paddingHorizontal: 16,
	},
	productCard: {
		width: (width - 48) / 2, // Account for padding and gap
		marginBottom: 16,
	},
	footerLoader: {
		paddingVertical: 20,
		alignItems: 'center',
	},
})
