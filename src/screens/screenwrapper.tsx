import * as React from 'react';
import {
  StyleSheet,
  StyleProp,
  ScrollViewProps,
  ViewStyle
} from 'react-native';
import {Surface} from 'react-native-paper';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = ScrollViewProps & {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
  };

export const ScreenWrapper = ({children, style}: Props) => {
    const containerStyle = [
        styles.container,
        {},
    ];

    return (
        <Surface style={[containerStyle, style]}>{children}</Surface>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });