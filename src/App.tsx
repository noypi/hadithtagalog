import React from 'react';
import {Provider, MD3LightTheme, useTheme} from 'react-native-paper';

import "./init";
import {HomeScreen} from '@screens';


const greenTheme = {
    ...MD3LightTheme,
    "colors": {
        "primary": "rgb(0, 109, 61)",
        "onPrimary": "rgb(255, 255, 255)",
        "primaryContainer": "rgb(151, 247, 183)",
        "onPrimaryContainer": "rgb(0, 33, 15)",
        "secondary": "rgb(79, 99, 84)",
        "onSecondary": "rgb(255, 255, 255)",
        "secondaryContainer": "rgb(210, 232, 212)",
        "onSecondaryContainer": "rgb(13, 31, 19)",
        "tertiary": "rgb(59, 100, 112)",
        "onTertiary": "rgb(255, 255, 255)",
        "tertiaryContainer": "rgb(190, 234, 247)",
        "onTertiaryContainer": "rgb(0, 31, 38)",
        "error": "rgb(186, 26, 26)",
        "onError": "rgb(255, 255, 255)",
        "errorContainer": "rgb(255, 218, 214)",
        "onErrorContainer": "rgb(65, 0, 2)",
        "background": "rgb(251, 253, 248)",
        "onBackground": "rgb(25, 28, 26)",
        "surface": "rgb(251, 253, 248)",
        "onSurface": "rgb(25, 28, 26)",
        "surfaceVariant": "rgb(220, 229, 219)",
        "onSurfaceVariant": "rgb(65, 73, 66)",
        "outline": "rgb(113, 121, 113)",
        "outlineVariant": "rgb(192, 201, 191)",
        "shadow": "rgb(0, 0, 0)",
        "scrim": "rgb(0, 0, 0)",
        "inverseSurface": "rgb(46, 49, 46)",
        "inverseOnSurface": "rgb(240, 241, 236)",
        "inversePrimary": "rgb(123, 218, 156)",
        "elevation": {
          "level0": "transparent",
          "level1": "rgb(238, 246, 239)",
          "level2": "rgb(231, 242, 233)",
          "level3": "rgb(223, 237, 227)",
          "level4": "rgb(221, 236, 226)",
          "level5": "rgb(216, 233, 222)"
        },
        "surfaceDisabled": "rgba(25, 28, 26, 0.12)",
        "onSurfaceDisabled": "rgba(25, 28, 26, 0.38)",
        "backdrop": "rgba(43, 50, 44, 0.4)"
      }
  };

export default function App() {
    return (
      <Provider theme={greenTheme}>
          <HomeScreen />
      </Provider>
    );
  }
  

type AppTheme = typeof greenTheme;
Object.defineProperty(global, 'useAppTheme', {
    value: () => useTheme<AppTheme>(),
    writable: false
  });