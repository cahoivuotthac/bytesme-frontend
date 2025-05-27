import React, { useState, useRef, useEffect } from 'react'
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
	Animated,
	ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import ImageCarousel from '@/components/shared/ImageCarousel'
import FeaturedProductCard from '@/components/product/FeaturedProductCard'
import RegularProductCard from '@/components/product/RegularProductCard'
import DiscountProductCard from '@/components/product/DiscountProductCard'
import { useTranslation } from '@/providers/locale'
import { SearchBar } from '@/components/shared/SearchBar'
import { BlurView } from 'expo-blur'
import { productAPI } from '@/utils/api'
import { useAlert } from '@/hooks/useAlert'

const { width } = Dimensions.get('window')

// Updated carousel items with translation keys instead of hardcoded text
const FEATURED_BANNERS = [
	{
		id: 'summer-promo',
		titleKey: 'summerFlashSaleTitle',
		descriptionKey: 'summerFlashSaleDesc',
		imageUrl:
			'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1000',
		linkTo: '/(home)/product/sale-off',
		gradientColors: ['rgba(198, 124, 78, 0.8)', 'rgba(223, 184, 148, 0.85)'],
		backgroundColor: '#F8D9B0',
	},
	{
		id: 'fresh-pastries',
		titleKey: 'freshPastriesTitle',
		descriptionKey: 'freshPastriesDesc',
		imageUrl:
			'https://images.unsplash.com/photo-1509365390695-33aee754301f?q=80&w=1000',
		linkTo: '/(home)/product/categories/3',
		gradientColors: ['rgba(167, 121, 89, 0.8)', 'rgba(226, 192, 162, 0.85)'],
		backgroundColor: '#E2C0A2',
	},
	{
		id: 'craft-drinks',
		titleKey: 'craftBeveragesTitle',
		descriptionKey: 'craftBeveragesDesc',
		imageUrl:
			'https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=1000',
		linkTo: '/(home)/product/categories/13',
		gradientColors: ['rgba(89, 69, 48, 0.8)', 'rgba(145, 118, 98, 0.85)'],
		backgroundColor: '#917662',
	},
]

// REAL CATEGORIES
const CATEGORIES = [
	{
		id: '0',
		name: 'all',
		image: require('@/assets/icons/categories/dishes.png'),
	},
	{
		id: '1',
		name: 'bingsu',
		image: require('@/assets/icons/categories/bingsu.png'),
	},
	{
		id: '3',
		name: 'cakesPastries',
		image: require('@/assets/icons/categories/cake.png'),
	},
	{
		id: '4',
		name: 'layeredCakesCrispyBread',
		image: require('@/assets/icons/categories/layer-cake.png'),
	},
	{
		id: '5',
		name: 'bread',
		image: require('@/assets/icons/categories/bread.png'),
	},
	{
		id: '6',
		name: 'coldCreamCakes',
		image: require('@/assets/icons/categories/cold-cream-cake.png'),
	},
	{
		id: '7',
		name: 'cookies',
		image: require('@/assets/icons/categories/cookie.png'),
	},
	{
		id: '8',
		name: 'seasonalSpecial',
		image: require('@/assets/icons/categories/seasonal-dish.png'),
	},
	{
		id: '9',
		name: 'productSets',
		image: require('@/assets/icons/categories/combo.png'),
	},
	{
		id: '10',
		name: 'icedDrinks',
		image: require('@/assets/icons/categories/cold-drink.png'),
	},
	{
		id: '11',
		name: 'tea',
		image: require('@/assets/icons/categories/tea.png'),
	},
	{
		id: '12',
		name: 'chocolateCacao',
		image: require('@/assets/icons/categories/cocoa.png'),
	},
	{
		id: '13',
		name: 'coffee',
		image: require('@/assets/icons/categories/coffee.png'),
	},
]

// Real product interface to match API response
interface APIProduct {
	product_id: number
	category_id: number
	product_code: string
	product_name: string
	product_discount_percentage: number
	product_total_orders: number
	product_total_ratings: number
	product_overall_stars: number
	product_stock_quantity: number
	product_image_url: string
	product_sizes: string[]
	product_prices: number[]
}

interface HomepageData {
	best_sellers: APIProduct[]
	top_rated: APIProduct[]
	discounted: APIProduct[]
	new_products: APIProduct[]
}

export default function ProductScreen() {
	const [activeCategory, setActiveCategory] = useState('all')
	const [favorites, setFavorites] = useState<number[]>([])
	const [activeSlide, setActiveSlide] = useState(0)
	const { t } = useTranslation()
	const scrollY = useRef(new Animated.Value(0)).current
	const { AlertComponent, showError } = useAlert()

	// Real product data state
	const [homepageData, setHomepageData] = useState<HomepageData | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const categoriesRef = useRef<ScrollView>(null)

	// Fetch homepage products on component mount
	useEffect(() => {
		fetchHomepageProducts()
	}, [])

	const fetchHomepageProducts = async () => {
		setIsLoading(true)
		try {
			console.log('Fetching homepage products...')
			const response = await productAPI.getHomepageProducts()

			if (response.data) {
				console.log('Homepage products fetched successfully:', {
					bestSellers: response.data.best_sellers?.length || 0,
					topRated: response.data.top_rated?.length || 0,
					discounted: response.data.discounted?.length || 0,
					newProducts: response.data.new_products?.length || 0,
				})
				setHomepageData(response.data)
			}
		} catch (error) {
			console.error('Error fetching homepage products:', error)
			showError(t('errorRetry'))
		} finally {
			setIsLoading(false)
		}
	}

	// Convert API product to UI format for different card types
	const convertToFeaturedProduct = (product: APIProduct) => ({
		productId: product.product_id,
		name: product.product_name,
		price: Math.min(...product.product_prices), // Use minimum price
		imageUrl: product.product_image_url,
		isFavorite: favorites.includes(product.product_id),
	})

	const convertToRegularProduct = (product: APIProduct) => ({
		productId: product.product_id,
		name: product.product_name,
		price: Math.min(...product.product_prices), // Use minimum price
		imageUrl: product.product_image_url,
		rating: product.product_overall_stars,
		isFavorite: favorites.includes(product.product_id),
	})

	const convertToDiscountProduct = (product: APIProduct) => ({
		productId: product.product_id,
		name: product.product_name,
		price: Math.round(
			Math.min(...product.product_prices) *
				(1 - product.product_discount_percentage / 100)
		),
		originalPrice: Math.min(...product.product_prices),
		discountPercentage: product.product_discount_percentage,
		imageUrl: product.product_image_url,
		isFavorite: favorites.includes(product.product_id),
	})

	// Handle search submission
	const handleSearchSubmit = (isAiMode: boolean, query: string) => {
		if (query.trim()) {
			router.push({
				pathname: '/(home)/product/search-results',
				params: { query, isAiMode: String(isAiMode) },
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
		if (categoryId === 'all') {
			// Stay on current page for "all" category
		} else {
			// Navigate to specific category page
			router.push(`/(home)/product/categories/${categoryId}`)
		}
	}

	// Calculate header opacity based on scroll position
	const headerOpacity = scrollY.interpolate({
		inputRange: [0, 60, 120],
		outputRange: [1, 0.9, 0.8],
		extrapolate: 'clamp',
	})

	// Carousel indicator dot component
	const CarouselIndicator = () => (
		<View style={styles.indicatorContainer}>
			{FEATURED_BANNERS.map((_, index) => (
				<View
					key={`indicator-${index}`}
					style={[
						styles.indicatorDot,
						index === activeSlide && styles.activeDot,
					]}
				/>
			))}
		</View>
	)

	// Enhanced carousel component
	const FeaturedBannerCarousel = () => (
		<View style={styles.enhancedCarouselContainer}>
			<ScrollView
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onMomentumScrollEnd={(event) => {
					const slideIndex = Math.round(
						event.nativeEvent.contentOffset.x / width
					)
					setActiveSlide(slideIndex)
				}}
			>
				{FEATURED_BANNERS.map((banner, index) => (
					<TouchableOpacity
						key={banner.id}
						style={styles.bannerSlide}
						onPress={() => router.push(banner.linkTo)}
						activeOpacity={0.9}
					>
						<Image
							source={{ uri: banner.imageUrl }}
							style={styles.bannerImage}
							resizeMode="cover"
						/>
						<LinearGradient
							colors={banner.gradientColors}
							style={styles.bannerGradient}
						/>
						<View style={styles.bannerContent}>
							<Text style={styles.bannerTitle}>{t(banner.titleKey)}</Text>
							<Text style={styles.bannerDescription}>
								{t(banner.descriptionKey)}
							</Text>

							<View style={styles.viewOfferButton}>
								<Text style={styles.viewOfferText}>{t('viewOffers')}</Text>
								<MaterialIcons
									name="arrow-forward-ios"
									size={16}
									color="#FFFFFF"
								/>
							</View>
						</View>
					</TouchableOpacity>
				))}
			</ScrollView>
			<CarouselIndicator />
		</View>
	)

	// Section header component for consistent styling
	const SectionHeader = ({
		title,
		icon,
		onViewAll,
		viewAllLabel = t('viewAll'),
		backgroundColor = '#FFF3E0',
	}: {
		title: string
		icon: string
		onViewAll: () => void
		viewAllLabel?: string
		backgroundColor?: string
	}) => (
		<View style={styles.sectionTitleContainer}>
			<View style={styles.sectionTitleWrapper}>
				<View style={[styles.sectionIconContainer, { backgroundColor }]}>
					<Ionicons name={icon as any} size={22} color="#C67C4E" />
				</View>
				<Text style={styles.sectionTitle}>{title}</Text>
			</View>
			<TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
				<Text style={styles.viewAllText}>{viewAllLabel}</Text>
				<MaterialIcons name="arrow-forward-ios" size={16} color="#C67C4E" />
			</TouchableOpacity>
		</View>
	)

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="dark-content" backgroundColor="#F8E8D8" />
			{AlertComponent}

			{/* Header Background - Fixed at the top */}
			<Animated.View
				style={[styles.headerBackground, { opacity: headerOpacity }]}
			>
				<LinearGradient
					colors={['#FFF2E5', '#F8E8D8']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.headerGradient}
				/>
			</Animated.View>

			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#C67C4E" />
					<Text style={styles.loadingText}>{t('loading')}</Text>
				</View>
			) : (
				<Animated.ScrollView
					style={styles.scrollView}
					showsVerticalScrollIndicator={false}
					scrollEventThrottle={16}
					onScroll={Animated.event(
						[{ nativeEvent: { contentOffset: { y: scrollY } } }],
						{ useNativeDriver: true }
					)}
					contentContainerStyle={styles.scrollViewContent}
					stickyHeaderIndices={[1]} // Make categories sticky
				>
					{/* Search Bar - Now part of scrollable content */}
					<View style={styles.searchBarContainer}>
						<SearchBar
							showAiButton={true}
							handleSearchSubmit={handleSearchSubmit}
							handleAiButtonPress={() => {}}
						/>
					</View>

					{/* Categories Tabs */}
					<View style={styles.categoriesWrapperContainer}>
						<BlurView intensity={50} tint="light" style={styles.blurContainer}>
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
												activeCategory === category.id &&
													styles.activeCategoryText,
											]}
										>
											{t(category.name)}
										</Text>
									</TouchableOpacity>
								))}
							</ScrollView>
						</BlurView>
					</View>

					{/* Enhanced Featured Banner Carousel */}
					<FeaturedBannerCarousel />

					{/* Best-selling Products */}
					{homepageData?.best_sellers &&
						homepageData.best_sellers.length > 0 && (
							<View style={styles.sectionContainer}>
								<SectionHeader
									title={t('bestSellers')}
									icon="trending-up"
									onViewAll={() =>
										router.push('/(home)/product/sections/featured')
									}
								/>

								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={styles.featuredScrollContent}
									decelerationRate="fast"
									snapToAlignment="center"
									style={styles.productsScroll}
								>
									{homepageData.best_sellers.slice(0, 6).map((product) => (
										<FeaturedProductCard
											key={product.product_id}
											product={convertToFeaturedProduct(product)}
											onToggleFavorite={handleToggleFavorite}
										/>
									))}
								</ScrollView>
							</View>
						)}

					{/* Highest-rated section */}
					{homepageData?.top_rated && homepageData.top_rated.length > 0 && (
						<View style={styles.sectionContainer}>
							<SectionHeader
								title={t('highestRated')}
								icon="star"
								onViewAll={() =>
									router.push('/(home)/product/sections/highest-rated')
								}
								backgroundColor="#FFF3D8"
							/>

							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.productsScrollContent}
								style={styles.productsScroll}
							>
								{homepageData.top_rated.slice(0, 6).map((product) => (
									<RegularProductCard
										key={product.product_id}
										product={convertToRegularProduct(product)}
										onToggleFavorite={handleToggleFavorite}
										style={styles.regularCard}
									/>
								))}
							</ScrollView>
						</View>
					)}

					{/* Discounted Products Section */}
					{homepageData?.discounted && homepageData.discounted.length > 0 && (
						<View style={styles.sectionContainer}>
							<SectionHeader
								title={t('discounted')}
								icon="pricetag"
								onViewAll={() => router.push('/(home)/product/sale-off')}
								viewAllLabel={t('moreVouchers')}
								backgroundColor="#FFE8E8"
							/>

							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.productsScrollContent}
								style={styles.productsScroll}
							>
								{homepageData.discounted.slice(0, 6).map((product) => (
									<DiscountProductCard
										key={product.product_id}
										product={convertToDiscountProduct(product)}
										onToggleFavorite={handleToggleFavorite}
										style={styles.discountCard}
									/>
								))}
							</ScrollView>
						</View>
					)}

					{/* New Products Section - Enhanced styling */}
					{homepageData?.new_products &&
						homepageData.new_products.length > 0 && (
							<View
								style={[styles.sectionContainer, styles.newProductsSection]}
							>
								<SectionHeader
									title={t('newProducts')}
									icon="sparkles"
									onViewAll={() =>
										router.push('/(home)/product/sections/new-products')
									}
									backgroundColor="#E8F5E8"
								/>

								{/* Featured new product card */}
								{homepageData.new_products[0] && (
									<View style={styles.featuredNewProductContainer}>
										<TouchableOpacity
											style={styles.featuredNewProductCard}
											onPress={() =>
												router.push({
													pathname: '/(home)/product/[id]',
													params: {
														id: homepageData.new_products[0].product_id,
													},
												})
											}
											activeOpacity={0.9}
										>
											<Image
												source={{
													uri: homepageData.new_products[0].product_image_url,
												}}
												style={styles.featuredNewProductImage}
												resizeMode="cover"
											/>
											<LinearGradient
												colors={[
													'rgba(76, 175, 80, 0.8)',
													'rgba(129, 199, 132, 0.85)',
												]}
												style={styles.featuredNewProductGradient}
											/>
											<View style={styles.newBadge}>
												<Ionicons name="sparkles" size={16} color="#FFFFFF" />
												<Text style={styles.newBadgeText}>{t('new')}</Text>
											</View>
											<View style={styles.featuredNewProductContent}>
												<Text
													style={styles.featuredNewProductTitle}
													numberOfLines={2}
												>
													{homepageData.new_products[0].product_name}
												</Text>
												<Text style={styles.featuredNewProductPrice}>
													{Math.min(
														...homepageData.new_products[0].product_prices
													).toLocaleString()}
													đ
												</Text>
												<View style={styles.tryNowButton}>
													<Text style={styles.tryNowText}>{t('tryNow')}</Text>
													<MaterialIcons
														name="arrow-forward"
														size={18}
														color="#FFFFFF"
													/>
												</View>
											</View>
										</TouchableOpacity>
									</View>
								)}

								{/* Grid of other new products */}
								<View style={styles.newProductsGrid}>
									{homepageData.new_products
										.slice(1, 5)
										.map((product, index) => (
											<TouchableOpacity
												key={product.product_id}
												style={[
													styles.newProductCard,
													index % 2 === 0
														? styles.newProductCardLeft
														: styles.newProductCardRight,
												]}
												onPress={() =>
													router.push({
														pathname: '/(home)/product/[id]',
														params: { id: product.product_id },
													})
												}
												activeOpacity={0.8}
											>
												<View style={styles.newProductImageContainer}>
													<Image
														source={{ uri: product.product_image_url }}
														style={styles.newProductImage}
														resizeMode="cover"
													/>
													<View style={styles.smallNewBadge}>
														<Text style={styles.smallNewBadgeText}>
															{t('new')}
														</Text>
													</View>
													<TouchableOpacity
														style={styles.newProductHeartButton}
														onPress={() =>
															handleToggleFavorite(product.product_id)
														}
													>
														<Ionicons
															name={
																favorites.includes(product.product_id)
																	? 'heart'
																	: 'heart-outline'
															}
															size={18}
															color={
																favorites.includes(product.product_id)
																	? '#FF6B6B'
																	: '#999'
															}
														/>
													</TouchableOpacity>
												</View>
												<View style={styles.newProductInfo}>
													<Text style={styles.newProductName} numberOfLines={2}>
														{product.product_name}
													</Text>
													<Text style={styles.newProductPrice}>
														{Math.min(
															...product.product_prices
														).toLocaleString()}
														đ
													</Text>
												</View>
											</TouchableOpacity>
										))}
								</View>
							</View>
						)}
				</Animated.ScrollView>
			)}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FAF8F5',
	},
	scrollView: {
		flex: 1,
	},
	scrollViewContent: {
		paddingBottom: 100, // Space for tab bar
	},
	headerBackground: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: 185, // Increased to accommodate search bar + categories
		zIndex: 0, // Lower z-index so it doesn't overlap content
	},
	headerGradient: {
		flex: 1,
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
	},
	searchBarContainer: {
		// paddingHorizontal: 16,
		paddingTop: 10,
		paddingBottom: 15,
		zIndex: 1,
	},
	categoriesWrapperContainer: {
		backgroundColor: 'rgba(255, 248, 239, 0.85)',
		paddingVertical: 16,
		zIndex: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#E8DFD5',
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
		marginBottom: 16, // Add space between categories and carousel
	},
	enhancedCarouselContainer: {
		marginTop: 8, // Reduced margin to bring closer to categories
		marginBottom: 25,
		height: 200,
	},
	bannerSlide: {
		width,
		height: 180,
		paddingHorizontal: 16,
	},
	bannerImage: {
		width: '100%',
		height: '100%',
		borderRadius: 24,
	},
	bannerGradient: {
		position: 'absolute',
		top: 0,
		left: 16,
		right: 16,
		height: '100%',
		borderRadius: 24,
	},
	bannerContent: {
		position: 'absolute',
		top: 0,
		left: 16,
		right: 16,
		bottom: 0,
		padding: 20,
		justifyContent: 'center',
	},
	bannerTitle: {
		fontSize: 24,
		fontFamily: 'Inter-Bold',
		color: '#FFFFFF',
		marginBottom: 8,
		textShadowColor: 'rgba(0, 0, 0, 0.5)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 3,
	},
	bannerDescription: {
		fontSize: 16,
		fontFamily: 'Inter-Regular',
		color: '#FFFFFF',
		marginBottom: 20,
		textShadowColor: 'rgba(0, 0, 0, 0.5)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 3,
	},
	viewOfferButton: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		backgroundColor: 'rgba(255, 255, 255, 0.25)',
		borderRadius: 20,
		paddingVertical: 8,
		paddingHorizontal: 16,
	},
	viewOfferText: {
		color: '#FFFFFF',
		fontFamily: 'Inter-Medium',
		fontSize: 14,
		marginRight: 6,
	},
	indicatorContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 10,
	},
	indicatorDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#CCCCCC',
		marginHorizontal: 4,
	},
	activeDot: {
		width: 16,
		backgroundColor: '#C67C4E',
	},
	blurContainer: {
		flex: 1,
	},
	categoriesContainer: {
		backgroundColor: 'rgba(255, 248, 239, 0.85)',
		paddingVertical: 16,
		zIndex: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#E8DFD5',
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
		marginBottom: 16, // Add space between categories and carousel
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
		marginTop: 24,
		marginBottom: 8,
		backgroundColor: '#FFFFFF',
		marginHorizontal: 16,
		borderRadius: 24,
		paddingVertical: 18,
		paddingBottom: 22,
		shadowColor: 'rgba(137, 100, 80, 0.2)',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 12,
		elevation: 4,
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
	sectionIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 10,
		elevation: 2,
		shadowColor: '#C67C4E',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
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
		backgroundColor: 'rgba(198, 124, 78, 0.1)',
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 16,
	},
	viewAllText: {
		color: '#C67C4E',
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		marginRight: 4,
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
	newProductsSection: {
		marginBottom: 100,
		backgroundColor: '#F8FFF8',
		borderWidth: 2,
		borderColor: '#E8F5E8',
	},
	featuredNewProductContainer: {
		marginHorizontal: 16,
		marginBottom: 20,
	},
	featuredNewProductCard: {
		height: 160,
		borderRadius: 20,
		overflow: 'hidden',
		position: 'relative',
		shadowColor: '#4CAF50',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 12,
		elevation: 8,
	},
	featuredNewProductImage: {
		width: '100%',
		height: '100%',
	},
	featuredNewProductGradient: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	newBadge: {
		position: 'absolute',
		top: 12,
		left: 12,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(76, 175, 80, 0.9)',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 3,
	},
	newBadgeText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontFamily: 'Inter-Bold',
		marginLeft: 4,
		textTransform: 'uppercase',
	},
	featuredNewProductContent: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		padding: 16,
	},
	featuredNewProductTitle: {
		fontSize: 18,
		fontFamily: 'Inter-Bold',
		color: '#FFFFFF',
		marginBottom: 4,
		textShadowColor: 'rgba(0, 0, 0, 0.3)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
	},
	featuredNewProductPrice: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#FFFFFF',
		marginBottom: 12,
		textShadowColor: 'rgba(0, 0, 0, 0.3)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 2,
	},
	tryNowButton: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		backgroundColor: 'rgba(255, 255, 255, 0.25)',
		borderRadius: 20,
		paddingVertical: 8,
		paddingHorizontal: 16,
		backdropFilter: 'blur(10px)',
	},
	tryNowText: {
		color: '#FFFFFF',
		fontFamily: 'Inter-Medium',
		fontSize: 14,
		marginRight: 6,
	},
	newProductsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
	},
	newProductCard: {
		width: '47%',
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		marginBottom: 16,
		shadowColor: '#4CAF50',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
		borderWidth: 1,
		borderColor: '#E8F5E8',
	},
	newProductCardLeft: {
		marginRight: '3%',
	},
	newProductCardRight: {
		marginLeft: '3%',
	},
	newProductImageContainer: {
		position: 'relative',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		overflow: 'hidden',
	},
	newProductImage: {
		width: '100%',
		height: 120,
	},
	smallNewBadge: {
		position: 'absolute',
		top: 8,
		left: 8,
		backgroundColor: '#4CAF50',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	smallNewBadgeText: {
		color: '#FFFFFF',
		fontSize: 10,
		fontFamily: 'Inter-Bold',
		textTransform: 'uppercase',
	},
	newProductHeartButton: {
		position: 'absolute',
		top: 8,
		right: 8,
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	newProductInfo: {
		padding: 12,
	},
	newProductName: {
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#2E2E2E',
		marginBottom: 6,
		lineHeight: 18,
	},
	newProductPrice: {
		fontSize: 14,
		fontFamily: 'Inter-Bold',
		color: '#4CAF50',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#FAF8F5',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
	},
})
