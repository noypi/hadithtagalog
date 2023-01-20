import React from 'react';
const langMap = require('./json/lang.json');

const LocaleContext = React.createContext({});

let glocale = 'eng';
export const LocaleProvider = ({children}) => {
    const [locale, setLocale] = React.useState('eng');

    const setLocaleProxy = (l) => {
        glocale= l;
        setLocale(l);
    };

    return (
        <LocaleContext.Provider value={[locale, setLocaleProxy]}>
            {children}
        </LocaleContext.Provider>
    );
};

export const localeDefineProperties = Object.assign({
                                                    useLocaleState: {
                                                        value: () => React.useContext(LocaleContext),
                                                        writable: false
                                                    },
                                                    "$$LOCALE": {
                                                        get: () => glocale,
                                                        set: (l) => {}
                                                    }
                                                },
                                                Object.keys(langMap).reduce((prev, curr) => {
                                                    prev['$'+curr] = { get: () => langMap[curr][$$LOCALE] };
                                                    return prev;
                                                }, {})
                                            );

