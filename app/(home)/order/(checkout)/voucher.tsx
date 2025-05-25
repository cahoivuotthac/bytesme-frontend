import React, { useState, useEffect, useRef, useMemo, useContext } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	SafeAreaView,
	ActivityIndicator,
	Image,
	Modal,
	Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from '@/providers/locale'
import { useAlert } from '@/hooks/useAlert'
import { CheckoutContext, Voucher } from './_layout'
import { voucherAPI } from '@/utils/api'
import { formatDate } from '@/utils/display'
import { formatVoucherValue } from '@/utils/vouchers'
import ZigzagBorder from '@/components/shared/ZigzagBorder'
import NavButton from '@/components/shared/NavButton'
import Button from '@/components/ui/Button'
import VoucherRuleDisplay from '@/components/shared/VoucherRuleDisplay'
import BottomSpacer from '@/components/shared/BottomSpacer'

// Helper function to format date

// Get voucher thumbnail image based on voucher type
const getVoucherIcon = (voucherField: string) => {
	switch (voucherField) {
		case 'birthday_gift':
			return require('@/assets/icons/voucher/birthday.png')
		case 'freeship':
			return require('@/assets/icons/voucher/flychicken.png')
		case 'loyal_customer':
			return require('@/assets/icons/voucher/chicken.png')
		case 'new_customer':
			return require('@/assets/icons/voucher/monkey.png')
		default:
			return require('@/assets/icons/voucher/discount.png')
	}
}

// Determine background and text color based on voucher type
const getVoucherColors = (field: string) => {
	switch (field) {
		case 'birthday_gift':
			return {
				bg: '#D99B77',
				lightBg: '#FEF6EF',
				highlightText: '#D99B77',
			}
		case 'freeship':
			return {
				bg: '#C4B099',
				lightBg: '#F7F4EF',
				highlightText: '#A9411D',
			}
		case 'loyal_customer':
			return {
				bg: '#DF9B7A',
				lightBg: '#FEF6EF',
				highlightText: '#DF9B7A',
			}
		default:
			return {
				bg: '#E4B394',
				lightBg: '#FEF6EF',
				highlightText: '#D99B77',
			}
	}
}

// VoucherItem Component with repositioned zigzag and dashed line
interface VoucherItemProps {
	voucher: Voucher
	isSelected: boolean
	is_applicable: boolean
	isBestChoice: boolean
	onSelect: (voucher: Voucher) => void
	onApply: (voucher: Voucher) => void
}

const VoucherItem = ({
	voucher,
	isSelected,
	isBestChoice,
	is_applicable = true,
	onSelect,
	onApply,
}: VoucherItemProps) => {
	const { t, locale } = useTranslation()
	const cardRef = useRef(null)
	const [cardHeight, setCardHeight] = useState(0)
	const expiryDate = formatDate(voucher.voucher_end_date, locale)
	const colors = getVoucherColors(voucher.voucher_fields)
	const [showDetailsModal, setShowDetailsModal] = useState(false)
	const [expandRules, setExpandRules] = useState(false)
	const scaleAnim = useRef(new Animated.Value(1)).current

	// Handle selection animation
	useEffect(() => {
		if (isSelected) {
			Animated.sequence([
				Animated.timing(scaleAnim, {
					toValue: 1.03,
					duration: 150,
					useNativeDriver: true,
				}),
				Animated.timing(scaleAnim, {
					toValue: 1,
					duration: 150,
					useNativeDriver: true,
				}),
			]).start()
		}
	}, [isSelected])

	// Add opacity to non-applicable vouchers
	const notApplicableStyle = !is_applicable ? { opacity: 0.5 } : {}

	return (
		<>
			<Animated.View
				style={{
					transform: [{ scale: scaleAnim }],
					width: '100%',
				}}
			>
				<View
					style={[styles.voucherCardWrapper, notApplicableStyle]}
					ref={cardRef}
					onLayout={(event) => {
						const { height } = event.nativeEvent.layout
						setCardHeight(height)
					}}
				>
					{/* Floating bottom decoration layers */}
					<View
						style={[styles.floatingLayer1, { backgroundColor: '#E5E5E5' }]}
					/>
					<View
						style={[styles.floatingLayer2, { backgroundColor: '#F0F0F0' }]}
					/>

					{/* Main card */}
					<TouchableOpacity
						style={[
							styles.voucherCard,
							{ backgroundColor: isSelected ? colors.lightBg : '#FFFFFF' },
						]}
						onPress={() => onSelect(voucher)}
						activeOpacity={0.8}
						disabled={!is_applicable}
					>
						{/* Left side with background color and icon */}
						<View style={[styles.voucherLeft, { backgroundColor: colors.bg }]}>
							<View style={styles.voucherIconContainer}>
								<Image
									source={getVoucherIcon(voucher.voucher_fields)}
									style={styles.voucherIcon}
									resizeMode="contain"
								/>
							</View>
							<Text style={styles.voucherName}>{voucher.voucher_name}</Text>

							{/* Zigzag border now at the right side of left card */}
							{cardHeight > 0 && (
								<View style={styles.zigzagContainer}>
									<ZigzagBorder
										height={cardHeight}
										width={3}
										color={colors.bg} // Use the dynamic background color based on voucher type
										position="right"
									/>
								</View>
							)}
						</View>

						{/* Dashed line separator - now at the left side of right card */}
						<View style={styles.dashedLine}>
							{Array.from({ length: Math.ceil(cardHeight / 6) }).map(
								(_, index) => (
									<View key={index} style={styles.dashLine} />
								)
							)}
						</View>

						{/* Right side with details */}
						<View style={styles.voucherRight}>
							<View style={styles.voucherDetails}>
								<Text style={styles.voucherDescription}>
									{voucher.voucher_description}
								</Text>

								{/* Use VoucherRuleDisplay for showing rules */}
								<VoucherRuleDisplay
									rules={voucher.voucher_rules}
									style={styles.rulesContainer}
									isExpanded={false}
									maxRulesCollapsed={2}
								/>

								{/* Show unavailable message if not applicable */}
								{!is_applicable && (
									<Text style={styles.notApplicableText}>
										{t('voucherNotApplicable')}
									</Text>
								)}

								{/* Show expiry date */}
								{voucher.voucher_end_date && (
									<Text style={styles.voucherExpiry}>
										{t('validUntil')} {expiryDate}
									</Text>
								)}

								{/* Show details button */}
								{voucher.voucher_rules && voucher.voucher_rules.length > 0 && (
									<TouchableOpacity
										style={styles.viewDetailsButton}
										onPress={() => setShowDetailsModal(true)}
									>
										<Text style={styles.viewDetailsText}>
											{t('viewAllConditions')}
										</Text>
										<Ionicons name="chevron-down" size={12} color="#C67C4E" />
									</TouchableOpacity>
								)}
							</View>

							{/* Radio button */}
							<View style={styles.radioContainer}>
								<View
									style={[
										styles.radioOuter,
										isSelected && [
											styles.radioOuterSelected,
											{ borderColor: colors.highlightText },
										],
									]}
								>
									{isSelected && (
										<View
											style={[
												styles.radioInner,
												{ backgroundColor: colors.highlightText },
											]}
										/>
									)}
								</View>
							</View>

							{/* Best choice badge */}
							{isBestChoice && voucher.is_applicable && (
								<View style={styles.bestChoiceBadge}>
									<Text style={styles.bestChoiceText}>Lựa chọn tốt nhất</Text>
								</View>
							)}

							{/* "Đã chọn" badge */}
							{isSelected && (
								<View
									style={[
										styles.selectedBadge,
										{ backgroundColor: `${colors.highlightText}1A` },
									]}
								>
									<Text
										style={[
											styles.selectedText,
											{ color: colors.highlightText },
										]}
									>
										Đã chọn
									</Text>
								</View>
							)}
						</View>
					</TouchableOpacity>
				</View>
			</Animated.View>

			{/* Voucher Details Modal */}
			<Modal
				animationType="fade"
				transparent={true}
				visible={showDetailsModal}
				onRequestClose={() => setShowDetailsModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>{t('voucherDetails')}</Text>
							<TouchableOpacity
								onPress={() => setShowDetailsModal(false)}
								style={styles.closeButton}
							>
								<Ionicons name="close" size={24} color="#333333" />
							</TouchableOpacity>
						</View>

						<ScrollView
							style={styles.modalBody}
							showsVerticalScrollIndicator={false}
						>
							<Text style={styles.detailTitle}>{voucher.voucher_name}</Text>
							<Text style={styles.detailCode}>{voucher.voucher_code}</Text>
							{/* Cheat: if voucher type if gift product, we don't show this to avoid duplicate info */}
							{voucher.voucher_type !== 'gift_product' && (
								<Text style={styles.detailDescription}>
									{voucher.voucher_description}
								</Text>
							)}

							<View style={styles.voucherValueContainer}>
								<Text style={styles.voucherValueLabel}>
									{t('voucherValue')}:
								</Text>
								<Text style={styles.voucherValueText}>
									{formatVoucherValue(voucher)}
								</Text>
							</View>

							<View style={styles.validityContainer}>
								<Text style={styles.validityLabel}>
									{t('validFrom') +
										formatDate(voucher.voucher_start_date, locale) +
										t('validUntil') +
										formatDate(voucher.voucher_end_date, locale)}
								</Text>
							</View>

							<View style={styles.rulesContainer}>
								<Text style={styles.rulesTitle}>{t('voucherRules')}</Text>
								{/* <TouchableOpacity
									style={styles.expandButton}
									onPress={() => setExpandRules(!expandRules)}
								>
									<Text style={styles.expandButtonText}>
										{expandRules ? t('showLess') : t('viewAllConditions')}
									</Text>
									<Ionicons
										name={expandRules ? 'chevron-up' : 'chevron-down'}
										size={16}
										color="#C67C4E"
									/>
								</TouchableOpacity> */}

								<VoucherRuleDisplay
									rules={voucher.voucher_rules}
									isExpanded={expandRules}
									style={styles.rulesDisplay}
								/>
							</View>
						</ScrollView>

						<View style={styles.modalFooter}>
							<Button
								text={
									!is_applicable ? t('voucherNotApplicable') : t('applyVoucher')
								}
								onPress={() => {
									setShowDetailsModal(false)
									if (is_applicable) {
										onApply(voucher)
									}
								}}
								style={styles.applyButton}
								backgroundColor={is_applicable ? '#C67C4E' : '#CCCCCC'}
								disabled={!is_applicable}
							/>
						</View>
					</View>
				</View>
			</Modal>
		</>
	)
}

export default function VoucherPage() {
	const { t } = useTranslation()
	const { AlertComponent, showInfo } = useAlert()
	const [hasMoreVouchers, setHasMoreVouchers] = useState(false)

	// Get checkout context data
	const {
		checkoutItems,
		setIsLoadingVouchers,
		subtotal,
		deliveryFee,
		appliedVoucher,
		selectedVoucher,
		setSelectedVoucher,
		setAppliedVoucher,
		vouchers,
		setVouchers,
		isLoadingVouchers,
		// calculateDiscountValue,
	} = useContext(CheckoutContext)

	console.log('subtotal in voucher page: ', subtotal)

	// Local state
	const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(
		selectedVoucher?.voucher_id || null
	)
	const [sortedVouchers, setSortedVouchers] = useState<Voucher[]>([])
	const pageSize = 15
	const [page, setPage] = useState(0)

	/**-------------------------------- Fetch vouchers on mount ------------------------------------------- */
	useEffect(() => {
		const fetchAllVouchers = async () => {
			if (!checkoutItems || checkoutItems.length === 0) return
			setIsLoadingVouchers(true)
			try {
				// In a real app, fetch from API
				const response = await voucherAPI.getVouchers(
					checkoutItems.map((item) => item.productId),
					0,
					pageSize
				)
				const vouchers = response.data.vouchers.map((voucher: Voucher) => ({
					...voucher,
					isSelected: voucher.voucher_id === selectedVoucher?.voucher_id,
				})) as Voucher[]
				const hasMore = response.data.has_more
				setHasMoreVouchers(hasMore)

				setVouchers(vouchers)
				setIsLoadingVouchers(false)
			} catch (error) {
				console.error('Error fetching vouchers:', error)
				setIsLoadingVouchers(false)
			}
		}

		fetchAllVouchers()
	}, [checkoutItems, subtotal, deliveryFee])

	/**-------------------------------- Sort vouchers ------------------------------------------- */
	useEffect(() => {
		if (!vouchers || vouchers.length === 0) return

		console.log('DEBUG: vouchers changed, now sorting')

		// Create a copy before sorting to avoid mutation
		const vouchersCopy = [...vouchers]
		const sorted = vouchersCopy.sort((a, b) => {
			if (a.is_applicable && !b.is_applicable) return -1
			if (!a.is_applicable && b.is_applicable) return 1
			return b.discount_value - a.discount_value
		})

		// Only update if sorting has actually changed the order
		if (
			JSON.stringify(sorted.map((v) => v.voucher_id)) !==
			JSON.stringify(sortedVouchers.map((v) => v.voucher_id))
		) {
			setSortedVouchers(sorted)
		}
	}, [subtotal, vouchers])

	/**-------------------------------- Load more vouchers ------------------------------------------- */
	const loadMoreVouchers = async () => {
		const nextPage = page + 1
		const offset = nextPage * pageSize
		setIsLoadingVouchers(true)
		try {
			const newVouchers = (
				await voucherAPI.getVouchers(
					checkoutItems.map((item) => item.productId),
					offset,
					pageSize
				)
			).data as Voucher[]
			if (newVouchers.length > 0) {
				const updatedVouchers = [...vouchers, ...newVouchers]
				setVouchers(updatedVouchers)
			}
			setIsLoadingVouchers(false)
			setPage(nextPage)
		} catch (error) {
			console.error('Error loading more vouchers:', error)
			setIsLoadingVouchers(false)
		}
	}

	// Select voucher handler
	const selectVoucher = (voucher: Voucher) => {
		if (!voucher.is_applicable) {
			showInfo('Voucher này không khả dụng cho đơn hàng của bạn')
			return
		}

		// Check if selecting the same voucher (toggle selection)
		if (selectedVoucherId === voucher.voucher_id) {
			// Deselect
			setSelectedVoucher(null)
			setSelectedVoucherId(null)
			setAppliedVoucher(null)

			// Update UI state
			const updatedVouchers = vouchers.map((v) => ({
				...v,
				isSelected: false,
			})) as Voucher[]
			setVouchers(updatedVouchers)

			return
		}

		// Select new voucher
		setSelectedVoucher(voucher)
		setSelectedVoucherId(voucher.voucher_id)

		// Update UI state
		const updatedVouchers = vouchers.map((v) => ({
			...v,
			isSelected: v.voucher_id === voucher.voucher_id,
		}))
		setVouchers(updatedVouchers)
	}

	useEffect(() => {
		console.log('DEBUG: selected voucher changed ', selectedVoucher)
	}, [selectedVoucher])

	// Handle confirmation and return to checkout page
	const handleApplyVoucher = (
		voucher: Voucher,
		navigateBack: boolean = true
	) => {
		if (!selectedVoucherId) {
			showInfo(t('noVoucherSelected'))
			return
		} else {
			// const appliedVoucher = vouchers.find((v) => v.voucher_id === selected)
			setSelectedVoucher(voucher)
			setSelectedVoucherId(voucher.voucher_id)
			setAppliedVoucher(voucher)
			console.log('Setting applied voucher to: ', voucher)
			if (navigateBack) router.back()
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			{AlertComponent}

			{/* Header */}
			<View style={styles.header}>
				<NavButton
					direction="back"
					style={styles.backButton}
					backgroundColor="transparent"
					iconColor="#C67C4E"
				/>
				<Text style={styles.headerTitle}>{t('chonBytesmeVoucher')}</Text>
			</View>

			{/* Main Content */}
			{isLoadingVouchers ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#C67C4E" />
					<Text style={styles.loadingText}>{t('dangTaiVoucher')}</Text>
				</View>
			) : (
				<>
					<ScrollView
						style={styles.content}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.scrollContent}
					>
						{sortedVouchers.map((voucher, index) => (
							<VoucherItem
								key={voucher.voucher_id}
								voucher={voucher}
								isSelected={voucher.voucher_id === selectedVoucherId}
								// onSelect={selectVoucher}
								onSelect={selectVoucher}
								onApply={(voucher) => {
									if (selectedVoucher) {
										handleApplyVoucher(voucher, false)
									}
								}}
								is_applicable={voucher.is_applicable}
								isBestChoice={index === 0}
							/>
						))}

						{vouchers.length > 0 && hasMoreVouchers && (
							<View style={styles.showMoreContainer}>
								<TouchableOpacity
									style={styles.showMoreButton}
									onPress={loadMoreVouchers}
									disabled={isLoadingVouchers}
								>
									{isLoadingVouchers ? (
										<View style={styles.loadingContainer}>
											<ActivityIndicator size="small" color="#C67C4E" />
											<Text style={styles.showMoreText}>{t('dangTai')}</Text>
										</View>
									) : (
										<>
											<Text style={styles.showMoreText}>{t('xemThem')}</Text>
											<Ionicons name="chevron-down" size={16} color="#C67C4E" />
										</>
									)}
								</TouchableOpacity>
							</View>
						)}

						{selectedVoucher && (
							<View style={styles.selectionInfo}>
								<Text style={styles.selectionText}>1 voucher đã được chọn</Text>
								<Text style={styles.appliedText}>
									Đã áp dụng tại đơn KH thân thiết
								</Text>
							</View>
						)}

						{/* Bottom spacing */}
						<View style={styles.bottomSpacer} />
					</ScrollView>
					<BottomSpacer height={100} />

					{/* Apply Voucher Button*/}
					<View style={styles.buttonContainer}>
						<Button
							text={
								appliedVoucher &&
								selectedVoucher?.voucher_id === appliedVoucher?.voucher_id
									? t('voucherAlreadyApplied')
									: t('applyVoucher')
							}
							onPress={() => {
								if (selectedVoucher) {
									handleApplyVoucher(selectedVoucher)
								}
							}}
							disabled={
								selectedVoucherId == null ||
								selectedVoucher?.voucher_id === appliedVoucher?.voucher_id
							}
							style={styles.confirmButton}
						/>
					</View>
				</>
			)}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F9F9F9',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		paddingHorizontal: 16,
		backgroundColor: '#FFFFFF',
	},
	backButton: {
		position: 'absolute',
		left: 16,
		zIndex: 10,
	},
	headerTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#383838',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#383838',
	},

	rulesContainer: {
		marginVertical: 4, // Reduced spacing
		marginBottom: 16,
	},
	notApplicableText: {
		color: '#FF6B6B',
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		marginTop: 4,
		marginBottom: 2,
	},
	viewDetailsButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 6,
	},
	viewDetailsText: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
		marginRight: 4,
	},

	content: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 16,
		paddingTop: 16,
	},
	voucherCardWrapper: {
		marginBottom: 20,
		position: 'relative',
		borderRadius: 12,
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		marginHorizontal: 2,
		backgroundColor: 'transparent',
		paddingLeft: 2,
	},
	cardShadowLayer: {
		position: 'absolute',
		top: 3,
		left: 3,
		right: 3,
		bottom: 0,
		backgroundColor: '#EAEAEA',
		borderRadius: 12,
		zIndex: 1,
	},
	zigzagContainer: {
		position: 'absolute',
		right: -1, // Moved to the right edge of the left card
		top: 0,
		bottom: 0,
		width: 13,
		height: '100%',
		zIndex: 3, // Higher zIndex to appear over content
	},
	voucherCard: {
		flexDirection: 'row',
		borderRadius: 0,
		overflow: 'hidden',
		backgroundColor: '#FFFFFF',
		position: 'relative',
		zIndex: 3,
		alignItems: 'stretch', // Ensure children stretch to full height
		minHeight: 120, // Set minimum height instead of fixed height
	},
	voucherLeft: {
		width: '35%', // Increase width for more space for text
		padding: 12,
		paddingHorizontal: 8, // Adjusted horizontal padding
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'stretch', // Make left side stretch to card height
		position: 'relative', // Needed for absolute positioning of zigzag
		zIndex: 2,
	},
	voucherIconContainer: {
		marginBottom: 8,
	},
	voucherIcon: {
		width: 48,
		height: 48,
		resizeMode: 'contain',
	},
	voucherName: {
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#FFFFFF',
		textAlign: 'center',
		flexWrap: 'wrap',
		lineHeight: 18,
	},
	dashedLine: {
		position: 'absolute',
		left: 0, // Moved slightly to the right after the zigzag
		top: 0,
		bottom: 0,
		width: 14,
		zIndex: 3,
	},
	dashLine: {
		height: 4,
		width: 1,
		backgroundColor: '#E0E0E0',
		marginVertical: 2,
	},
	voucherRight: {
		flex: 1,
		flexDirection: 'row',
		padding: 16,
		paddingLeft: 24, // Increased to provide space from the dashed line
		justifyContent: 'space-between', // Ensure proper spacing between content and radio button
	},
	voucherDetails: {
		flex: 1,
		justifyContent: 'center', // Center content vertically
	},
	voucherDescription: {
		fontSize: 14, // Reduced from 16px to 14px
		fontFamily: 'Inter-SemiBold',
		color: '#383838',
		marginBottom: 6, // Reduced spacing
		flexShrink: 1,
	},
	voucherMinimum: {
		fontSize: 13,
		fontFamily: 'Inter-Medium',
		marginBottom: 4,
	},
	voucherExpiry: {
		fontSize: 10,
		fontFamily: 'Inter-Regular',
		color: '#9E9E9E',
		marginTop: 4,
	},
	radioContainer: {
		justifyContent: 'center',
		paddingLeft: 12,
	},
	radioOuter: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 1,
		borderColor: '#D0D0D0',
		justifyContent: 'center',
		alignItems: 'center',
	},
	radioOuterSelected: {
		borderWidth: 2,
	},
	radioInner: {
		width: 12,
		height: 12,
		borderRadius: 6,
	},
	selectedBadge: {
		position: 'absolute',
		bottom: 8,
		right: 8,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 4,
	},
	selectedText: {
		fontSize: 10,
		fontFamily: 'Inter-Medium',
	},
	bestChoiceBadge: {
		position: 'absolute',
		top: 0,
		right: 0,
		backgroundColor: '#FF9C52',
		paddingHorizontal: 10,
		paddingVertical: 2,
		borderBottomLeftRadius: 8,
		borderBottomRightRadius: 8,
	},
	bestChoiceText: {
		fontSize: 10,
		fontFamily: 'Inter-SemiBold',
		color: '#FFFFFF',
	},
	showMoreContainer: {
		alignItems: 'center',
		marginVertical: 16,
	},
	showMoreButton: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	showMoreText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
		marginRight: 4,
	},
	selectionInfo: {
		alignItems: 'center',
		marginTop: 8,
		marginBottom: 16,
	},
	selectionText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#383838',
		marginBottom: 4,
	},
	appliedText: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#686868',
	},
	bottomSpacer: {
		height: 80,
	},
	buttonContainer: {
		position: 'absolute',
		bottom: 70,
		left: 0,
		right: 0,
		backgroundColor: '#FFFFFF',
		paddingVertical: 16,
		paddingHorizontal: 16,
		borderTopWidth: 1,
		borderTopColor: '#F2F2F2',
	},
	confirmButton: {
		width: '90%',
		// backgroundColor: '#C67C4E',
		paddingVertical: 16,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
	disabledButton: {
		backgroundColor: '#CCCCCC',
	},
	confirmButtonText: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#FFFFFF',
	},
	layeredEdge: {
		position: 'absolute',
		bottom: -3,
		left: 6,
		right: 6,
		height: 6,
		backgroundColor: '#F0F0F0',
		borderBottomLeftRadius: 12,
		borderBottomRightRadius: 12,
		zIndex: 0,
	},
	floatingLayer1: {
		position: 'absolute',
		bottom: -6,
		left: 6,
		right: 6,
		height: 6,
		borderBottomLeftRadius: 12,
		borderBottomRightRadius: 12,
		zIndex: 0,
	},
	floatingLayer2: {
		position: 'absolute',
		bottom: -12,
		left: 12,
		right: 12,
		height: 6,
		borderBottomLeftRadius: 12,
		borderBottomRightRadius: 12,
		zIndex: 0,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '90%',
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 16,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	modalTitle: {
		fontSize: 18,
		fontFamily: 'Inter-SemiBold',
		color: '#333333',
	},
	closeButton: {
		padding: 8,
	},
	modalBody: {
		maxHeight: '70%',
	},
	detailTitle: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#333333',
		marginBottom: 8,
	},
	detailCode: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#666666',
		marginBottom: 8,
	},
	detailDescription: {
		fontSize: 14,
		fontFamily: 'Inter-Regular',
		color: '#666666',
		marginBottom: 16,
	},
	voucherValueContainer: {
		marginBottom: 16,
	},
	voucherValueLabel: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#333333',
	},
	voucherValueText: {
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#333333',
	},
	validityContainer: {
		marginBottom: 16,
	},
	validityLabel: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#333333',
	},
	rulesTitle: {
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#333333',
		marginBottom: 8,
	},
	expandButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	expandButtonText: {
		fontSize: 14,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
		marginRight: 4,
	},
	rulesDisplay: {
		marginBottom: 16,
	},
	modalFooter: {
		marginTop: 16,
	},
	applyButton: {
		width: '100%',
		paddingVertical: 12,
		borderRadius: 8,
	},
})
