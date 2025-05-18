import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@/providers/locale'

// Type for voucher rule
interface VoucherRule {
	voucher_rule_id: number
	voucher_rule_type: string
	voucher_rule_value: string
	is_fulfilled?: boolean // Whether the rule is fulfilled by the current order
	message?: string // Human-readable message about the rule
}

interface VoucherRuleDisplayProps {
	/**
	 * Array of voucher rules to display
	 */
	rules?: VoucherRule[]

	/**
	 * Whether to show all rules or just a summary
	 */
	isExpanded?: boolean

	/**
	 * Optional custom styles for the container
	 */
	style?: object

	/**
	 * Maximum number of rules to show in collapsed mode
	 */
	maxRulesCollapsed?: number
}

/**
 * Component to display voucher rules in a user-friendly format
 */
const VoucherRuleDisplay: React.FC<VoucherRuleDisplayProps> = ({
	rules = [],
	isExpanded = false,
	style,
	maxRulesCollapsed = 2,
}) => {
	const { t } = useTranslation()

	if (!rules || rules.length === 0) {
		return null
	}

	// Map rule types to appropriate icons
	const getRuleIcon = (ruleType: string): string => {
		const icons: Record<string, string> = {
			min_bill_price: 'cart',
			max_discount: 'cash',
			remaining_quantity: 'hourglass',
			category_id: 'list',
			product_id: 'pricetags',
			max_distance: 'bicycle',
			first_order: 'star',
			expiry: 'calendar',
		}

		return icons[ruleType] || 'information-circle'
	}

	// Map rule types to appropriate text colors
	const getRuleColor = (rule: VoucherRule): string => {
		// If the rule has explicit fulfillment status
		if (rule.is_fulfilled === true) return '#37B948' // Green for fulfilled
		if (rule.is_fulfilled === false) return '#FF6B6B' // Red for unfulfilled

		// Default colors by rule type
		const colors: Record<string, string> = {
			min_bill_price: '#686868',
			max_discount: '#686868',
			expiry: '#FF9800',
			remaining_quantity: '#FF6B6B',
			max_distance: '#686868',
		}

		return colors[rule.voucher_rule_type] || '#686868'
	}

	// Generate user-friendly rule message
	const getRuleMessage = (rule: VoucherRule): string => {
		// If backend has supplied a message, use it
		if (rule.message) {
			return rule.message
		}

		console.log('rule', rule)

		// Otherwise generate based on rule type
		switch (rule.voucher_rule_type) {
			case 'min_bill_price':
				return t('minimumOrderValue').replace(
					'{value}',
					parseInt(rule.voucher_rule_value).toLocaleString('vi-VN') + 'đ'
				)

			case 'max_discount':
				return t('maximumDiscount').replace(
					'{value}',
					parseInt(rule.voucher_rule_value).toLocaleString('vi-VN') + 'đ'
				)

			case 'category_id':
				return t('specificCategories')

			case 'product_id':
				return t('specificProducts')

			case 'max_distance':
				return t('deliveryDistanceLimit')

			case 'min_items':
				return t('minimumItems').replace(
					'{count}',
					parseInt(rule.voucher_rule_value).toString()
				)

			case 'remaining_quantity':
				const quantity = parseInt(rule.voucher_rule_value)
				return quantity <= 10
					? t('onlyLeft').replace('{count}', quantity.toString())
					: t('limitedQuantity')

			case 'first_order':
				return t('firstOrderOnly')

			default:
				return rule.voucher_rule_value
		}
	}

	// Display rules based on expanded state
	const rulesToShow = useMemo(() => {
		return isExpanded ? rules : rules.slice(0, maxRulesCollapsed)
	}, [rules, isExpanded, maxRulesCollapsed])
	const hasMoreRules = useMemo(() => {
		return !isExpanded && rules.length > maxRulesCollapsed
	}, [rules, isExpanded, maxRulesCollapsed])

	return (
		<View style={[styles.container, style]}>
			{/* Displayed rules */}
			{rulesToShow.map((rule, index) => (
				<View key={rule.voucher_rule_id || index} style={styles.ruleItem}>
					<Ionicons
						name={getRuleIcon(rule.voucher_rule_type)}
						size={12}
						color={getRuleColor(rule)}
						style={styles.ruleIcon}
					/>
					<Text style={[styles.ruleText, { color: getRuleColor(rule) }]}>
						{getRuleMessage(rule)}
					</Text>
				</View>
			))}

			{/* "And more rules" indicator */}
			{hasMoreRules && (
				<View style={styles.ruleItem}>
					<Ionicons
						name="ellipsis-horizontal"
						size={12}
						color="#686868"
						style={styles.ruleIcon}
					/>
					<Text style={styles.ruleText}>
						{t('andMoreRules', { count: rules.length - maxRulesCollapsed })}
					</Text>
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		marginVertical: 4,
	},
	ruleItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 2,
	},
	ruleIcon: {
		marginRight: 4,
	},
	ruleText: {
		fontSize: 11,
		fontFamily: 'Inter-Regular',
		color: '#686868',
		flex: 1,
	},
})

export default VoucherRuleDisplay
