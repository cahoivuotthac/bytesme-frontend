import React, { createContext, useState, useEffect, useMemo } from 'react'
import { Stack } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CartItem } from '@/app/(home)/(profile)/cart'
import { useAlert } from '@/hooks/useAlert'

// Interface for voucher data
export interface VoucherRule {
	voucher_rule_id: number
	voucher_rule_type: string
	voucher_rule_value: string
}

export interface Voucher {
	voucher_id: number
	voucher_code: string
	voucher_name: string
	voucher_description: string
	voucher_fields: string
	voucher_start_date: string
	voucher_end_date: string
	voucher_type: string
	voucher_value: number
	voucher_rules?: VoucherRule[]
	is_applicable: boolean
	discount_value: number

	isSelected?: boolean
	isAvailable?: boolean
}

// Create the context with proper typing
interface CheckoutContextType {
	checkoutItems: CartItem[]
	setCheckoutItems: React.Dispatch<React.SetStateAction<CartItem[]>>
	subtotal: number
	deliveryFee: number
	setDeliveryFee: React.Dispatch<React.SetStateAction<number>>
	vouchers: Voucher[]
	setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>
	setDiscount: React.Dispatch<React.SetStateAction<number>>
	total: number
	setTotal: React.Dispatch<React.SetStateAction<number>>
	selectedVoucher: Voucher | null
	setSelectedVoucher: React.Dispatch<React.SetStateAction<Voucher | null>>
	appliedVoucher: Voucher | null
	setAppliedVoucher: React.Dispatch<React.SetStateAction<Voucher | null>>
	isLoadingVouchers: boolean
	setIsLoadingVouchers: React.Dispatch<React.SetStateAction<boolean>>
	calculateDiscountValue: (voucher: Partial<Voucher>) => number
	isVoucherApplicable: (voucher: Partial<Voucher>) => boolean
}

export const CheckoutContext = createContext<CheckoutContextType>({
	checkoutItems: [],
	setCheckoutItems: () => {},
	subtotal: 0,
	deliveryFee: 20000,
	setDeliveryFee: () => {},
	vouchers: [],
	setVouchers: () => {},
	setDiscount: () => {},
	total: 0,
	setTotal: () => {},
	selectedVoucher: null,
	setSelectedVoucher: () => {},
	appliedVoucher: null,
	setAppliedVoucher: () => {},
	isLoadingVouchers: false,
	setIsLoadingVouchers: () => {},
	calculateDiscountValue: () => 0,
	isVoucherApplicable: () => false,
})

export default function CheckoutLayout() {
	const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([])
	const [deliveryFee, setDeliveryFee] = useState(20000)
	const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
	const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null)
	const [vouchers, setVouchers] = useState<Voucher[]>([])
	const [isLoadingVouchers, setIsLoadingVouchers] = useState(false)
	const { showError } = useAlert()

	// Calculate subtotal from checkout items
	const subtotal = useMemo(() => {
		return checkoutItems.reduce((total, item) => {
			const price = item.prices[item.selectedSizeIndex]
			const quantity = item.quantity
			return total + price * quantity
		}, 0)
	}, [checkoutItems])

	// Calculate total from subtotal, delivery fee, and discount
	const total = useMemo(() => {
		return subtotal + deliveryFee - (appliedVoucher?.discount_value || 0)
	}, [subtotal, deliveryFee, appliedVoucher])

	// Fetch checkout items from AsyncStorage
	useEffect(() => {
		const fetchCheckoutItems = async () => {
			try {
				const data = await AsyncStorage.getItem('checkoutItems')
				if (data) {
					const items = JSON.parse(data)
					if (items && items.length > 0) {
						setCheckoutItems(items)
					}
				}
			} catch (error) {
				console.error('Error fetching checkout items:', error)
				showError('Could not load checkout items')
			}
		}

		fetchCheckoutItems()
	}, [])

	/**-------------------------------- Calculate voucher discout value ------------------------------------------- */
	const calculateDiscountValue = (voucher: Partial<Voucher>) => {
		let discountValue = 0

		switch (voucher.voucher_fields) {
			case 'birthday_gift':
				if (voucher.voucher_type === 'cash') {
					discountValue = Number(voucher.voucher_value)
				} else if (voucher.voucher_type === 'percentage') {
					discountValue = (Number(voucher.voucher_value) * subtotal) / 100
				}
				break

			case 'freeship':
				if (voucher.voucher_type === 'cash') {
					discountValue = Number(voucher.voucher_value)
				} else if (voucher.voucher_type === 'percentage') {
					discountValue = (Number(voucher.voucher_value) * deliveryFee) / 100
				}
				break

			case 'loyal_customer':
				if (voucher.voucher_type === 'cash') {
					discountValue = Number(voucher.voucher_value)
				}
				if (voucher.voucher_type === 'percentage') {
					discountValue = (Number(voucher.voucher_value) * subtotal) / 100
				}
				break

			default:
				if (voucher.voucher_type === 'cash') {
					discountValue = Number(voucher.voucher_value)
				}
				if (voucher.voucher_type === 'percentage') {
					discountValue = (Number(voucher.voucher_value) * subtotal) / 100
				}
				break
		}

		const maxDiscountRule = voucher.voucher_rules?.find(
			(rule) => rule.voucher_rule_type === 'max_discount'
		)
		if (maxDiscountRule) {
			discountValue = Math.min(
				discountValue,
				Number(maxDiscountRule.voucher_rule_value)
			)
		}

		return discountValue
	}

	/**-------------------------------- Check if a voucher is applicable based on the rules ------------------------------------------- */
	const isVoucherApplicable = (voucher: Partial<Voucher>) => {
		const minRule = voucher.voucher_rules?.find(
			(rule) => rule.voucher_rule_type === 'min_bill_price'
		)
		const minAmount = minRule ? parseInt(minRule.voucher_rule_value) : 0
		if (subtotal < minAmount) {
			return false
		}

		return true
	}

	const contextValue = {
		checkoutItems,
		setCheckoutItems,
		subtotal,
		deliveryFee,
		setDeliveryFee,
		total,
		setTotal: (newTotal: number) => {}, // This is a computed value, so the setter is a no-op
		selectedVoucher,
		setSelectedVoucher,
		appliedVoucher,
		setAppliedVoucher,
		vouchers,
		setVouchers,
		isLoadingVouchers,
		setIsLoadingVouchers,
		calculateDiscountValue,
		isVoucherApplicable,
	}

	return (
		<CheckoutContext.Provider value={contextValue}>
			<Stack screenOptions={{ headerShown: false }}>
				{/* Main checkout screens */}
				<Stack.Screen name="order/checkout" />
				<Stack.Screen name="order/voucher" />
			</Stack>
		</CheckoutContext.Provider>
	)
}
