import {splitHadithId, bookOf, idOf} from '@lib';
import {greenTheme} from '@data/theme';
import {defineProperties} from '@data/locale';
import { localeDefineProperties } from './data/locale';

console.debug("initializing polyfills...");

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
        value: () => greenTheme,
        writable: false
    },
});

Object.defineProperties(global, localeDefineProperties);
