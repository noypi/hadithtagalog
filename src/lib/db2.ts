import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import KnexDialect from '@lib/knex_dialect';
import { unzip, subscribe } from 'react-native-zip-archive';
import knex from 'knex';
import { Table } from '@types';
import { SECTION_FIRST, SECTION_LAST } from '@data';

const DB_FILENAME = 'hadiths_all.db';
const DB_ZIPFILE = `${DB_FILENAME}.zip`;
const ASSET_DB_PATH = `../../assets/${DB_ZIPFILE}`;

const per_page = 15;

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
        async getSelectedRanges(selected) {
            console.log('+getSelectedRanges()');
            return await this.getSelectedRanges0(selected);
        },

        async * getSelectedRanges0(selected) {
            const books = Object.keys(selected);
            for await (const book of books) {
                console.debug('getSelectedRanges0', { book });
                const sections: any = selected[book];
                let ranges: Array<any> = [];
                for (let sectionId in sections) {
                    let section = sections[sectionId];
                    ranges.push([section[SECTION_FIRST], section[SECTION_LAST]])
                }

                const gen = await this.getRange(book, ranges)
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

        async * getRange(book, ranges) {
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

            const total = await query.clone()
                .count({ count: 'translation_id' })
                .first()
                .then(res => res?.count ?? 0)
                .catch(err => console.error('getRange total', err));

            for (let page = 0; true; page++) {
                const page_query = query.clone()
                    .limit(per_page)
                    .offset(per_page * page);

                console.debug({ page, page_query: page_query.toString() });
                const translations = await page_query
                    .catch(err => console.error('getRange page_query', err));

                if (!translations?.length) {
                    break;
                }

                //console.debug('yielding', { result });
                yield ({
                    translations: translations.map(v => ({ ...v, id: `${v.book}:${v.idint}` })),
                    total
                });
            }
        }
    }
}