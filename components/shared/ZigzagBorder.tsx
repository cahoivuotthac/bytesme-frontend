import React from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface ZigzagBorderProps {
	height: number
	width?: number
	backgroundColor?: string
	color?: string
	position?: 'left' | 'right'
	zigzagWidth?: number
	zigzagHeight?: number
}

/**
 * A component that renders a zigzag border, commonly used for coupons or vouchers
 */
export default function ZigzagBorder({
	height,
	width = 10,
	backgroundColor = 'transparent',
	color = '#FFFFFF',
	position = 'left',
	zigzagWidth = 10,
	zigzagHeight = 8,
}: ZigzagBorderProps) {
	// Calculate number of zigzags based on height
	const numberOfSegments = Math.ceil(height / zigzagHeight);

	// Create a continuous path for zigzag
	let pathData = '';
	
	// Start path at the top
	if (position === 'left') {
		pathData = `M${width},0 `;
	} else {
		pathData = `M0,0 `;
	}

	// Create zigzags
	for (let i = 0; i < numberOfSegments; i++) {
		const y = i * zigzagHeight;
		if (position === 'left') {
			// Left position: zigzag goes from right to left
			pathData += `L0,${y + zigzagHeight / 2} L${width},${y + zigzagHeight} `;
		} else {
			// Right position: zigzag goes from left to right
			pathData += `L${width},${y + zigzagHeight / 2} L0,${y + zigzagHeight} `;
		}
	}

	return (
		<View
			style={[
				styles.container,
				{ height, width, backgroundColor },
				position === 'right' ? styles.rightPosition : styles.leftPosition,
			]}
		>
			<Svg height={height} width={width} viewBox={`0 0 ${width} ${height}`}>
				<Path
					d={pathData}
					stroke={color}
					strokeWidth={1.5}
					fill="none"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</Svg>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		overflow: 'hidden',
		zIndex: 1,
	},
	leftPosition: {
		position: 'absolute',
		left: 0,
		top: 0,
	},
	rightPosition: {
		position: 'absolute',
		right: 0,
		top: 0,
	},
})
