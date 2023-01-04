'strict';

import SQLite from 'react-native-sqlite-storage';

export const openHadithsDb: any = async (name: string, readOnly: boolean = true) => {
    // createFromLocation: 1 => if using ~www/
    const db = await SQLite.openDatabase({name, createFromLocation: 1, readOnly},_ => {}, errorCB)
    
    const api = {
        getRange,
        search,
        getByID
    };

    async function getRange(book, from, limit, onResult) {
        console.debug("+- getRange() =>", {book, from, limit});
        const query = `WITH RECURSIVE
                cnt(x) AS (
                SELECT ?
                UNION ALL
                SELECT x+1 FROM cnt
                    LIMIT ?
                )
                SELECT * from hadiths_index WHERE id IN (SELECT PRINTF("%s:%d", "bukhari", x) FROM cnt);`;
        const q = new Promise((resolve, reject) => {
            db.transaction((tx) => {
                tx.executeSql(query, [from, limit], 
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

    async function search(matchContent, matchId, onResult) {
        let match = "";
        if (matchContent.length > 0) {
            match = `content:${matchContent}`;
        }
        if (matchId.length > 0) {
            if (matchContent.length == 0) {
                match = `id:${matchId}`;
            } else {
                match += ` OR id:${matchId}`;
            }
        }    
        console.debug({match});

        const q = new Promise((resolve, reject) => {
            db.transaction((tx) => {
                tx.executeSql("SELECT * FROM hadiths_index WHERE hadiths_index MATCH ?", [match], 
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

    async function getByID(id: string) {
        let result = null;
        await db.transaction((tx) => {
            tx.executeSql('SELECT * FROM hadiths_index WHERE id = ?', [id], 
                (tx, results) => {
                    if (results.rows.raw.length > 0) {
                        result = results.rows.raw[0].value;
                    }
                },
                errorCB);
        })
        return result;
    }

    async function getAll(books: Array<string>, filter) {
    }

    async function setContent(id: string, content: string) {
        let result = null;
        await db.transaction((tx) => {
            tx.executeSql('SELECT * FROM hadiths_index WHERE id = ?', [id], 
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
