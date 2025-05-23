import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	Image,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	Dimensions,
	Touchable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from '@/providers/locale'
import { router } from 'expo-router'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 48) / 2

interface PinterestProductCardProps {
	product: {
		productId: number
		name: string
		price: number // transform to this on back-end please
		imageUrl: string
		description?: string
		isFavorite?: boolean
	}
	onToggleFavorite?: (productId: number) => void
	onPress?: () => void
	style?: object
}

export default function PinterestProductCard({
	product,
	onToggleFavorite,
	onPress,
	style,
}: PinterestProductCardProps) {
	const { t } = useTranslation()
	const [imageHeight, setImageHeight] = useState(180)
	const [loading, setLoading] = useState(true)
	const randomDescription = [
		t('pinterestDesc_1'),
		t('pinterestDesc_2'),
		t('pinterestDesc_3'),
		t('pinterestDesc_4'),
		t('pinterestDesc_5'),
		t('pinterestDesc_6'),
		t('pinterestDesc_7'),
		t('pinterestDesc_8'),
		t('pinterestDesc_9'),
		t('pinterestDesc_10'),
		t('pinterestDesc_11'),
	]

	// Set defautl onPress behavirour if not provided
	if (!onPress) {
		onPress = async () => {
			router.push({
				pathname: '/(home)/product/[id]',
				params: { id: product.productId },
			})
		}
	}

	// For demo: pick a random description
	const desc =
		product.description ||
		randomDescription[product.productId % randomDescription.length]

	useEffect(() => {
		Image.getSize(
			product.imageUrl,
			(width, height) => {
				const ratio = height / width
				setImageHeight(Math.max(120, Math.min(240, CARD_WIDTH * ratio)))
				setLoading(false)
			},
			() => setLoading(false)
		)
	}, [product.imageUrl])

	return (
		<View style={[styles.card, style]}>
			<TouchableOpacity onPress={onPress}>
				<View style={styles.imageWrapper}>
					{loading ? (
						<ActivityIndicator
							size="small"
							color="#C67C4E"
							style={{ height: imageHeight }}
						/>
					) : (
						<Image
							source={{ uri: product.imageUrl }}
							style={[styles.image, { height: imageHeight }]}
							resizeMode="cover"
						/>
					)}
					<TouchableOpacity
						style={styles.favoriteButton}
						onPress={() =>
							onToggleFavorite && onToggleFavorite(product.productId)
						}
					>
						<Ionicons
							name={product.isFavorite ? 'heart' : 'heart-outline'}
							size={22}
							color={product.isFavorite ? '#C67C4E' : '#C67C4E'}
						/>
					</TouchableOpacity>
				</View>
				<View style={styles.infoContainer}>
					<Text style={styles.name} numberOfLines={2}>
						{product.name}
					</Text>
					<Text style={styles.price}>{product.price.toLocaleString()}₫</Text>
					<Text style={styles.desc} numberOfLines={3}>
						{desc}
					</Text>
				</View>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#FFF',
		borderRadius: 25,
		marginBottom: 16,
		shadowColor: '#896450',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
		paddingBottom: 10,
	},
	imageWrapper: {
		borderTopLeftRadius: 18,
		borderTopRightRadius: 18,
		overflow: 'hidden',
		position: 'relative',
	},
	image: {
		width: '100%',
		borderTopLeftRadius: 18,
		borderTopRightRadius: 18,
		backgroundColor: '#F8F1E9',
	},
	favoriteButton: {
		position: 'absolute',
		top: 10,
		right: 10,
		backgroundColor: '#FFF',
		borderRadius: 16,
		padding: 4,
		elevation: 2,
	},
	infoContainer: {
		paddingHorizontal: 12,
		paddingTop: 10,
	},
	name: {
		fontSize: 15,
		fontFamily: 'Inter-SemiBold',
		color: '#3D3D3D',
		marginBottom: 2,
	},
	price: {
		fontSize: 14,
		fontFamily: 'Inter-Bold',
		color: '#C67C4E',
		marginBottom: 4,
	},
	desc: {
		fontSize: 12,
		color: '#7C7C7C',
		fontFamily: 'Inter-Regular',
		marginTop: 2,
	},
})
