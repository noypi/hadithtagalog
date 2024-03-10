import { action, computed, makeObservable, observable } from 'mobx';
import $db from '@stores/hadiths_db';

class HadithStore {
    @observable list = [];
    @observable total = 0;
    @observable done = false;
    result_generator = null;

    constructor() {
        makeObservable(this);
    }

    @computed get count() {
        return this.list.length;
    }

    @action async update(selected) {
        console.log(' update ', { selected });
        this.reset();
        this.result_generator = await $db.get_selected_ranges(selected);
        await this.load_more();
    }

    @action async search(params) {
        this.reset();
        let by_ids_result = { translations: [], total: 0 };
        if (params.match_ids?.length) {
            by_ids_result = await $db.search_by_ids(params.match_books, params.match_ids);
        }

        this.result_generator = await $db.search(params);
        await this.load_more();

        const search_total = this.total;
        this.list = [...by_ids_result?.translations ?? [], ...this.list];
        this.total += by_ids_result?.total ?? 0;

        return {
            by_ids_total: by_ids_result?.total ?? 0,
            search_total,
        };
    }

    @action async update_favorites() {
        this.reset();
        this.result_generator = await $db.get_favorites();
        await this.load_more();
    }

    @action async update_tagged(tags: string[]) {
        this.reset();
        this.result_generator = await $db.get_tagged(tags);
        await this.load_more();
    }

    @action async load_more() {
        const { done, value } = await this.result_generator.next();
        console.debug({ done, value });
        if (done) {
            this.done = true;
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
        this.done = false;
    }
}

const store = new HadithStore();
export default store;
