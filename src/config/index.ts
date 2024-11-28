
const DB_FILENAME = 'hadiths.db';
const DB_ZIPFILE = `${DB_FILENAME}.zip`;

const DB_ASSET = require(`../../assets/${DB_ZIPFILE}`);

const config = {
    per_page: 50,

    db_file_name: DB_FILENAME,
    db_zip_file: DB_ZIPFILE,
    db_asset: DB_ASSET,
};

export default config;