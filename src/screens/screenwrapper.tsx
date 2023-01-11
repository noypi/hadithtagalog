import * as React from 'react';
import {
  StyleSheet
} from 'react-native';
import {Surface} from 'react-native-paper';

export const ScreenWrapper = (props) => {
    const containerStyle = [
        styles.container,
        {},
    ];

    return (
        <Surface flex={1} {...props}></Surface>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });