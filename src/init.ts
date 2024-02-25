//import 'node-libs-react-native/globals';
import 'react-native-gesture-handler';
import { Appearance, LogBox, NativeModules, Platform } from 'react-native';
import { splitHadithId, bookOf, idOf, openHadithsDb } from '@lib';
import { greenTheme, greenDarkTheme } from '@data/theme';
import { localeDefineProperties } from './data/locale';
import { create_knex, openHadithsDb2 } from './lib/db2';

console.debug("initializing polyfills...");

// if (Platform.OS === 'android') {
//     const { UIManager } = NativeModules;
//     if (UIManager) {
//         // Add gesture specific events to genericDirectEventTypes object
//         // exported from UIManager native module.
//         // Once new event types are registered with react it is possible
//         // to dispatch these events to all kind of native views.
//         UIManager.genericDirectEventTypes = {
//             ...UIManager.genericDirectEventTypes,
//             onGestureHandlerEvent: { registrationName: 'onGestureHandlerEvent' },
//             onGestureHandlerStateChange: {
//                 registrationName: 'onGestureHandlerStateChange',
//             },
//         };
//     }
// }

const DEBUG_MODE = !!__DEV__;
console.debug({ DEBUG_MODE });

let dbfil
openHadithsDb2().then(db => dbfil = db);

const isDarkModeFn = () => Appearance.getColorScheme() == 'dark';

global.$$isDarkModeLocal = null;

const writable = DEBUG_MODE;
Object.defineProperties(global, {
    "splitHadithId": {
        value: splitHadithId,
        writable
    },
    "bookOf": {
        value: bookOf,
        writable
    },
    "idOf": {
        value: idOf,
        writable
    },
    "useAppTheme": {
        value: () => $$isDarkMode ? greenDarkTheme : greenTheme,
        writable
    },
    "$$isDarkMode": {
        get: () => ($$isDarkModeLocal == null) ? isDarkModeFn() : $$isDarModeLocal
    },
    "$$db": {
        get: () => dbfil
    },
    "$$db2": {
        get: () => db2
    }
});

Object.defineProperties(global, localeDefineProperties);
