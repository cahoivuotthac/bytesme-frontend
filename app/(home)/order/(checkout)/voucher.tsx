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
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from '@/providers/locale'
import NavButton from '@/components/shared/NavButton'
import ZigzagBorder from '@/components/shared/ZigzagBorder'
import { useAlert } from '@/hooks/useAlert'
import { CheckoutContext, Voucher } from './_layout'
import Button from '@/components/ui/Button'

import { MOCK_VOUCHERS } from './checkout'

// Helper function to format date
const formatDate = (dateString: string) => {
	const date = new Date(dateString)
	return date.toLocaleDateString('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	})
}

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
	isApplicable: boolean
	isBestChoice: boolean
	onSelect: (voucher: Voucher) => void
}

const VoucherItem = ({
	voucher,
	isSelected,
	isBestChoice,
	isApplicable = true,
	onSelect,
}: VoucherItemProps) => {
	const { t } = useTranslation()
	const cardRef = useRef(null)
	const [cardHeight, setCardHeight] = useState(0)
	const expiryDate = formatDate(voucher.voucher_end_date)
	const colors = getVoucherColors(voucher.voucher_fields)

	// Add opacity to non-applicable vouchers
	const notApplicableStyle = !isApplicable ? { opacity: 0.1 } : {}

	return (
		<View
			style={[styles.voucherCardWrapper, notApplicableStyle]}
			ref={cardRef}
			onLayout={(event) => {
				const { height } = event.nativeEvent.layout
				setCardHeight(height)
			}}
		>
			{/* Floating bottom decoration layers */}
			<View style={[styles.floatingLayer1, { backgroundColor: '#E5E5E5' }]} />
			<View style={[styles.floatingLayer2, { backgroundColor: '#F0F0F0' }]} />

			{/* Main card */}
			<TouchableOpacity
				style={[
					styles.voucherCard,
					{ backgroundColor: isSelected ? colors.lightBg : '#FFFFFF' },
				]}
				onPress={() => onSelect(voucher)}
				activeOpacity={0.8}
				disabled={!isApplicable}
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
								color="#FB6D3A"
								position="right"
							/>
						</View>
					)}
				</View>

				{/* Dashed line separator - now at the left side of right card */}
				<View style={styles.dashedLine}>
					{Array.from({ length: Math.ceil(cardHeight / 6) }).map((_, index) => (
						<View key={index} style={styles.dashLine} />
					))}
				</View>

				{/* Right side with details */}
				<View style={styles.voucherRight}>
					<View style={styles.voucherDetails}>
						<Text style={styles.voucherDescription}>
							{voucher.voucher_description}
						</Text>
						<Text
							style={[styles.voucherMinimum, { color: colors.highlightText }]}
						>
							Đơn tối thiểu{' '}
							{parseInt(
								voucher.voucher_rules?.[0]?.voucher_rule_value || '300000'
							).toLocaleString('vi-VN')}
							đ
						</Text>
						{!isApplicable && (
							<Text
								style={{
									color: '#FF6B6B',
									fontSize: 12,
									fontFamily: 'Inter-Medium',
									marginTop: 2,
								}}
							>
								Không đủ điều kiện áp dụng
							</Text>
						)}
						{voucher.voucher_end_date && (
							<Text style={styles.voucherExpiry}>
								{t('validUntil')} {expiryDate}
							</Text>
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
				</View>

				{/* Best choice badge */}
				{isBestChoice && voucher.isApplicable && (
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
							style={[styles.selectedText, { color: colors.highlightText }]}
						>
							Đã chọn
						</Text>
					</View>
				)}
			</TouchableOpacity>
		</View>
	)
}

export default function VoucherPage() {
	const { t } = useTranslation()
	const { AlertComponent, showInfo } = useAlert()

	// Get checkout context data
	const {
		setIsLoadingVouchers,
		subtotal,
		selectedVoucher,
		setSelectedVoucher,
		setAppliedVoucher,
		vouchers,
		setVouchers,
		isLoadingVouchers,
		calculateDiscountValue,
		isVoucherApplicable,
	} = useContext(CheckoutContext)

	console.log("subtotal in voucher page: ", subtotal)

	// Local state
	const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(
		selectedVoucher?.voucher_id || null
	)
	const [sortedVouchers, setSortedVouchers] = useState<Voucher[]>([])

	// Fetch vouchers on mount
	useEffect(() => {
		/**-------------------------------- Fetch vouchers on mount ------------------------------------------- */
		const fetchAllVouchers = async () => {
			setIsLoadingVouchers(true)
			try {
				// In a real app, fetch from API
				// const response = await fetch('/api/vouchers')
				// const data = await response.json()

				// Using mock data for now
				setTimeout(() => {
					// Mark the currently selected voucher
					const updatedVouchers = MOCK_VOUCHERS.map((voucher) => ({
						...voucher,
						isSelected: voucher.voucher_id === selectedVoucher?.voucher_id,
						discount_value: calculateDiscountValue(voucher),
						isApplicable: isVoucherApplicable(voucher),
					})) as Voucher[]

					console.log('MOCK VOUCHERS: ', MOCK_VOUCHERS)

					setVouchers(updatedVouchers)
					setIsLoadingVouchers(false)
				}, 800)
			} catch (error) {
				console.error('Error fetching vouchers:', error)
				setIsLoadingVouchers(false)
			}
		}

		fetchAllVouchers()
	}, [])

	// Sort vouchers based on applicability and discount value
	useEffect(() => {
		if (!vouchers || vouchers.length === 0) return

		console.log('DEBUG: vouchers changed, now sorting')

		// Create a copy before sorting to avoid mutation
		const vouchersCopy = [...vouchers]
		const sorted = vouchersCopy.sort((a, b) => {
			if (a.isApplicable && !b.isApplicable) return -1
			if (!a.isApplicable && b.isApplicable) return 1
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

	// Select voucher handler
	const selectVoucher = (voucher: Voucher) => {
		if (!voucher.isApplicable) {
			showInfo('Voucher này không khả dụng cho đơn hàng của bạn')
			return
		}

		// Check if selecting the same voucher (toggle selection)
		if (selectedVoucherId === voucher.voucher_id) {
			// Deselect
			setSelectedVoucher(null)
			setSelectedVoucherId(null)

			console.log('MOCK VOUCHERS: ', MOCK_VOUCHERS)

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
	const handleApplyVoucher = () => {
		if (!selectedVoucherId) {
			showInfo(t('noVoucherSelected'))
			return
		} else {
			// const appliedVoucher = vouchers.find((v) => v.voucher_id === selected)
			setAppliedVoucher(selectedVoucher)
			router.back()
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
								onSelect={selectVoucher}
								isApplicable={voucher.isApplicable}
								isBestChoice={index === 0}
							/>
						))}

						<View style={styles.showMoreContainer}>
							<TouchableOpacity
								style={styles.showMoreButton}
								onPress={() => showInfo('Đang tải thêm voucher...')}
							>
								<Text style={styles.showMoreText}>{t('xemThem')}</Text>
								<Ionicons name="chevron-down" size={16} color="#C67C4E" />
							</TouchableOpacity>
						</View>

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

					{/* Apply Voucher Button*/}
					<View style={styles.buttonContainer}>
						<Button
							text={t('applyVoucher')}
							onPress={handleApplyVoucher}
							disabled={selectedVoucherId == null}
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
	},
	voucherLeft: {
		width: 110,
		padding: 12,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 16,
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
	},
	voucherDetails: {
		flex: 1,
	},
	voucherDescription: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#383838',
		marginBottom: 8,
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
		marginTop: 2,
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
		bottom: 0,
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
})
