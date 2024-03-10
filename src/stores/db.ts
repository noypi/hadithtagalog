import knex from 'knex';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { unzip } from 'react-native-zip-archive';
import KnexDialect from '@lib/knex_dialect';
import config from '@config/';

class DB {
    knex;
}

const store = new DB();
create_knex()
    .then(db => store.knex = db);

export default store;

async function create_knex() {
    if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite');
    }

    if (!(await FileSystem.getInfoAsync(FileSystem.cacheDirectory + 'SQLite')).exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + 'SQLite');
    }

    const cache_file = FileSystem.cacheDirectory + `SQLite/${config.db_zip_file}`;
    const sql_dir = FileSystem.documentDirectory + "SQLite/";
    const dbpath = sql_dir + config.db_file_name;
    const db_exists = (await FileSystem.getInfoAsync(dbpath)).exists;
    const cache_exists = (await FileSystem.getInfoAsync(cache_file)).exists;

    console.debug({ db_exists, cache_exists, config })

    //db_exists && await FileSystem.deleteAsync(dbpath);
    //cache_exists && await FileSystem.deleteAsync(cache_file);

    if (!db_exists) {
        console.debug('downloading db,,,')
        await FileSystem.makeDirectoryAsync(sql_dir, { intermediates: true });

        if (!cache_exists) {
            const asset = Asset.fromModule(config.db_asset);
            console.debug('got asset', asset.uri);
            await FileSystem.downloadAsync(asset.uri, cache_file);
        }

        console.debug({ cache_file, dbpath });
        console.debug(await unzip(cache_file, sql_dir));
    }
    else {
        console.debug('db exists');
    }

    console.debug({ sql_dir });

    return knex({
        client: KnexDialect,
        connection: { filename: config.db_file_name },
        useNullAsDefault: true
    });
}