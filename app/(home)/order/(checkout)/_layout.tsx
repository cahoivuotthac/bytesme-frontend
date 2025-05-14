import React, { createContext, useState, useEffect, useMemo } from 'react'
import { Stack } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CartItem } from '@/app/(home)/(profile)/cart'
import { useAlert } from '@/hooks/useAlert'

// Interface for voucher data
interface VoucherRule {
  voucher_rule_id: number
  voucher_rule_type: string
  voucher_rule_value: string
}

export interface Voucher {
  voucher_id: number
  voucher_name: string
  voucher_description: string
  voucher_fields: string
  voucher_start_date: string
  voucher_end_date: string
  voucher_type: string
  voucher_value: number
  voucher_rules?: VoucherRule[]
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
  discount: number
  setDiscount: React.Dispatch<React.SetStateAction<number>>
  total: number
  setTotal: React.Dispatch<React.SetStateAction<number>>
  selectedVoucher: Voucher | null
  setSelectedVoucher: React.Dispatch<React.SetStateAction<Voucher | null>>
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
})

export function CheckoutLayout() {
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([])
  const [deliveryFee, setDeliveryFee] = useState(20000)
  const [discount, setDiscount] = useState(0)
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
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
    return subtotal + deliveryFee - discount
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

  // Load selected voucher from AsyncStorage
  useEffect(() => {
    const loadSelectedVoucher = async () => {
      try {
        const voucherData = await AsyncStorage.getItem('selectedVoucher')
        if (voucherData) {
          const voucher = JSON.parse(voucherData)
          setSelectedVoucher(voucher)
          
          // Calculate discount based on voucher
          calculateDiscountFromVoucher(voucher, subtotal)
        }
      } catch (error) {
        console.error('Error loading selected voucher:', error)
      }
    }
    
    loadSelectedVoucher()
  }, [subtotal])

  // Calculate discount based on voucher type and rules
  const calculateDiscountFromVoucher = (voucher: Voucher, subtotalAmount: number) => {
    if (!voucher) return

    // Check if order meets minimum requirements
    const minRule = voucher.voucher_rules?.find(
      (rule) => rule.voucher_rule_type === 'min_bill_price'
    )
    const minAmount = minRule ? parseInt(minRule.voucher_rule_value) : 0

    if (subtotalAmount < minAmount) {
      // Not eligible for this voucher
      setDiscount(0)
      return
    }

    let discountAmount = 0

    // Calculate discount based on voucher type
    if (voucher.voucher_type === 'percent') {
      discountAmount = Math.min(
        (subtotalAmount * voucher.voucher_value) / 100,
        100000
      ) // Max 100K for percent discounts
    } else if (voucher.voucher_type === 'fixed' || voucher.voucher_type === 'cash') {
      discountAmount = voucher.voucher_value
    } else if (voucher.voucher_fields === 'freeship') {
      discountAmount = deliveryFee
      setDeliveryFee(0)
    }

    setDiscount(discountAmount)
  }

  const contextValue = {
    checkoutItems,
    setCheckoutItems,
    subtotal,
    deliveryFee,
    setDeliveryFee,
    discount,
    setDiscount,
    total,
    setTotal: (newTotal: number) => {}, // This is a computed value, so the setter is a no-op
    selectedVoucher,
    setSelectedVoucher,
  }

  return (
    <CheckoutContext.Provider value={contextValue}>
      <Stack screenOptions={{ headerShown: false }} />
    </CheckoutContext.Provider>
  )
}