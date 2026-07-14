import { useWindowDimensions } from 'react-native';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isPhone = width < 768;

  return { isTablet, isPhone, width, height };
}
