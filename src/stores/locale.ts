import { action, computed, observable } from "mobx";
import _ from 'lodash';
import lang_map from '@data/json/lang.json';
import { useEffect, useState } from "react";

export type Lang = 'fil' | 'eng' | 'ara';

class LocaleStore {
    @observable locale: Lang = 'fil';

    @action set_locale(lang: Lang) {
        this.locale = lang;
    }

    @computed get tk() {
        return _.mapValues(lang_map, this.locale);
    }
}

const store = new LocaleStore();
export default store;

export function useLocaleStore() {
    const [$tk, setTk] = useState(store.tk);
    const [$lang, setLang] = useState(store.lang);

    useEffect(() => {
        setTk(store.tk);
        setLang(store.locale);

    }, [store.locale]);

    return {
        $tk,
        $lang,
    };
}

