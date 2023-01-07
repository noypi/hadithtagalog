import {splitHadithId, bookOf, idOf} from '@lib';
import {greenTheme} from '@data/theme';

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
