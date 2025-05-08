import { Platform } from 'react-native';

export default {
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'System' : 'Roboto_Medium',
    light: Platform.OS === 'ios' ? 'System' : 'Roboto_Light',
    thin: Platform.OS === 'ios' ? 'System' : 'Roboto_Thin',
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  fontWeights: {
    light: '300',
    regular: '400',
    medium: '500',
    bold: '700',
  },
};