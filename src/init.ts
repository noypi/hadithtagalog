import 'react-native-gesture-handler';
import {Appearance, LogBox} from 'react-native';
import {splitHadithId, bookOf, idOf, openHadithsDb} from '@lib';
import {greenTheme, greenDarkTheme} from '@data/theme';
import { localeDefineProperties } from './data/locale';

console.debug("initializing polyfills...");

let dbfil;
openHadithsDb('hadiths.all').then(db => dbfil = db);

const isDarkModeFn = () => Appearance.getColorScheme() == 'dark';

global.$$isDarkModeLocal = null;

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
        value: () => $$isDarkMode ? greenDarkTheme : greenTheme,
        writable: false
    },
    "$$isDarkMode": {
        get: () => ($$isDarkModeLocal == null) ? isDarkModeFn() : $$isDarModeLocal
    },
    "$$db": {
        get: () => dbfil
    }
});

Object.defineProperties(global, localeDefineProperties);
