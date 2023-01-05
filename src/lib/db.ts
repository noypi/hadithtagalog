'strict';

import SQLite from 'react-native-sqlite-storage';

const DEFAULT_TAGALOG_TRANSLATOR = "google_tl";

export const openHadithsDb: any = async (name: string, readOnly: boolean = true) => {
    // createFromLocation: 1 => if using ~www/
    const db = await SQLite.openDatabase({name, createFromLocation: 1, readOnly},_ => {}, errorCB)
    
    const api = {
        getRange,
        search,
        getByID
    };

    async function getRange(book: string, ranges: Array<any> = [], onResult) {
        //console.debug("+- getRange() =>", {book, from, limit});
        let query = "SELECT * from hadiths WHERE";
        let queryParams: Array<string> = [];
        const queryBook = "id LIKE ?";
        const queryRanges = (new Array(ranges.length)).fill("(idint BETWEEN ? AND ?)").join(" OR ");

        if (queryBook.length > 0) {
            query = `${query} ${queryBook}`;
            queryParams.push(`${book}%`);
        }

        if (queryRanges.trim().length > 0) {
            query = `${query} AND (${queryRanges})`
            queryParams = [...queryParams, ...(ranges.flat())] 
        }
        console.debug({query});
        console.debug({queryParams});
        const q = new Promise((resolve, reject) => {
            db.transaction((tx) => {
                tx.executeSql(query, queryParams, 
                    (tx, results) => {
                        for(let i=0; i<results.rows.length; i++) {
                            let item = results.rows.item(i);
                            if (item.id && item.content) {
                                onResult(item);
                            }
                        }
                        resolve(true);
                    },
                    err => {
                        errorCB(err);
                        reject(err);
                    });
            })
        })
        await q;
    }

    async function search(params, onResult) {
        let {book, matchContent, matchIds} = Object.assign({book: "", matchContent: "*", matchIds: []}, params);

        const query = "SELECT * from hadiths_meta INNER JOIN hadiths_fts ON hadiths_meta.rowid = hadiths_fts.rowid " +
                      "WHERE content MATCH ? " + (new Array(matchIds.length)).fill("OR hadiths_meta.id LIKE ?").join(" ");
        console.debug({query});
        const queryParams = [matchContent, ...matchIds.map(v => `${book}%${v}%`)];
        const q = new Promise((resolve, reject) => {
            db.transaction((tx) => {
                tx.executeSql(query, queryParams, 
                    (tx, results) => {
                        for(let i=0; i<results.rows.length; i++) {
                            let item = results.rows.item(i);
                            if (item.id && item.content) {
                                onResult(item);
                            }
                        }
                        resolve(true);
                    },
                    err => {
                        errorCB(err);
                        reject(err);
                    });
            })
        })
        await q;
    }

    async function getByID(id: string, translator: string = DEFAULT_TAGALOG_TRANSLATOR) {
        let result = null;
        await db.transaction((tx) => {
            tx.executeSql('SELECT * FROM hadiths_index WHERE id = ? AND translator = ?', [id, translator], 
                (tx, results) => {
                    if (results.rows.raw.length > 0) {
                        result = results.rows.raw[0].value;
                    }
                },
                errorCB);
        })
        return result;
    }

    async function setContent(id: string, content: string, translator: string = DEFAULT_TAGALOG_TRANSLATOR) {
        let result = null;
        await db.transaction((tx) => {
            tx.executeSql('SELECT * FROM hadiths_index WHERE id = ? AND translator = ?', [id, translator], 
                (tx, results) => {
                    if (results.rows.raw.length > 0) {
                        result = results.rows.raw[0].value;
                    }
                },
                errorCB);
        })
        return result;
    }


    return api;
}

const errorCB = (err) => {
    console.error('error:', err)
 }
