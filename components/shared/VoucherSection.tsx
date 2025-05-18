import React, { useState, useEffect, useRef } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	TextInput,
	ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from '@/providers/locale'
import { Voucher } from '@/app/(home)/order/(checkout)/_layout'
import { formatDate } from '@/utils/display'
import VoucherRuleDisplay from './VoucherRuleDisplay'
import Colors from '@/constants/Colors'

interface VoucherSectionProps {
	/**
	 * List of available vouchers
	 */
	vouchers: Voucher[]

	/**
	 * Currently selected voucher code (if any)
	 */
	appliedVoucherCode?: string

	/**
	 * Callback when a voucher is selected
	 */
	onSelectVoucher: (voucher: Voucher) => void

	/**
	 * Callback when a voucher code is manually entered and applied
	 */
	onApplyVoucherCode: (code: string) => void

	/**
	 * Whether the voucher application is loading
	 */
	isLoading?: boolean

	/**
	 * Title for the section
	 */
	title?: string

	/**
	 * Placeholder for the voucher input field
	 */
	inputPlaceholder?: string

	/**
	 * Optional custom styles
	 */
	style?: object

	/**
	 * Callback when user wants to browse vouchers
	 */
	onBrowseVouchers?: () => void

	/**
	 * Selected voucher from voucher page (if any)
	 */
	appliedVoucher?: any
}

const getVoucherColors = (voucher: Voucher) => {
	// Map voucher types to specific colors or return a default set
	const colors = {
		freeship: ['#F76F8E', '#FF9EB1'],
		new_customer: ['#7165E3', '#9C91F1'],
		birthday_gift: ['#FF9800', '#FFC107'],
		holiday: ['#FF5722', '#FF7043'],
		shop_related: ['#009688', '#4DB6AC'],
	}

	// Get colors based on voucher type or generate random colors
	const key = voucher.voucher_fields as keyof typeof colors
	if (key && key in colors) {
		return colors[key]
	} else {
		// Random colors if type not specified or not found
		const colorSets = [
			['#C67C4E', '#E8A87C'],
			['#5E8B7E', '#7EB09B'],
			['#9C89B8', '#B8A9D1'],
			['#F28482', '#F5A8A6'],
			['#3772FF', '#6A9CFF'],
		]

		// Use voucher ID to select a color set or pick a random one
		const index = voucher.voucher_id
			? Math.abs(voucher.voucher_id.toString().charCodeAt(0) % colorSets.length)
			: Math.floor(Math.random() * colorSets.length)

		return colorSets[index]
	}
}

const getVoucherIcon = (
	voucher: Voucher
): 'bicycle' | 'person-add' | 'gift' | 'snow' | 'cart' | 'cash-outline' => {
	// Map voucher types to specific icons
	const icons: Record<
		string,
		'bicycle' | 'person-add' | 'gift' | 'snow' | 'cart'
	> = {
		freeship: 'bicycle',
		new_customer: 'person-add',
		birthday_gift: 'gift',
		holiday: 'snow',
		shop_related: 'cart',
	}

	// Get icon based on voucher type or return a default icon
	const key = voucher.voucher_fields as keyof typeof icons
	if (key && key in icons) {
		return icons[key]
	} else {
		return 'cash-outline' // Default icon
	}
}

/**
 * A flexible component to display and select vouchers
 */
const VoucherSection: React.FC<VoucherSectionProps> = ({
	vouchers = [],
	appliedVoucherCode = '',
	onSelectVoucher,
	onApplyVoucherCode,
	isLoading = false,
	title,
	inputPlaceholder,
	style,
	onBrowseVouchers,
	appliedVoucher,
}) => {
	const { t, locale } = useTranslation()
	const [voucherCode, setVoucherCode] = useState(appliedVoucherCode)
	const [expandedVoucherId, setExpandedVoucherId] = useState<number | null>(
		null
	)
	const inputRef = useRef<TextInput>(null)

	// Update local state when selected voucher changes from parent
	useEffect(() => {
		// Only update if the voucher was selected from the list
		if (appliedVoucherCode && appliedVoucherCode !== voucherCode) {
			setVoucherCode(appliedVoucherCode)
		} else {
			setVoucherCode('')
		}
	}, [appliedVoucherCode])

	// Handle manual voucher code application
	const handleApplyVoucher = () => {
		if (voucherCode.trim() && !isLoading) {
			onApplyVoucherCode(voucherCode.trim())
		}
	}

	// Handle voucher selection from the list
	const handleSelectVoucher = (voucher: Voucher) => {
		setVoucherCode(voucher.voucher_code)
		onSelectVoucher(voucher)
	}

	// Handle text input change with a focus preservation approach
	const handleVoucherCodeChange = (text: string) => {
		setVoucherCode(text)
		// Ensure input keeps focus after state update
		setTimeout(() => {
			inputRef.current?.focus()
		}, 0)
	}

	// Navigate to voucher browse screen
	const handleBrowseVouchers = () => {
		if (onBrowseVouchers) {
			onBrowseVouchers()
		}
	}

	// Toggle expanded state for a voucher
	const toggleExpandVoucher = (voucherId: number) => {
		setExpandedVoucherId(expandedVoucherId === voucherId ? null : voucherId)
	}

	// If a voucher is selected from the voucher page, display it
	if (appliedVoucher) {
		return (
			<View style={[styles.section, style]}>
				<Text style={styles.sectionTitle}>{title || t('bytesmeVoucher')}</Text>

				<TouchableOpacity
					style={styles.selectedVoucherCard}
					onPress={handleBrowseVouchers}
					activeOpacity={0.8}
				>
					<View style={styles.selectedVoucherIconContainer}>
						<Ionicons name="pricetag" size={24} color="#FFFFFF" />
					</View>

					<View style={styles.selectedVoucherContent}>
						<Text
							style={styles.selectedVoucherName}
							numberOfLines={1}
							ellipsizeMode="tail"
						>
							{appliedVoucher.voucher_name}
						</Text>
						<Text
							style={styles.selectedVoucherDesc}
							numberOfLines={1}
							ellipsizeMode="tail"
						>
							{appliedVoucher.voucher_description}
						</Text>

						{/* Display voucher rules */}
						{appliedVoucher.voucher_rules &&
							appliedVoucher.voucher_rules.length > 0 && (
								<VoucherRuleDisplay
									rules={appliedVoucher.voucher_rules}
									style={styles.rulesList}
								/>
							)}
					</View>

					<View style={styles.selectedVoucherArrow}>
						<Ionicons name="chevron-forward" size={24} color="#C67C4E" />
					</View>
				</TouchableOpacity>
			</View>
		)
	}

	return (
		<View style={[styles.section, style]}>
			<Text style={styles.sectionTitle}>{title || t('bytesmeVoucher')}</Text>

			{/* Voucher Input Field */}
			<View style={styles.voucherContainer}>
				<View style={styles.voucherInputWrapper}>
					<View style={styles.voucherIconContainer}>
						<Ionicons name="pricetag" size={20} color="#FFFFFF" />
					</View>

					<TextInput
						ref={inputRef}
						style={styles.voucherInput}
						placeholder={inputPlaceholder || t('enterPromoCode')}
						placeholderTextColor="#B3B1B0"
						value={voucherCode}
						onChangeText={handleVoucherCodeChange}
						autoCapitalize="characters"
						autoCorrect={false}
					/>
				</View>

				<TouchableOpacity
					style={[
						styles.voucherButton,
						(!voucherCode.trim() || isLoading) && styles.voucherButtonDisabled,
					]}
					onPress={handleApplyVoucher}
					disabled={!voucherCode.trim() || isLoading}
				>
					{isLoading ? (
						<ActivityIndicator size="small" color="#FFFFFF" />
					) : (
						<Text style={styles.voucherButtonText}>{t('apply')}</Text>
					)}
				</TouchableOpacity>
			</View>

			{/* Available Vouchers */}
			{
				<View style={styles.availableVouchersContainer}>
					<View style={styles.availableHeaderContainer}>
						<Text style={styles.availableVouchersTitle}>
							{t('availableVouchers')}
						</Text>
						{onBrowseVouchers && (
							<TouchableOpacity onPress={handleBrowseVouchers}>
								<Text style={styles.moreVouchersText}>{t('moreVouchers')}</Text>
							</TouchableOpacity>
						)}
					</View>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.vouchersScrollContent}
					>
						{vouchers.map((voucher) => (
							<TouchableOpacity
								key={voucher.voucher_id}
								style={[
									styles.voucherCard,
									appliedVoucherCode === voucher.voucher_code &&
										styles.voucherCardSelected,
									!voucher.is_applicable && styles.voucherCardDisabled,
								]}
								onPress={() =>
									voucher.is_applicable && handleSelectVoucher(voucher)
								}
								activeOpacity={voucher.is_applicable ? 0.7 : 1}
							>
								<LinearGradient
									colors={getVoucherColors(voucher) || ['#C67C4E', '#A0643C']}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 1 }}
									style={styles.voucherCardGradient}
								>
									<View style={styles.voucherCardContent}>
										<View style={styles.voucherCardIcon}>
											<Ionicons
												name={getVoucherIcon(voucher)}
												size={20}
												color="#FFFFFF"
											/>
										</View>
										<View style={styles.voucherCardDetails}>
											<Text
												style={styles.voucherCardTitle}
												numberOfLines={1}
												ellipsizeMode="tail"
											>
												{voucher.voucher_name}
											</Text>
											<Text
												style={styles.voucherCardCode}
												numberOfLines={1}
												ellipsizeMode="tail"
											>
												{voucher.voucher_code}
											</Text>
											{/* Display expiry date */}
											<Text
												style={styles.voucherCardExpiry}
												numberOfLines={1}
												ellipsizeMode="tail"
											>
												{formatDate(voucher.voucher_end_date, locale)}
											</Text>

											{/* Selected indicator */}
											{appliedVoucherCode === voucher.voucher_code && (
												<View style={styles.selectedIndicator}>
													<Ionicons
														name="checkmark-circle"
														size={14}
														color="#FFFFFF"
													/>
												</View>
											)}
										</View>
									</View>

									{/* Show voucher rules when expanded */}
									{expandedVoucherId === voucher.voucher_id &&
										voucher.voucher_rules && (
											<View style={styles.expandedRulesContainer}>
												<VoucherRuleDisplay
													rules={voucher.voucher_rules}
													isExpanded={true}
												/>
											</View>
										)}

									{/* Toggle button to show more rules */}
									{voucher.voucher_rules &&
										voucher.voucher_rules.length > 0 && (
											<TouchableOpacity
												style={styles.toggleRulesButton}
												onPress={() => toggleExpandVoucher(voucher.voucher_id)}
											>
												<Text style={styles.toggleRulesText}>
													{expandedVoucherId === voucher.voucher_id
														? t('showLess')
														: t('viewAllConditions')}
												</Text>
												<Ionicons
													name={
														expandedVoucherId === voucher.voucher_id
															? 'chevron-up'
															: 'chevron-down'
													}
													size={14}
													color="#FFFFFF"
												/>
											</TouchableOpacity>
										)}
								</LinearGradient>

								{/* Disabled overlay for invalid vouchers */}
								{!voucher.is_applicable && (
									<View style={styles.disabledOverlay}>
										<Text style={styles.disabledText}>{t('notAvailable')}</Text>
									</View>
								)}
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>
			}
		</View>
	)
}

const styles = StyleSheet.create({
	section: {
		marginHorizontal: 20,
		marginTop: 16,
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	sectionTitle: {
		fontSize: 16,
		fontFamily: 'Inter-SemiBold',
		color: '#474747',
		textAlign: 'center',
		marginBottom: 16,
	},
	voucherContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
	},
	voucherInputWrapper: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		height: 50,
	},
	voucherIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: Colors.light.buttonPrimary,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		left: 5,
		zIndex: 1,
	},
	voucherInput: {
		flex: 1,
		height: 50,
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 20,
		borderBottomLeftRadius: 20,
		borderStyle: 'dashed',
		paddingLeft: 55,
		paddingRight: 10,
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		textTransform: 'uppercase',
		color: '#474747',
		borderWidth: 0.5,
		borderColor: '#EEEEEE',
	},
	voucherButton: {
		width: 80,
		height: 50,
		backgroundColor: '#FF9EB1',
		borderTopRightRadius: 20,
		borderBottomRightRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: -12,
	},
	voucherButtonDisabled: {
		backgroundColor: '#CCCCCC',
	},
	voucherButtonText: {
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#FFFFFF',
	},
	availableVouchersContainer: {
		marginTop: 16,
	},
	availableHeaderContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	availableVouchersTitle: {
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#474747',
	},
	moreVouchersText: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: '#C67C4E',
	},
	vouchersScrollContent: {
		paddingRight: 20,
		paddingBottom: 8,
	},
	voucherCard: {
		width: 220,
		borderRadius: 16,
		overflow: 'hidden',
		marginRight: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		position: 'relative',
	},
	voucherCardSelected: {
		borderWidth: 2,
		borderColor: '#C67C4E',
	},
	voucherCardDisabled: {
		opacity: 0.7,
	},
	voucherCardGradient: {
		padding: 12,
	},
	voucherCardContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	voucherCardIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.3)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	voucherCardDetails: {
		flex: 1,
		overflow: 'hidden',
	},
	voucherCardTitle: {
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#FFFFFF',
		marginBottom: 4,
	},
	voucherCardCode: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: '#FFFFFF',
		marginTop: 2,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		alignSelf: 'flex-start',
		maxWidth: '100%',
	},
	voucherCardExpiry: {
		fontSize: 10,
		fontFamily: 'Inter-Regular',
		color: 'rgba(255, 255, 255, 0.8)',
		marginTop: 4,
	},
	expandedRulesContainer: {
		marginTop: 12,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255, 255, 255, 0.3)',
	},
	toggleRulesButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 8,
		paddingVertical: 4,
	},
	toggleRulesText: {
		fontSize: 12,
		fontFamily: 'Inter-Medium',
		color: '#FFFFFF',
		marginRight: 4,
	},
	selectedIndicator: {
		position: 'absolute',
		top: 0,
		right: 0,
		backgroundColor: '#37B948',
		width: 20,
		height: 20,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	disabledOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	disabledText: {
		color: '#FFFFFF',
		fontFamily: 'Inter-Medium',
		fontSize: 12,
	},
	selectedVoucherCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		backgroundColor: 'rgba(198, 124, 78, 0.1)',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: 'rgba(198, 124, 78, 0.3)',
	},
	selectedVoucherIconContainer: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#C67C4E',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	selectedVoucherContent: {
		flex: 1,
		paddingRight: 8,
		overflow: 'hidden',
	},
	selectedVoucherName: {
		fontSize: 14,
		fontFamily: 'Inter-SemiBold',
		color: '#383838',
		marginBottom: 4,
	},
	selectedVoucherDesc: {
		fontSize: 12,
		fontFamily: 'Inter-Regular',
		color: '#686868',
		numberOfLines: 1,
		ellipsizeMode: 'tail',
	},
	selectedVoucherArrow: {
		width: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	rulesList: {
		marginTop: 4,
	},
})

export default VoucherSection
