import React, { useState, useRef } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	TextInput,
	Image,
	SafeAreaView,
	StatusBar,
	Dimensions,
	FlatList,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import ImageCarousel from '@/components/shared/ImageCarousel'
import FeaturedProductCard from '@/components/product/FeaturedProductCard'
import RegularProductCard from '@/components/product/RegularProductCard'
import DiscountProductCard from '@/components/product/DiscountProductCard'
import GradientProductCard from '@/components/product/GradientProductCard'
import NavButton from '@/components/shared/NavButton'
import { useTranslation } from '@/providers/locale'
import { SearchBar } from '@/components/shared/SearchBar'

const { width } = Dimensions.get('window')

// Mock carousel items for hot products
const HOT_PRODUCTS_CAROUSEL = [
	{
		id: 'promo1',
		title: 'Khuyến mãi mùa hè',
		description: 'Giảm 30% tất cả đồ uống lạnh',
		imageUrl:
			'https://cdn.prod.website-files.com/649249d29a20bd6bc3deac45/649249d29a20bd6bc3deaea5_AdobeStock_62684026.webp',
		linkTo: '/(home)/product/categories/cold-drink',
	},
	{
		id: 'promo2',
		title: 'Bánh mới về',
		description: 'Bánh ngọt thơm ngon mới về',
		imageUrl:
			'https://cdn.prod.website-files.com/649249d29a20bd6bc3deac45/649249d29a20bd6bc3deaea7_AdobeStock_293739586.webp',
		linkTo: '/(home)/product/categories/pastry',
	},
	{
		id: '4',
		title: 'Bia Nhiệt Đới',
		description: 'Sản phẩm nổi bật',
		imageUrl:
			'https://cdn.prod.website-files.com/649249d29a20bd6bc3deac45/649249d29a20bd6bc3deaea6_AdobeStock_158358263.webp',
	},
]

// Mock data
const CATEGORIES = [
	{
		id: 'all',
		name: 'all',
		image: require('@/assets/icons/categories/dishes.png'),
	},
	{
		id: 'coffee',
		name: 'coffee',
		image: require('@/assets/icons/categories/coffee.png'),
	},
	{
		id: 'pastry',
		name: 'pastry',
		image: require('@/assets/icons/categories/pastry.png'),
	},
	{
		id: 'tea',
		name: 'tea',
		image: require('@/assets/icons/categories/tea.png'),
	},
	{
		id: 'colddrinks',
		name: 'coldDrinks',
		image: require('@/assets/icons/categories/cold-drink.png'),
	},
	{
		id: 'cake',
		name: 'cake',
		image: require('@/assets/icons/categories/cake.png'),
	},
]

// Mock featured products
const FEATURED_PRODUCTS = [
	{
		productId: 1,
		name: 'Bia Nhiệt Đới',
		price: 30000,
		imageUrl: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757',
		isFavorite: true,
	},
	{
		productId: 2,
		name: 'Xu Kem bơ nướng giòn tan',
		price: 30000,
		imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e',
		isFavorite: false,
	},
	{
		productId: 3,
		name: 'Bánh sừng bò nhân sầu riêng',
		price: 30000,
		imageUrl: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812',
		isFavorite: false,
	},
]

// Mock best sellers
const BEST_SELLERS = [
	{
		productId: 4,
		name: 'Bia Nhiệt Đới',
		price: 30000,
		imageUrl: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757',
		rating: 4.89,
		isFavorite: false,
	},
	{
		productId: 5,
		name: 'Trà Sữa Đài Loan',
		price: 35000,
		imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699',
		rating: 4.75,
		isFavorite: true,
	},
	{
		productId: 6,
		name: 'Cà Phê Đá',
		price: 25000,
		imageUrl: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571',
		rating: 4.95,
		isFavorite: false,
	},
]

// Mock discounted products
const DISCOUNTED_PRODUCTS = [
	{
		productId: 7,
		name: 'Sừng trâu Sôcôla',
		price: 27000,
		originalPrice: 30000,
		discountPercentage: 10,
		imageUrl: 'https://images.unsplash.com/photo-1623334044303-241021148842',
		isFavorite: false,
	},
	{
		productId: 8,
		name: 'Bột nhào mứt táo',
		price: 25500,
		originalPrice: 30000,
		discountPercentage: 15,
		imageUrl: 'https://images.unsplash.com/photo-1509365390695-33aee754301f',
		isFavorite: true,
	},
]

// Mock explore products
const EXPLORE_PRODUCTS = [
	{
		productId: 9,
		name: 'Bánh cà phê Ailen',
		price: 30000,
		imageUrl: 'https://images.unsplash.com/photo-1506224772180-d75b3efbe9a0',
		isFavorite: true,
	},
	{
		productId: 10,
		name: 'Bánh sừng bò Pháp',
		price: 35000,
		imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a',
		isFavorite: false,
	},
	{
		productId: 11,
		name: 'Bánh Tiramisu',
		price: 40000,
		imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9',
		gradientColors: ['#923B3C', '#D7595B'],
		isFavorite: false,
	},
	{
		productId: 12,
		name: 'Trà Hoa Cúc',
		price: 32000,
		imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3',
		isFavorite: true,
	},
]

export default function ProductScreen() {
	const [searchQuery, setSearchQuery] = useState('')
	const [activeCategory, setActiveCategory] = useState('all')
	const [favorites, setFavorites] = useState<number[]>([])
	const { t } = useTranslation()

	const categoriesRef = useRef<ScrollView>(null)

	// Handle search input
	const handleSearch = (text: string) => {
		setSearchQuery(text)
	}

	// Handle search submission
	const handleSearchSubmit = () => {
		if (searchQuery.trim()) {
			router.push({
				pathname: '/(home)/product/search-results',
				params: { query: searchQuery },
			})
		}
	}

	// Toggle favorite status for a product
	const handleToggleFavorite = (productId: number) => {
		setFavorites((prevFavorites) => {
			if (prevFavorites.includes(productId)) {
				return prevFavorites.filter(
					(prevProductId) => prevProductId !== productId
				)
			} else {
				return [...prevFavorites, productId]
			}
		})
	}

	// Select a category
	const handleSelectCategory = (categoryId: string) => {
		setActiveCategory(categoryId)
	}

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="dark-content" backgroundColor="#FAF5ED" />

			<ScrollView
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
				stickyHeaderIndices={[2]} // Categories sticky after carousel
			>
				{/* Header with gradient background */}
				<LinearGradient
					colors={['#FFF2E5', '#F8E8D8']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.headerGradient}
				>
					{/* Search Section */}
					<SearchBar
						searchQuery={searchQuery}
						handleInputChange={handleSearch}
						handleSearchSubmit={handleSearchSubmit}
						handleAiButtonPress={() => {
							router.push('/(home)/product/ai-search')
						}}
					/>
				</LinearGradient>

				{/* Hot Products Carousel */}
				<View style={styles.carouselContainer}>
					<ImageCarousel
						items={HOT_PRODUCTS_CAROUSEL}
						height={180}
						autoPlayInterval={5000}
					/>
				</View>

				{/* Categories Tabs */}
				<View style={styles.categoriesContainer}>
					<ScrollView
						ref={categoriesRef}
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.categoriesScrollContent}
					>
						{CATEGORIES.map((category) => (
							<TouchableOpacity
								key={category.id}
								style={styles.categoryTab}
								onPress={() => handleSelectCategory(category.id)}
							>
								<View
									style={[
										styles.categoryIconContainer,
										activeCategory === category.id &&
											styles.activeCategoryIconContainer,
									]}
								>
									<Image
										source={category.image}
										style={styles.categoryIcon}
										resizeMode="contain"
									/>
								</View>
								<Text
									style={[
										styles.categoryText,
										activeCategory === category.id && styles.activeCategoryText,
									]}
								>
									{t(category.name)}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Best-selling Products */}
				<View style={styles.sectionContainer}>
					<View style={styles.sectionTitleContainer}>
						<View style={styles.sectionTitleWrapper}>
							<Image
								source={require('@/assets/icons/badges/best-seller.png')}
								style={styles.sectionIcon}
							/>
							<Text style={styles.sectionTitle}>{t('bestSellers')}</Text>
						</View>
						<View style={styles.viewAllButton}>
							<Text style={styles.viewAllText}>{t('viewAll')}</Text>
							<NavButton
								onPress={() => router.push('/(home)/product/sections/featured')}
								direction="next"
								size={28}
								style={{ backgroundColor: '#C67C4E' }}
							/>
						</View>
					</View>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.featuredScrollContent}
						decelerationRate="fast"
						snapToAlignment="center"
						style={styles.productsScroll}
					>
						{FEATURED_PRODUCTS.map((product) => (
							<FeaturedProductCard
								key={product.productId}
								product={product}
								onToggleFavorite={handleToggleFavorite}
							/>
						))}
					</ScrollView>
				</View>

				{/* Highest-rated section */}
				<View style={styles.sectionContainer}>
					<View style={styles.sectionTitleContainer}>
						<View style={styles.sectionTitleWrapper}>
							<Image
								source={require('@/assets/icons/badges/highest-rated.png')}
								style={styles.sectionIcon}
							/>
							<Text style={styles.sectionTitle}>{t('highestRated')}</Text>
						</View>
						<View style={styles.viewAllButton}>
							<Text style={styles.viewAllText}>{t('viewAll')}</Text>
							<NavButton
								onPress={() => router.push('/(home)/product/sections/featured')}
								direction="next"
								size={28}
								style={{ backgroundColor: '#C67C4E' }}
							/>
						</View>
					</View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.productsScrollContent}
						style={styles.productsScroll}
					>
						{BEST_SELLERS.map((product) => (
							<RegularProductCard
								key={product.productId}
								product={product}
								onToggleFavorite={handleToggleFavorite}
								style={styles.regularCard}
							/>
						))}
					</ScrollView>
				</View>

				{/* Discounted Products Section */}
				<View style={styles.sectionContainer}>
					<View style={styles.sectionTitleContainer}>
						<View style={styles.sectionTitleWrapper}>
							<Image
								source={require('@/assets/icons/badges/best-seller.png')}
								style={styles.sectionIcon}
							/>
							<Text style={styles.sectionTitle}>{t('discounted')}</Text>
						</View>
						<View style={styles.viewAllButton}>
							<Text style={styles.viewAllText}>{t('viewAll')}</Text>
							<NavButton
								onPress={() => router.push('/(home)/product/sections/featured')}
								direction="next"
								size={28}
								style={{ backgroundColor: '#C67C4E' }}
							/>
						</View>
					</View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.productsScrollContent}
						style={styles.productsScroll}
					>
						{DISCOUNTED_PRODUCTS.map((product) => (
							<DiscountProductCard
								key={product.productId}
								product={product}
								onToggleFavorite={handleToggleFavorite}
								style={styles.discountCard}
							/>
						))}
					</ScrollView>
				</View>

				{/* Explore Section */}
				<View style={[styles.sectionContainer, styles.lastSection]}>
					<View style={styles.sectionTitleContainer}>
						<View style={styles.sectionTitleWrapper}>
							<Image
								source={require('@/assets/icons/badges/best-seller.png')}
								style={styles.sectionIcon}
							/>
							<Text style={styles.sectionTitle}>{t('explore')}</Text>
						</View>
						<View style={styles.viewAllButton}>
							<Text style={styles.viewAllText}>{t('viewAll')}</Text>
							<NavButton
								onPress={() => router.push('/(home)/product/sections/explore')}
								direction="next"
								size={28}
								style={{ backgroundColor: '#C67C4E' }}
							/>
						</View>
					</View>
					<View style={styles.exploreGrid}>
						{EXPLORE_PRODUCTS.map((product, _) => (
							<RegularProductCard
								key={product.productId}
								product={product}
								onToggleFavorite={handleToggleFavorite}
								style={styles.exploreCard}
							/>
						))}
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F8F1E9', // Warmer, softer background
	},
	scrollView: {
		flex: 1,
	},
	headerGradient: {
		paddingTop: 15,
		paddingBottom: 20,
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 20,
		marginBottom: 5,
	},
	searchInputWrapper: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 40,
		borderWidth: 1,
		borderColor: '#F0E4D7',
		paddingHorizontal: 16,
		height: 48,
		shadowColor: '#C67C4E',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	searchIcon: {
		marginRight: 8,
	},
	searchInput: {
		flex: 1,
		fontSize: 14,
		color: '#3D3D3D',
		fontFamily: 'Inter-Regular',
	},
	aiSearchButton: {
		backgroundColor: '#C67C4E',
		borderRadius: 20,
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 10,
		shadowColor: '#C67C4E',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 3,
	},
	carouselContainer: {
		marginTop: 15,
		marginHorizontal: 16,
		marginBottom: 20,
		borderRadius: 20,
		overflow: 'hidden',
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
	},
	categoriesContainer: {
		backgroundColor: '#FFF8EF',
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#E8DFD5',
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
		zIndex: 1,
	},
	categoriesScrollContent: {
		paddingHorizontal: 20,
	},
	categoryTab: {
		alignItems: 'center',
		marginRight: 20,
		width: 72,
	},
	categoryIconContainer: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 8,
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
		borderWidth: 1,
		borderColor: '#F0E4D7',
	},
	activeCategoryIconContainer: {
		backgroundColor: '#FFF2E5',
		borderColor: '#C67C4E',
		borderWidth: 2,
		shadowColor: '#C67C4E',
		shadowOpacity: 0.25,
		shadowOffset: { width: 0, height: 3 },
		elevation: 4,
	},
	categoryIcon: {
		width: 34,
		height: 34,
	},
	categoryText: {
		fontSize: 13,
		fontFamily: 'Inter-Medium',
		color: '#7C7C7C',
		textAlign: 'center',
	},
	activeCategoryText: {
		color: '#C67C4E',
		fontFamily: 'Inter-SemiBold',
	},
	sectionContainer: {
		marginTop: 25,
		marginBottom: 5,
		backgroundColor: '#FFFFFF',
		marginHorizontal: 16,
		borderRadius: 24,
		paddingVertical: 18,
		paddingBottom: 22,
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
		borderWidth: 1,
		borderColor: '#F5EDE4',
	},
	sectionTitleContainer: {
		marginHorizontal: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	sectionTitleWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	sectionIcon: {
		width: 32,
		height: 32,
		marginRight: 10,
	},
	sectionTitle: {
		fontSize: 20,
		fontFamily: 'Inter-Bold',
		color: '#3D3D3D',
		textAlign: 'left',
	},
	viewAllButton: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	viewAllText: {
		color: '#C67C4E',
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		marginRight: 8,
	},
	productsScroll: {
		marginTop: 5,
	},
	featuredScrollContent: {
		paddingLeft: 16,
		paddingRight: 8,
	},
	productsScrollContent: {
		paddingLeft: 16,
		paddingRight: 8,
	},
	regularCard: {
		marginRight: 16,
	},
	discountCard: {
		marginRight: 16,
	},
	exploreGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-around',
		// paddingHorizontal: 4,
		marginTop: 5,
	},
	exploreCard: {
		marginBottom: 20,
		width: width * 0.42,
	},
	lastSection: {
		marginBottom: 100, // Extra space for the tab bar
	},
})
