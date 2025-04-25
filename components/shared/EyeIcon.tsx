import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { SimpleLineIcons } from '@expo/vector-icons';

interface EyeIconProps {
  /**
   * Whether the password is currently visible
   */
  isVisible: boolean;
  
  /**
   * Function to toggle password visibility
   */
  onToggle: () => void;
  
  /**
   * Size of the icon
   * @default 22
   */
  size?: number;
}

/**
 * A reusable eye icon component for toggling password visibility
 */
export default function EyeIcon({
  isVisible,
  onToggle,
  size = 22,
}: EyeIconProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <SimpleLineIcons
        name={isVisible ? "eye" : "eye"} // SimpleLineIcons doesn't have eye-slash, so using opacity to differentiate
        size={size}
        color="#7C7C7C"
        style={{ opacity: isVisible ? 0.5 : 1 }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
});