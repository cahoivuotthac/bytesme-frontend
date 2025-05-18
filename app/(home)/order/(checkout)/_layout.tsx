import React, { createContext, useState, useEffect, useMemo } from 'react'
import { Stack } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CartItem } from '@/app/(home)/(profile)/cart'
import { useAlert } from '@/hooks/useAlert'

// Interface for voucher rule
export interface VoucherRule {
	voucher_rule_id: number
	voucher_rule_type: string
	voucher_rule_value: string
	is_fulfilled?: boolean // Whether the rule is fulfilled by the current order (set by backend)
	message?: string // Human-readable message about the rule (set by backend)
}

// Interface for voucher data with additional fields for UI state
export interface Voucher {
	voucher_id: number
	voucher_code: string
	voucher_name: string
	voucher_description: string
	voucher_fields: string // e.g. 'freeship', 'birthday_gift', etc.
	voucher_start_date: string
	voucher_end_date: string
	voucher_type: string // 'cash', 'percentage', etc.
	voucher_value: string
	voucher_rules?: VoucherRule[]
	isSelected?: boolean
	isAvailable?: boolean
	is_applicable: boolean // Whether all rules are fulfilled (set by backend)
	discount_value: number // Calculated discount value (set by backend)
}

// Create the context with proper typing
interface CheckoutContextType {
	checkoutItems: CartItem[]
	setCheckoutItems: React.Dispatch<React.SetStateAction<CartItem[]>>
	subtotal: number
	deliveryFee: number
	setDeliveryFee: React.Dispatch<React.SetStateAction<number>>
	discount: number
	setDiscount: React.Dispatch<React.SetStateAction<number>>
	total: number
	setTotal: React.Dispatch<React.SetStateAction<number>>
	selectedVoucher: Voucher | null
	setSelectedVoucher: React.Dispatch<React.SetStateAction<Voucher | null>>
	appliedVoucher: Voucher | null
	setAppliedVoucher: React.Dispatch<React.SetStateAction<Voucher | null>>
	vouchers: Voucher[]
	setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>
	isLoadingVouchers: boolean
	setIsLoadingVouchers: React.Dispatch<React.SetStateAction<boolean>>
}

export const CheckoutContext = createContext<CheckoutContextType>({
	checkoutItems: [],
	setCheckoutItems: () => {},
	subtotal: 0,
	deliveryFee: 20000,
	setDeliveryFee: () => {},
	discount: 0,
	setDiscount: () => {},
	total: 0,
	setTotal: () => {},
	selectedVoucher: null,
	setSelectedVoucher: () => {},
	appliedVoucher: null,
	setAppliedVoucher: () => {},
	vouchers: [],
	setVouchers: () => {},
	isLoadingVouchers: false,
	setIsLoadingVouchers: () => {},
})

export default function CheckoutLayout() {
	const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([])
	const [deliveryFee, setDeliveryFee] = useState(20000)
	const [discount, setDiscount] = useState(0)
	const [total, setTotal] = useState(0)
	const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
	const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null)
	const [vouchers, setVouchers] = useState<Voucher[]>([])
	const [isLoadingVouchers, setIsLoadingVouchers] = useState(false)
	const { showError } = useAlert()

	// Calculate subtotal from checkout items
	const subtotal = useMemo(() => {
		if (!checkoutItems || checkoutItems.length === 0) return 0

		return checkoutItems.reduce((total, item) => {
			const unitPrice = Math.round(
				(item.prices[item.selectedSizeIndex] *
					(100 - item.discountPercentage)) /
					100
			)
			const quantity = item.quantity
			return total + unitPrice * quantity
		}, 0)
	}, [checkoutItems])

	// Update total when dependencies change
	useEffect(() => {
		const newTotal = subtotal + deliveryFee - discount
		setTotal(newTotal)
	}, [subtotal, deliveryFee, discount])

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

	// Update discount when applied voucher changes
	useEffect(() => {
		if (appliedVoucher) {
			console.log('Applied voucher changed:', appliedVoucher)

			// Use discount value calculated by the backend
			if (appliedVoucher.discount_value) {
				setDiscount(appliedVoucher.discount_value)
			}

			// Save to AsyncStorage for persistence
			// try {
			// 	AsyncStorage.setItem('appliedVoucher', JSON.stringify(appliedVoucher))
			// } catch (error) {
			// 	console.error('Error saving voucher:', error)
			// }
		} else {
			setDiscount(0)
		}
	}, [appliedVoucher])

	const contextValue = {
		checkoutItems,
		setCheckoutItems,
		subtotal,
		deliveryFee,
		setDeliveryFee,
		discount,
		setDiscount,
		total,
		setTotal,
		selectedVoucher,
		setSelectedVoucher,
		appliedVoucher,
		setAppliedVoucher,
		vouchers,
		setVouchers,
		isLoadingVouchers,
		setIsLoadingVouchers,
	}

	return (
		<CheckoutContext.Provider value={contextValue}>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="/order/(checkout)/checkout" />
				<Stack.Screen name="/order/(checkout)/voucher" />
				<Stack.Screen name="/input-address" />
			</Stack>
		</CheckoutContext.Provider>
	)
}
