import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import KnexDialect from '@lib/knex_dialect';
import { unzip, subscribe } from 'react-native-zip-archive';
import knex from 'knex';
import { Table } from '@types';
import { SECTION_FIRST, SECTION_LAST } from '@data';
import config from '@config/';

const DB_FILENAME = 'hadiths_all.db';
const DB_ZIPFILE = `${DB_FILENAME}.zip`;
const ASSET_DB_PATH = `../../assets/${DB_ZIPFILE}`;

subscribe(({ progress, filePath }) => {
    // the filePath is always empty on iOS for zipping.
    console.log(`progress: ${progress}\nprocessed at: ${filePath}`)
})

const getTranslator = (lang = $$LOCALE) => ({ 'fil': 'google_tl', 'eng': 'srceng', 'ara': 'srcara' }[lang]);

export async function create_knex() {
    if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite');
    }

    if (!(await FileSystem.getInfoAsync(FileSystem.cacheDirectory + 'SQLite')).exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + 'SQLite');
    }

    const filename = DB_FILENAME;
    const cache_file = FileSystem.cacheDirectory + `SQLite/${DB_ZIPFILE}`;
    const sql_dir = FileSystem.documentDirectory + "SQLite/";
    const dbpath = sql_dir + filename;
    const db_exists = (await FileSystem.getInfoAsync(dbpath)).exists;
    const cache_exists = (await FileSystem.getInfoAsync(cache_file)).exists;

    console.debug({ db_exists, cache_exists })

    //db_exists && await FileSystem.deleteAsync(dbpath);
    //cache_exists && await FileSystem.deleteAsync(cache_file);

    if (!db_exists) {
        console.debug('downloading db,,,')
        await FileSystem.makeDirectoryAsync(sql_dir, { intermediates: true });

        if (!cache_exists) {
            const asset = Asset.fromModule(require(ASSET_DB_PATH));
            console.debug('got asset', asset.uri);
            await FileSystem.downloadAsync(asset.uri, cache_file);
        }

        console.debug({ cache_file, dbpath });
        console.debug(await unzip(cache_file, dbpath));
    }
    else {
        console.debug('db exists');
    }

    console.debug({ sql_dir });

    return knex({
        client: KnexDialect,
        connection: { filename },
        useNullAsDefault: true
    });
}

export const openHadithsDb2: any = async () => {
    const db = await create_knex();

    return {
        async getSelectedRanges(selected, opts) {
            console.log('+getSelectedRanges()');
            return await this.getSelectedRanges0(selected, opts);
        },

        async * getSelectedRanges0(selected, opts) {
            const books = Object.keys(selected);
            for await (const book of books) {
                console.debug('getSelectedRanges0', { book });
                const sections: any = selected[book];
                let ranges: Array<any> = [];
                for (let sectionId in sections) {
                    let section = sections[sectionId];
                    ranges.push([section[SECTION_FIRST], section[SECTION_LAST]])
                }

                const gen = await this.getRange(book, ranges, opts)
                while (true) {
                    let y = await gen.next();
                    //console.debug("getSelectedRanges0 ", { y });
                    if (y.done) {
                        break;
                    };
                    yield (y.value);
                }
            }
        },

        async getRange(book, ranges, opts) {
            console.debug('+getRange');

            const query = db(Table.translations)
                .select('*')
                .where('book', book)
                .where('translator', getTranslator());

            query.where(function () {
                ranges.forEach(v => {
                    this.orWhereBetween('idint', [v[0], v[1]])
                });
            });

            return await this.execute_gen_query(query, opts);
        },

        async * execute_gen_query(query, opts) {
            const { per_page } = Object.assign({
                per_page: config.per_page
            }, opts);

            const total_query = query.clone()
                .count({ count: 'translation_id' })
                .first()
            const total_query_string = total_query.toString();
            total_query.then(res => res?.count ?? 0)
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

                //console.debug('yielding', { result });
                yield ({
                    translations: translations.map(v => ({ ...v, id: `${v.book}:${v.idint}` })),
                    total: await total_query
                });
            }
        },

        async searchByIDs(books: string[], ids, opts) {
            console.debug('+getRange');

            const { per_page } = Object.assign({
                per_page: config.per_page
            }, opts);

            const query = db(Table.translations)
                .select('*')
                .whereIn('book', books)
                .whereIn('idint', ids)
                .where('translator', getTranslator());

            const total = await query.clone()
                .count({ count: 'translation_id' })
                .first()
                .then(res => res?.count ?? 0)
                .catch(err => console.error('searchByIDs total', err));

            return {
                translations: await query,
                total: await total,
            };
        },

        async search(params) {
            console.debug('search', { params });
            let { match_content, match_books } = params;
            if (match_content.length == 0) {
                console.debug("search => empty matchContent");
                return (function* () { })();//empty generator
            }
            match_content = "*" + match_content.split(" ").join("* *") + "*";

            if (match_content.trim().length == 0) {
                if (!!params.selected) {
                    await this.getSelectedRanges(params.selected);
                }
                return
            }

            const query = db(Table.translations)
                .select('*')
                .where('translator', getTranslator())
                .where(db.raw(`(content MATCH ${match_content})`));

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

            return await this.execute_gen_query(query, {});
        }
    }
}