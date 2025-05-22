import React, { useState, useEffect } from 'react'
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
	FlatList,
	ActivityIndicator,
	RefreshControl,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import RegularProductCard from '@/components/product/RegularProductCard'
import DiscountProductCard from '@/components/product/DiscountProductCard'
import { useTranslation } from '@/providers/locale'

const { width } = Dimensions.get('window')

// Category banner images mapping
const CATEGORY_BANNERS = {
	bingsu: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800',
	'cakes-pastries':
		'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
	'layered-cakes':
		'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800',
	bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
	'cold-cream-cakes':
		'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
	cookies: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800',
	'seasonal-special':
		'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800',
	'product-sets':
		'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=800',
	'iced-drinks':
		'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800',
	tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800',
	'chocolate-cacao':
		'https://images.unsplash.com/photo-1549007953-2f2dc0b24019?w=800',
	coffee: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800',
}

// Category description mapping
const CATEGORY_DESC_KEYS = {
	bingsu: 'categoryDesc_bingsu',
	'cakes-pastries': 'categoryDesc_cakesPastries',
	'layered-cakes': 'categoryDesc_layeredCakesCrispyBread',
	bread: 'categoryDesc_bread',
	'cold-cream-cakes': 'categoryDesc_coldCreamCakes',
	cookies: 'categoryDesc_cookies',
	'seasonal-special': 'categoryDesc_seasonalSpecial',
	'product-sets': 'categoryDesc_productSets',
	'iced-drinks': 'categoryDesc_icedDrinks',
	tea: 'categoryDesc_tea',
	'chocolate-cacao': 'categoryDesc_chocolateCacao',
	coffee: 'categoryDesc_coffee',
}

// Category name mapping
const CATEGORY_NAME_KEYS = {
	bingsu: 'bingsu',
	'cakes-pastries': 'cakesPastries',
	'layered-cakes': 'layeredCakesCrispyBread',
	bread: 'bread',
	'cold-cream-cakes': 'coldCreamCakes',
	cookies: 'cookies',
	'seasonal-special': 'seasonalSpecial',
	'product-sets': 'productSets',
	'iced-drinks': 'icedDrinks',
	tea: 'tea',
	'chocolate-cacao': 'chocolateCacao',
	coffee: 'coffee',
}

// Mock products data - In real app, this would come from API
const MOCK_PRODUCTS = [
	{
		productId: 1,
		name: 'Bingsu Dâu Tây',
		price: 85000,
		imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307',
		rating: 4.8,
		isFavorite: false,
	},
	{
		productId: 2,
		name: 'Bingsu Xoài',
		price: 90000,
		originalPrice: 100000,
		discountPercentage: 10,
		imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b',
		rating: 4.7,
		isFavorite: true,
	},
	{
		productId: 3,
		name: 'Bingsu Chocolate',
		price: 95000,
		imageUrl: 'https://images.unsplash.com/photo-1551024739-7f6baf4e7000',
		rating: 4.9,
		isFavorite: false,
	},
	{
		productId: 4,
		name: 'Bingsu Trà Xanh',
		price: 88000,
		imageUrl: 'https://images.unsplash.com/photo-1551024739-7f6baf4e7000',
		rating: 4.6,
		isFavorite: false,
	},
	{
		productId: 5,
		name: 'Bingsu Đậu Đỏ',
		price: 82000,
		originalPrice: 90000,
		discountPercentage: 9,
		imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307',
		rating: 4.5,
		isFavorite: true,
	},
	{
		productId: 6,
		name: 'Bingsu Tổng Hợp',
		price: 120000,
		imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b',
		rating: 4.9,
		isFavorite: false,
	},
]

export default function CategoryScreen() {
	const { categoryId } = useLocalSearchParams<{ categoryId: string }>()
	const { t } = useTranslation()

	const [products, setProducts] = useState(MOCK_PRODUCTS)
	const [loading, setLoading] = useState(false)
	const [refreshing, setRefreshing] = useState(false)
	const [page, setPage] = useState(1)
	const [hasMoreProducts, setHasMoreProducts] = useState(true)
	const [favorites, setFavorites] = useState<number[]>([1, 2, 5])

	// Get category information
	const categoryNameKey =
		CATEGORY_NAME_KEYS[categoryId as keyof typeof CATEGORY_NAME_KEYS]
	const categoryDescKey =
		CATEGORY_DESC_KEYS[categoryId as keyof typeof CATEGORY_DESC_KEYS]
	const categoryBanner =
		CATEGORY_BANNERS[categoryId as keyof typeof CATEGORY_BANNERS]

	const categoryName = categoryNameKey ? t(categoryNameKey) : 'Category'
	const categoryDescription = categoryDescKey ? t(categoryDescKey) : ''

	// Fetch products (mock implementation)
	const fetchProducts = async (
		pageNum: number = 1,
		isRefresh: boolean = false
	) => {
		if (isRefresh) {
			setRefreshing(true)
		} else {
			setLoading(true)
		}

		try {
			// Simulate API call delay
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// In real app, make API call here
			// const response = await api.getProductsByCategory(categoryId, pageNum)

			if (isRefresh) {
				setProducts(MOCK_PRODUCTS)
				setPage(1)
			} else if (pageNum === 1) {
				setProducts(MOCK_PRODUCTS)
			} else {
				// Simulate no more products for demo
				setHasMoreProducts(false)
			}
		} catch (error) {
			console.error('Error fetching products:', error)
		} finally {
			setLoading(false)
			setRefreshing(false)
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

	// Handle refresh
	const handleRefresh = () => {
		setHasMoreProducts(true)
		fetchProducts(1, true)
	}

	// Toggle favorite status
	const handleToggleFavorite = (productId: number) => {
		setFavorites((prev) => {
			if (prev.includes(productId)) {
				return prev.filter((id) => id !== productId)
			} else {
				return [...prev, productId]
			}
		})
	}

	// Load initial products
	useEffect(() => {
		fetchProducts(1)
	}, [categoryId])

	// Render product item
	const renderProductItem = ({ item }: { item: any }) => {
		const isDiscounted = item.originalPrice && item.discountPercentage
		const isFavorite = favorites.includes(item.productId)

		const productWithFavorite = {
			...item,
			isFavorite,
		}

		if (isDiscounted) {
			return (
				<DiscountProductCard
					product={productWithFavorite}
					onToggleFavorite={handleToggleFavorite}
					style={styles.productCard}
				/>
			)
		} else {
			return (
				<RegularProductCard
					product={productWithFavorite}
					onToggleFavorite={handleToggleFavorite}
					style={styles.productCard}
				/>
			)
		}
	}

	// Render footer with loading indicator
	const renderFooter = () => {
		if (!loading) return null
		return (
			<View style={styles.footerLoader}>
				<ActivityIndicator size="small" color="#C67C4E" />
			</View>
		)
	}

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

			<FlatList
				data={products}
				renderItem={renderProductItem}
				keyExtractor={(item) => item.productId.toString()}
				numColumns={2}
				columnWrapperStyle={styles.row}
				contentContainerStyle={styles.contentContainer}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						colors={['#C67C4E']}
						tintColor="#C67C4E"
					/>
				}
				onEndReached={loadMoreProducts}
				onEndReachedThreshold={0.1}
				ListFooterComponent={renderFooter}
				ListHeaderComponent={
					<View>
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

						{/* Category Description */}
						{categoryDescription && (
							<View style={styles.descriptionContainer}>
								<Text style={styles.descriptionText}>
									{categoryDescription}
								</Text>
							</View>
						)}

						{/* Products Header */}
						<View style={styles.productsHeader}>
							<Text style={styles.productsTitle}>
								{t('availableProducts')} ({products.length})
							</Text>
						</View>
					</View>
				}
			/>
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
