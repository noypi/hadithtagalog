import {Appearance, LogBox} from 'react-native';
import {splitHadithId, bookOf, idOf} from '@lib';
import {greenTheme, greenDarkTheme} from '@data/theme';
import { localeDefineProperties } from './data/locale';

console.debug("initializing polyfills...");

const isDarkModeFn = () => Appearance.getColorScheme() == 'dark';

Object.defineProperties(global, {
    "splitHadithId": {
        value: splitHadithId,
        writable: false
    },
    "bookOf": {
        value: bookOf,
        writable: false
    },
    "idOf": {
        value: idOf,
        writable: false
    },
    "useAppTheme": {
        value: () => isDarkModeFn() ? greenDarkTheme : greenTheme,
        writable: false
    },
    "$$isDarkMode": {
        get: isDarkModeFn
    }
});

Object.defineProperties(global, localeDefineProperties);

LogBox.ignoreLogs(['Warning: Async Storage has been extracted from react-native core']);