const locale = require('./lang.json');

global.$$LOCALE = 'fil';

export const localeDefineProperties = Object.assign({$$LOCALE: {value: 'fil'}},
                                                Object.keys(locale).reduce((prev, curr) => {
                                                    prev['$'+curr] = { get: () => locale[curr][$$LOCALE] };
                                                    return prev;
                                                }, {})
                                            );

