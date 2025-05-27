import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	SafeAreaView,
	StatusBar,
	Dimensions,
	FlatList,
	ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import NavButton from '@/components/shared/NavButton'
import DiscountProductCard from '@/components/product/DiscountProductCard'
import { useTranslation } from '@/providers/locale'

const { width, height } = Dimensions.get('window')

// Mock sale data
const SALE_BANNER = {
	title: 'Flash Sale 50%',
	subtitle: 'Limited time offer on selected items',
	endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
	backgroundGradient: ['#FF6B6B', '#FF8E53'],
}

const FILTER_OPTIONS = [
	{ id: 'all', label: 'All Deals', icon: 'pricetags' },
	{ id: 'flash', label: 'Flash Sale', icon: 'flash' },
	{ id: 'daily', label: 'Daily Deals', icon: 'calendar' },
	{ id: 'clearance', label: 'Clearance', icon: 'trending-down' },
]

const SORT_OPTIONS = [
	{ id: 'discount', label: 'Highest Discount' },
	{ id: 'price_low', label: 'Price: Low to High' },
	{ id: 'price_high', label: 'Price: High to Low' },
	{ id: 'name', label: 'Name A-Z' },
]

// Mock discounted products
const DISCOUNTED_PRODUCTS = [
	{
		productId: 1,
		name: 'Premium Chocolate Croissant',
		price: 45000,
		originalPrice: 60000,
		discountPercentage: 25,
		imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a',
		isFavorite: false,
		category: 'flash',
		rating: 4.8,
		soldCount: 150,
	},
	{
		productId: 2,
		name: 'Artisan Coffee Blend',
		price: 85000,
		originalPrice: 120000,
		discountPercentage: 30,
		imageUrl: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571',
		isFavorite: true,
		category: 'daily',
		rating: 4.9,
		soldCount: 89,
	},
	{
		productId: 3,
		name: 'Fresh Strawberry Cake',
		price: 180000,
		originalPrice: 250000,
		discountPercentage: 28,
		imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e',
		isFavorite: false,
		category: 'flash',
		rating: 4.7,
		soldCount: 67,
	},
	{
		productId: 4,
		name: 'Earl Grey Tea Set',
		price: 95000,
		originalPrice: 130000,
		discountPercentage: 27,
		imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3',
		isFavorite: false,
		category: 'clearance',
		rating: 4.6,
		soldCount: 43,
	},
	{
		productId: 5,
		name: 'Vanilla Bean Macarons',
		price: 120000,
		originalPrice: 160000,
		discountPercentage: 25,
		imageUrl: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812',
		isFavorite: true,
		category: 'daily',
		rating: 4.8,
		soldCount: 201,
	},
	{
		productId: 6,
		name: 'Iced Matcha Latte',
		price: 42000,
		originalPrice: 55000,
		discountPercentage: 24,
		imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699',
		isFavorite: false,
		category: 'flash',
		rating: 4.5,
		soldCount: 178,
	},
]

export default function SaleOffScreen() {
	const { t } = useTranslation()
	const [activeFilter, setActiveFilter] = useState('all')
	const [sortBy, setSortBy] = useState('discount')
	const [showSortModal, setShowSortModal] = useState(false)
	const [filteredProducts, setFilteredProducts] = useState(DISCOUNTED_PRODUCTS)
	const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 })
	const [favorites, setFavorites] = useState<number[]>([])
	const [loading, setLoading] = useState(false)

	// Countdown timer effect
	useEffect(() => {
		const timer = setInterval(() => {
			const now = new Date().getTime()
			const distance = SALE_BANNER.endTime.getTime() - now

			if (distance > 0) {
				setCountdown({
					hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
					minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
					seconds: Math.floor((distance % (1000 * 60)) / 1000),
				})
			}
		}, 1000)

		return () => clearInterval(timer)
	}, [])

	// Filter and sort products
	useEffect(() => {
		let filtered = DISCOUNTED_PRODUCTS

		if (activeFilter !== 'all') {
			filtered = filtered.filter(product => product.category === activeFilter)
		}

		// Sort products
		filtered.sort((a, b) => {
			switch (sortBy) {
				case 'discount':
					return b.discountPercentage - a.discountPercentage
				case 'price_low':
					return a.price - b.price
				case 'price_high':
					return b.price - a.price
				case 'name':
					return a.name.localeCompare(b.name)
				default:
					return 0
			}
		})

		setFilteredProducts(filtered)
	}, [activeFilter, sortBy])

	const handleToggleFavorite = (productId: number) => {
		setFavorites(prev => 
			prev.includes(productId) 
				? prev.filter(id => id !== productId)
				: [...prev, productId]
		)
	}

	const CountdownTimer = () => (
		<View style={styles.countdownContainer}>
			<Text style={styles.countdownLabel}>Ends in:</Text>
			<View style={styles.timeContainer}>
				<View style={styles.timeUnit}>
					<Text style={styles.timeNumber}>{countdown.hours.toString().padStart(2, '0')}</Text>
					<Text style={styles.timeLabel}>H</Text>
				</View>
				<Text style={styles.timeSeparator}>:</Text>
				<View style={styles.timeUnit}>
					<Text style={styles.timeNumber}>{countdown.minutes.toString().padStart(2, '0')}</Text>
					<Text style={styles.timeLabel}>M</Text>
				</View>
				<Text style={styles.timeSeparator}>:</Text>
				<View style={styles.timeUnit}>
					<Text style={styles.timeNumber}>{countdown.seconds.toString().padStart(2, '0')}</Text>
					<Text style={styles.timeLabel}>S</Text>
				</View>
			</View>
		</View>
	)

	const ProductGrid = () => (
		<FlatList
			data={filteredProducts}
			renderItem={({ item }) => (
				<DiscountProductCard
					product={item}
					onToggleFavorite={handleToggleFavorite}
					style={styles.productCard}
				/>
			)}
			keyExtractor={(item) => item.productId.toString()}
			numColumns={2}
			columnWrapperStyle={styles.row}
			contentContainerStyle={styles.productGrid}
			showsVerticalScrollIndicator={false}
		/>
	)

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />

			{/* Header */}
			<LinearGradient
				colors={SALE_BANNER.backgroundGradient as [string, string]}
				style={styles.header}
			>
				<View style={styles.headerTop}>
					<NavButton
						direction="back"
						onPress={() => router.back()}
						size={32}
						backgroundColor="rgba(255, 255, 255, 0.2)"
						iconColor="#FFFFFF"
					/>
					<Text style={styles.headerTitle}>Sale Off</Text>
					<TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
						<MaterialIcons name="sort" size={24} color="#FFFFFF" />
					</TouchableOpacity>
				</View>

				{/* Sale Banner */}
				<View style={styles.saleBanner}>
					<View style={styles.bannerContent}>
						<View style={styles.bannerLeft}>
							<Text style={styles.bannerTitle}>{SALE_BANNER.title}</Text>
							<Text style={styles.bannerSubtitle}>{SALE_BANNER.subtitle}</Text>
							<View style={styles.statsContainer}>
								<View style={styles.statItem}>
									<Ionicons name="pricetag" size={16} color="#FFFFFF" />
									<Text style={styles.statText}>Up to 50% OFF</Text>
								</View>
								<View style={styles.statItem}>
									<Ionicons name="flash" size={16} color="#FFFFFF" />
									<Text style={styles.statText}>{filteredProducts.length} deals</Text>
								</View>
							</View>
						</View>
						<CountdownTimer />
					</View>
				</View>
			</LinearGradient>

			{/* Filter Tabs */}
			<View style={styles.filterContainer}>
				<ScrollView 
					horizontal 
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filterScrollContent}
				>
					{FILTER_OPTIONS.map((filter) => (
						<TouchableOpacity
							key={filter.id}
							style={[
								styles.filterTab,
								activeFilter === filter.id && styles.activeFilterTab
							]}
							onPress={() => setActiveFilter(filter.id)}
						>
							<Ionicons 
								name={filter.icon as any} 
								size={18} 
								color={activeFilter === filter.id ? '#FFFFFF' : '#C67C4E'} 
							/>
							<Text style={[
								styles.filterText,
								activeFilter === filter.id && styles.activeFilterText
							]}>
								{filter.label}
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>

			{/* Products Section */}
			<View style={styles.productsContainer}>
				<View style={styles.productsHeader}>
					<Text style={styles.resultsText}>
						{filteredProducts.length} deals found
					</Text>
					<TouchableOpacity 
						style={styles.viewToggle}
						onPress={() => setShowSortModal(true)}
					>
						<MaterialIcons name="tune" size={20} color="#C67C4E" />
						<Text style={styles.viewToggleText}>Sort</Text>
					</TouchableOpacity>
				</View>

				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color="#C67C4E" />
					</View>
				) : (
					<ProductGrid />
				)}
			</View>

			{/* Sort Modal */}
			{showSortModal && (
				<View style={styles.modalOverlay}>
					<View style={styles.sortModal}>
						<View style={styles.sortHeader}>
							<Text style={styles.sortTitle}>Sort by</Text>
							<TouchableOpacity onPress={() => setShowSortModal(false)}>
								<Ionicons name="close" size={24} color="#333" />
							</TouchableOpacity>
						</View>
						{SORT_OPTIONS.map((option) => (
							<TouchableOpacity
								key={option.id}
								style={[
									styles.sortOption,
									sortBy === option.id && styles.activeSortOption
								]}
								onPress={() => {
									setSortBy(option.id)
									setShowSortModal(false)
								}}
							>
								<Text style={[
									styles.sortOptionText,
									sortBy === option.id && styles.activeSortOptionText
								]}>
									{option.label}
								</Text>
								{sortBy === option.id && (
									<Ionicons name="checkmark" size={20} color="#C67C4E" />
								)}
							</TouchableOpacity>
						))}
					</View>
				</View>
			)}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F8F1E9',
	},
	header: {
		paddingBottom: 20,
	},
	headerTop: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: 10,
		marginBottom: 20,
	},
	headerTitle: {
		fontSize: 20,
		fontFamily: 'Inter-Bold',
		color: '#FFFFFF',
	},
	sortButton: {
		width: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: 16,
	},
	saleBanner: {
		marginHorizontal: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
		borderRadius: 20,
		padding: 20,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.3)',
	},
	bannerContent: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	bannerLeft: {
		flex: 1,
	},
	bannerTitle: {
		fontSize: 24,
		fontFamily: 'Inter-Bold',
		color: '#FFFFFF',
		marginBottom: 4,
	},
	bannerSubtitle: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: 'rgba(255, 255, 255, 0.9)',
		marginBottom: 16,
	},
	statsContainer: {
		flexDirection: 'row',
		gap: 16,
	},
	statItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	statText: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: '#FFFFFF',
	},
	countdownContainer: {
		alignItems: 'center',
	},
	countdownLabel: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: 'rgba(255, 255, 255, 0.9)',
		marginBottom: 8,
	},
	timeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	timeUnit: {
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: 8,
		padding: 6,
		minWidth: 32,
		alignItems: 'center',
	},
	timeNumber: {
		fontSize: 16,
		fontFamily: 'Inter-Bold',
		color: '#FFFFFF',
	},
	timeLabel: {
		fontSize: 10,
		fontFamily: 'Inter-Medium',
		color: 'rgba(255, 255, 255, 0.8)',
	},
	timeSeparator: {
		fontSize: 16,
		fontFamily: 'Inter-Bold',
		color: '#FFFFFF',
		marginHorizontal: 4,
	},
	filterContainer: {
		backgroundColor: '#FFFFFF',
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#F0E4D7',
	},
	filterScrollContent: {
		paddingHorizontal: 20,
	},
	filterTab: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(198, 124, 78, 0.1)',
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 8,
		marginRight: 12,
		borderWidth: 1,
		borderColor: '#C67C4E',
	},
	activeFilterTab: {
		backgroundColor: '#C67C4E',
	},
	filterText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
		marginLeft: 6,
	},
	activeFilterText: {
		color: '#FFFFFF',
	},
	productsContainer: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	productsHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#F0E4D7',
	},
	resultsText: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#333',
	},
	viewToggle: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	viewToggleText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
	},
	productGrid: {
		paddingHorizontal: 20,
		paddingBottom: 100,
	},
	row: {
		justifyContent: 'space-between',
	},
	productCard: {
		width: (width - 60) / 2,
		marginBottom: 16,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	sortModal: {
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingBottom: 30,
	},
	sortHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#F0E4D7',
	},
	sortTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#333',
	},
	sortOption: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	activeSortOption: {
		backgroundColor: '#FFF8F0',
	},
	sortOptionText: {
		fontSize: 16,
		fontFamily: 'Inter-Regular',
		color: '#333',
	},
	activeSortOptionText: {
		color: '#C67C4E',
		fontFamily: 'Inter-SemiBold',
	},
})
