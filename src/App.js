import "./init";

import React from 'react';
import {Provider, MD3LightTheme, adaptNavigationTheme} from 'react-native-paper';
import {HomeScreen} from '@screens';


export default function App() {
  return (
    <Provider theme={MD3LightTheme}>
        <HomeScreen />
    </Provider>
  );
}
