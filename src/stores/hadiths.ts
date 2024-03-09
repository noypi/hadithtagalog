import { action, computed, makeObservable, observable } from 'mobx';
import { useEffect, useState } from 'react';

class HadithStore {
    @observable list = [];
    @observable total = 0;
    result_generator = null;

    constructor() {
        makeObservable(this);
    }

    @action async update(selected) {
        this.result_generator = await get_hadiths(selected);
        this.list = [];
        await this.load_more();
    }

    @action async load_more() {
        const { done, value } = await this.result_generator.next();
        this.total = value.total;
        if (value.translations?.length) {
            this.list = [...this.list, ...value.translations];
        }
    }
}

const store = new HadithStore();
export default store;

async function get_hadiths(selected) {
    let rg = await $$db?.getSelectedRanges(selected);
    console.log({ rg })
    return rg;
}