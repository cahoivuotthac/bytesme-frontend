import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType, StyleProp, ViewStyle, ImageStyle } from 'react-native';

interface DishDecorationProps {
  /**
   * Source for the dish image
   */
  imageSource: ImageSourcePropType;
  
  /**
   * Size of the dish circle (width and height)
   * @default 120
   */
  size?: number;
  
  /**
   * Custom styles for the container
   */
  containerStyle?: StyleProp<ViewStyle>;
  
  /**
   * Custom styles for the image
   */
  imageStyle?: StyleProp<ImageStyle>;
}

/**
 * A round beige circle with a dish image and subtle drop shadow
 */
export default function DishDecoration({
  imageSource,
  size = 120,
  containerStyle,
  imageStyle,
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
      <Image
        source={imageSource}
        style={[
          styles.image,
          imageStyle
        ]}
        resizeMode="cover"
      />
    </View>
  );
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
  image: {
    width: '100%',
    height: '100%',
  },
});