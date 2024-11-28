import { action, computed, observable } from "mobx";
import _ from 'lodash';
import lang_map from '@data/json/lang.json';
import { useEffect, useMemo, useState } from "react";
import { computed_property } from "@lib";

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
    return {
        $tk: computed_property(store.tk),
        $lang: computed_property(store.locale),
    };
}

