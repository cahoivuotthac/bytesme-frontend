import React from 'react'
import {
	View,
	Image,
	StyleSheet,
	ImageSourcePropType,
	StyleProp,
	ViewStyle,
	ImageStyle,
} from 'react-native'

type ResizeMode = 'contain' | 'cover' | 'stretch' | 'center'

interface DishDecorationProps {
	/**
	 * Source for the dish image
	 */
	imageSource: ImageSourcePropType

	/**
	 * Size of the dish circle (width and height)
	 * @default 120
	 */
	size?: number

	/**
	 * Custom styles for the container
	 */
	containerStyle?: StyleProp<ViewStyle>

	/**
	 * Custom styles for the image
	 */
	imageStyle?: StyleProp<ImageStyle>

	/**
	 * How to resize the image
	 * @default 'contain'
	 */
	resizeMode?: ResizeMode
  
	/**
	 * If the image should be offset to appear better in the circle
	 * Use this for images that show food in a bowl
	 * @default true
	 */
	adjustForBowl?: boolean

	/**
	 * Percentage to scale the image, values > 1 will make the image larger
	 * @default 1.2
	 */
	imageScale?: number
}

/**
 * A round beige circle with a dish image and subtle drop shadow
 */
export default function DishDecoration({
	imageSource,
	size = 120,
	containerStyle,
	imageStyle,
	resizeMode = 'contain',
	adjustForBowl = true,
	imageScale = 1.2,
}: DishDecorationProps) {
	return (
		<View
			style={[
				styles.container,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
				},
				containerStyle,
			]}
		>
			<View style={styles.imageContainer}>
				<Image
					source={imageSource}
					style={[
						styles.image,
						{
							width: size * imageScale,
							height: size * imageScale,
							// For bowl images, we need to shift them up and make them larger
							// This ensures the bowl rim is properly positioned
							marginTop: adjustForBowl ? -size * 0.15 : 0,
							borderRadius: adjustForBowl ? 0 : size / 2,
						},
						imageStyle,
					]}
					resizeMode={resizeMode}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
		overflow: 'hidden',
	},
	imageContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		height: '100%',
		overflow: 'hidden',
	},
	image: {
		// Basic image styling, specifics applied in the component
	},
});
