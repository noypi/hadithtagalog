import {MD3LightTheme, MD3DarkTheme} from 'react-native-paper';

const common = {
    animation: {scale:1.0},
}

export const greenTheme = {
    ...common,
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

export const greenDarkTheme = {
    ...common,
    ...MD3DarkTheme,
    animation: {scale:1.0},
    "colors": {
        "primary": "rgb(114, 222, 94)",
        "onPrimary": "rgb(0, 58, 0)",
        "primaryContainer": "rgb(0, 83, 0)",
        "onPrimaryContainer": "rgb(141, 251, 119)",
        "secondary": "rgb(187, 203, 178)",
        "onSecondary": "rgb(38, 52, 34)",
        "secondaryContainer": "rgb(60, 75, 55)",
        "onSecondaryContainer": "rgb(215, 232, 205)",
        "tertiary": "rgb(160, 207, 210)",
        "onTertiary": "rgb(0, 55, 57)",
        "tertiaryContainer": "rgb(30, 77, 80)",
        "onTertiaryContainer": "rgb(188, 235, 238)",
        "error": "rgb(255, 180, 171)",
        "onError": "rgb(105, 0, 5)",
        "errorContainer": "rgb(147, 0, 10)",
        "onErrorContainer": "rgb(255, 180, 171)",
        "background": "rgb(26, 28, 24)",
        "onBackground": "rgb(226, 227, 220)",
        "surface": "rgb(26, 28, 24)",
        "onSurface": "rgb(226, 227, 220)",
        "surfaceVariant": "rgb(67, 72, 63)",
        "onSurfaceVariant": "rgb(195, 200, 188)",
        "outline": "rgb(141, 147, 135)",
        "outlineVariant": "rgb(67, 72, 63)",
        "shadow": "rgb(0, 0, 0)",
        "scrim": "rgb(0, 0, 0)",
        "inverseSurface": "rgb(226, 227, 220)",
        "inverseOnSurface": "rgb(47, 49, 45)",
        "inversePrimary": "rgb(0, 110, 0)",
        "elevation": {
          "level0": "transparent",
          "level1": "rgb(30, 38, 28)",
          "level2": "rgb(33, 44, 30)",
          "level3": "rgb(36, 49, 32)",
          "level4": "rgb(37, 51, 32)",
          "level5": "rgb(38, 55, 34)"
        },
        "surfaceDisabled": "rgba(226, 227, 220, 0.12)",
        "onSurfaceDisabled": "rgba(226, 227, 220, 0.38)",
        "backdrop": "rgba(44, 50, 41, 0.4)"
      }  
}