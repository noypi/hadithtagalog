import { action, computed, makeObservable, observable } from 'mobx';
import { useEffect, useState } from 'react';

class HadithStore {
    @observable list = [];
    @observable total = 0;
    result_generator = null;

    constructor() {
        makeObservable(this);
    }

    @computed get count() {
        return this.list.length;
    }

    @action async update(selected) {
        this.reset();
        this.result_generator = await get_hadiths(selected);
        await this.load_more();
    }

    @action async search(params) {
        this.reset();
        let by_ids_result = {};
        if (params.match_ids?.length) {
            by_ids_result = await search_by_ids(params.match_books, params.match_ids);
        }

        this.result_generator = await search_hadiths(params);
        await this.load_more();

        const search_total = this.total;
        this.list = [...by_ids_result?.translations ?? [], ...this.list];
        this.total += by_ids_result?.total ?? 0;

        return {
            by_ids_total: by_ids_result?.total ?? 0,
            search_total,
        };
    }

    @action async load_more() {
        const { done, value } = await this.result_generator.next();
        if (done) {
            return;
        }

        if (!this.total) {
            this.total = value.total;
        }

        if (value.translations?.length) {
            this.list = [...this.list, ...value.translations];
        }
    }

    @action reset() {
        this.list = [];
        this.total = 0;
    }
}

const store = new HadithStore();
export default store;

async function get_hadiths(selected) {
    let rg = await $$db?.getSelectedRanges(selected);
    return rg;
}

async function search_hadiths(params) {
    let rg = await $$db?.search(params);
    return rg;
}

async function search_by_ids(match_books, match_ids) {
    const result = await $$db?.search_by_ids(match_books, match_ids);
    return result;
}