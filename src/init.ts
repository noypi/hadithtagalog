import {splitHadithId, bookOf, idOf} from '@lib';

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
});
