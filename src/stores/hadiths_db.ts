import config from "@config/";
import { SECTION_FIRST, SECTION_LAST, Table } from "@lib/enums";
import { computed, observable } from "mobx";
import $db from '@stores/db';
import $locale from '@stores/locale';
import { subscribe } from "react-native-zip-archive";
import { split_hadith_id } from "@lib/";

interface TranslationsResult {
    translations: any[]
    total: number
}

class HadithsDB {
    @observable progress = 0;

    @computed get translator() {
        return ({
            'fil': 'google_tl',
            'eng': 'srceng',
            'ara': 'srcara',
        }[$locale.locale]);
    }

    private async * execute_gen_query(query, opts = {}): AsyncGenerator<TranslationsResult> {
        const { per_page } = Object.assign({
            per_page: config.per_page
        }, opts);

        const total_query = query.clone()
            .count({ count: 'translation_id' })
            .first()
        const total_query_string = total_query.toString();
        const total = await total_query.then(res => res?.count ?? 0)
            .catch(err => console.error('execute_gen_query total', err, { total_query: total_query_string }));

        for (let page = 0; true; page++) {
            const page_query = query.clone()
                .limit(per_page)
                .offset(per_page * page);

            console.debug({ page, page_query: page_query.toString() });
            const translations = await page_query
                .catch(err => console.error('execute_gen_query page_query', err));

            if (!translations?.length) {
                break;
            }

            yield ({
                translations: translations.map(v => ({ ...v, id: `${v.book}:${v.idint}` })),
                total,
            });
        }
    }

    async get_selected_ranges(selected, opts = {}) {
        console.log('+getSelectedRanges()');
        return await this.get_selected_ranges0(selected, opts);
    }

    private async * get_selected_ranges0(selected, opts) {
        const books = Object.keys(selected);
        for await (const book of books) {
            console.debug('getSelectedRanges0', { book });
            const sections: any = selected[book];
            let ranges: Array<any> = [];
            for (let sectionId in sections) {
                let section = sections[sectionId];
                ranges.push([section[SECTION_FIRST], section[SECTION_LAST]])
            }

            const gen = await this.get_range(book, ranges, opts)
            while (true) {
                let y = await gen.next();
                console.debug("getSelectedRanges0 ", { y });
                if (y.done) {
                    break;
                };
                yield (y.value);
            }
        }
    }

    private async get_range(book, ranges, opts) {
        console.debug('+getRange', { book, ranges });

        const query = $db.knex(Table.translations)
            .select('*')
            .where('book', book)
            .where('translator', this.translator);

        query.where(function () {
            ranges.forEach(v => {
                this.orWhereBetween('idint', [v[0], v[1]])
            });
        });

        return await this.execute_gen_query(query, opts);
    }

    async search_by_ids(books: string[], ids, opts = {}) {
        console.debug('+getRange');

        const { per_page } = Object.assign({
            per_page: config.per_page
        }, opts);

        const query = $db.knex(Table.translations)
            .select('*')
            .whereIn('book', books)
            .whereIn('idint', ids)
            .where('translator', this.translator);

        const total = await query.clone()
            .count({ count: 'translation_id' })
            .first()
            .then(res => res?.count ?? 0)
            .catch(err => console.error('searchByIDs total', err));

        return {
            translations: await query,
            total: await total,
        };
    }

    async search(params): Promise<AsyncGenerator<TranslationsResult>> {
        console.debug('search', { params });
        let { match_content, match_books } = params;
        if (match_content.length == 0) {
            console.debug("search => empty matchContent");
            return (async function* () { })();//empty generator
        }
        match_content = "'*" + match_content.split(" ").join("*' '*") + "*'";

        if (match_content.trim().length == 0) {
            if (!!params.selected) {
                await this.get_selected_ranges(params.selected);
            }
            return;
        }

        const query = $db.knex(Table.translations)
            .select('*')
            .where('translator', this.translator)
            .where($db.knex.raw(`(content MATCH ${match_content})`));

        if (match_books.length) {
            query.whereIn('book', match_books);
        }

        // append selected sections to query
        if (!!params.selected) {
            let q1 = "";
            Object.keys(params.selected).forEach(book_section => {
                let ranges: Array<any> = [];
                Object.keys(params.selected[book_section]).forEach(section_id => {
                    let section: Array<any> = params.selected[book_section][section_id];
                    ranges.push([section[SECTION_FIRST], section[SECTION_LAST]]);
                })

                query.where(function () {
                    this.where('book', book_section)
                        .where(function () {
                            ranges.forEach(v => {
                                this.orWhereBetween('idint', [v[0], v[1]]);
                            });
                        });
                });
            });
        }

        return await this.execute_gen_query(query);
    }

    async get_tags() {
        const query = $db.knex(Table.tags_list)
            .select('tag');

        return await query;
    }

    async add_hadith_tag(hadithid: string, tag: string) {
        let [book, id] = split_hadith_id(hadithid);
        console.debug({ book, id });

        return $db.knex(Table.tags)
            .insert({
                tag,
                book,
                idint: id,
            });
    }

    async remove_hadith_tag(hadithid: string, tag: string) {
        let [book, id] = split_hadith_id(hadithid);

        return $db.knex(Table.tags)
            .where({
                tag,
                book,
                idint: id,
            })
            .del();
    }

    async del_tag_and_untag_hadiths(tag: string) {
        await $db.knex(Table.tags_meta)
            .whereIn({
                tag_id: $db.knex(Table.tags_list).where({ tag }).select('rowid')
            })
            .del();

        await $db.knex(Table.tags)
            .where({ tag });
    }

    async new_tag(tag: string) {
        if (tag.length == 0) { return }
        return $db.knex(Table.tags_list)
            .insert({ tag });
    }

    async get_hadith_tags(hadithId: string) {
        let [book, id] = split_hadith_id(hadithId);
        return $db.knex(Table.tags)
            .select('tag')
            .where({
                book,
                idint: id,
            });

    }

    async get_favorites() {
        const query = $db.knex(Table.translations)
            .whereIn({
                hadiths_meta_rowid: $db.knex(Table.favorites)
                    .select('hadiths_meta_rowid')
            })
            .where({ translator: this.translator });

        return await this.execute_gen_query(query);
    }

    async add_favorite(hadithid: string) {
        console.debug("+-addFavorite()", { hadithid });
        let [book, id] = split_hadith_id(hadithid);
        console.debug({ book, id });
        return $db.knex(Table.favorites_list)
            .insert({
                hadiths_meta_rowid: $db.knex(Table.hadiths)
                    .select('metarowid')
                    .where({ book, idint: id })
            });
    }

    async remove_favorite(hadithid: string) {
        let [book, id] = split_hadith_id(hadithid);

        return $db.knex(Table.favorites_list)
            .where({
                hadiths_meta_rowid: $db.knex(Table.hadiths)
                    .select('metarowid')
                    .where({ book, idint: id })
            })
            .del();
    }

    async get_tagged(tags: string[]) {
        if (tags.length == 0) {
            return (async function* () { })();//empty generator
        }

        const query = $db.knex({ t: Table.translations })
            .join({ g: Table.tags }, 'g.hadiths_meta_rowid', 't.hadiths_meta_rowid')
            .whereIn('g.tag', tags)
            .where({ translator: this.translator })
            .groupBy('t.hadiths_meta_rowid')
            .having($db.knex.raw(`COUNT(t.hadiths_meta_rowid) == ${tags.length}`));

        return await this.execute_gen_query(query);
    }
}

const store = new HadithsDB();
export default store;

subscribe(({ progress, filePath }) => {
    // the filePath is always empty on iOS for zipping.
    store.progress = progress;
    console.log(`progress: ${progress}\nprocessed at: ${filePath}`)
})
