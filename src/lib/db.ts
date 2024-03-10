'strict';

import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import { SECTION_FIRST, SECTION_LAST } from "@lib/enums";
import { split_hadith_id } from './utils';

export const QUERY_STEP = 25;

// async function openDatabase(pathToDatabaseFile: string, name: string): Promise<SQLite.WebSQLDatabase> {
//     if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
//         await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite');
//     }
//     await FileSystem.downloadAsync(
//         Asset.fromModule(require(pathToDatabaseFile)).uri,
//         FileSystem.documentDirectory + `SQLite/${name}`
//     );
//     return SQLite.openDatabase(name);
// }

export const openHadithsDb: any = async (name: string, readOnly: boolean = false) => {
    // createFromLocation: 1 => if using ~www/
    const db = await SQLite.openDatabase(name);
    console.log('db opened', { db });
    db.exec([{ sql: `SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%';`, args: [] }], true, (a, b) => console.log('query res', { a, b, rows: b[0]?.rows }))
    //await SQLite.openDatabase({ name, createFromLocation: 1, readOnly }, _ => { }, errorCB())

    const api = {
        getTagged,
        getTags,
        newTag,
        addHadithTag,
        removeHadithTag,
        getHadithTags,
        delTagAndUnTagHadiths,
        addFavorite,
        removeFavorite,
        getFavorites,
        getRange,
        getSelectedRanges,
        searchByIDs,
        search,
        getByID,
        executeSql: (q) => {
            console.log('running q', q)
            db.exec([{ sql: `SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%';`, args: [] }], true, (a, b) => console.log('query res', { a, b, rows: b[0]?.rows }))
        },
    };

    const constructQueryRanges = (query, { book, ranges }) => {
        let queryParams: Array<string> = [];
        const queryBook = "book = ?";
        const queryRanges = (new Array(ranges.length)).fill("(idint BETWEEN ? AND ?)").join(" OR ");

        if (queryBook.length > 0) {
            query = `${query} ${queryBook}`;
            queryParams.push(book);
        }

        if (queryRanges.trim().length > 0) {
            query = `${query} AND (${queryRanges})`
            queryParams = [...queryParams, ...(ranges.flat())]
        }
        console.debug({ query });
        console.debug({ queryParams });

        return { query, queryParams };
    }

    async function* executeSql(query, queryParams, onError) {
        const handleResults = (onDoneResults) => (tx, r) => {
            //console.debug("handleResults", {r});
            let results: Array<any> = [];
            for (let i = 0; i < r.rows.length; i++) {
                let item = r.rows.item(i);
                //console.debug("executeSql=>", {item});
                if (item.book && item.idint && item.content) {
                    item = Object.assign({ id: `${item.book}:${item.idint}` }, item);
                    results.push(item);
                } else {
                    results.push(item);
                }
            }
            onDoneResults(results)
        };

        const step = QUERY_STEP;
        let done = false;
        let offset = 0;
        while (!done) {
            let query0 = `${query} LIMIT ${step} OFFSET ${offset}`;
            console.debug({ query0 });
            console.debug({ queryParams });
            let q = new Promise((resolve, reject) => {
                let q2 = new Promise(resolve2 => {
                    if (query.indexOf("SELECT * FROM translations") == 0) {
                        db.transaction(async (tx) => {
                            let queryCount = query.replace("SELECT *", "SELECT count() as total");
                            //console.debug("executeSql", {queryCount});
                            tx.executeSql(queryCount, queryParams, handleResults(r => {
                                //console.debug("query count", {r});
                                if (r.length == 1) {
                                    resolve2(r[0].total);
                                } else {
                                    resolve2(0);
                                }
                            }), errorCB(reject));
                        })
                    } else {
                        console.debug("no total");
                        resolve2(0);
                    }
                })
                db.transaction(async (tx) => {
                    console.debug("executeSql", { query0 });
                    tx.executeSql(query0, queryParams, handleResults(async r => {
                        //console.debug({r});
                        if (r.length < step) {
                            done = true;
                        }
                        offset += QUERY_STEP;
                        resolve({ translations: r, total: await q2 });
                    }), errorCB(reject));
                })
            });
            let rr = await q;
            console.debug("yielding length =>", rr?.translations.length);
            yield (rr);
        }
    }

    async function delTagAndUnTagHadiths(tag: string) {
        db.transaction((tx) => {
            let query1 = "DELETE FROM tags_meta WHERE tag_id IN (SELECT rowid FROM tags_list WHERE tag = ?);";
            let query2 = "DELETE FROM tags_list WHERE tag = ?;";
            tx.executeSql(query1, [tag], (tx, results) => {
                console.debug("delTagAndUnTagHadiths query1", { affected: results.rowsAffected });
                tx.executeSql(query2, [tag], (tx, results) => {
                    console.debug("delTagAndUnTagHadiths query2", { affected: results.rowsAffected });
                }, errorCB())
            }, errorCB())
        });
    }

    async function getHadithTags(hadithId: string) {
        let [book, id] = split_hadith_id(hadithId);
        let query = "SELECT tag FROM tags WHERE book = ? AND idint = ?";
        const q = new Promise((resolve, reject) => {
            db.transaction((tx) => {
                let tags: Array<any> = [];
                tx.executeSql(query, [book, id], (tx, r) => {
                    //console.debug("getHadithTags", {r});
                    for (let i = 0; i < r.rows.length; i++) {
                        let item = r.rows.item(i);
                        tags.push(item.tag);
                    }
                    resolve(tags);
                }, errorCB(reject));
            });
        });

        return await q;
    }

    async function getTags() {
        let query = "SELECT tag from tags_list";
        const q = new Promise((resolve, reject) => {
            db.transaction((tx) => {
                let tags: Array<any> = [];
                tx.executeSql(query, [], (tx, r) => {
                    //console.debug("getTags", {r});
                    for (let i = 0; i < r.rows.length; i++) {
                        let item = r.rows.item(i);
                        tags.push(item.tag);
                    }
                    resolve(tags);
                }, errorCB(reject));
            });
        });

        return await q;
    }

    async function newTag(tag: string) {
        if (tag.length == 0) { return }
        const q = new Promise((resolve, reject) => {
            db.transaction((tx) => {
                let tags: Array<any> = [];
                tx.executeSql("INSERT INTO tags_list(tag) VALUES(?)", [tag], (tx, r) => {
                    resolve(r.rowsAffected == 1);
                }, errorCB(reject));
            });
        })
        return await q;
    }

    async function getTagged(tags: Array<string>) {
        if (tags.length == 0) {
            return (function* () { })();//empty generator
        }
        let prepareTags = new Array(tags.length).fill('?').join(',');
        let query = "SELECT * FROM translations JOIN tags ON tags.hadiths_meta_rowid = translations.hadiths_meta_rowid " +
            `WHERE tag IN(${prepareTags}) AND translator = ? GROUP BY translations.hadiths_meta_rowid ` +
            "HAVING COUNT(translations.hadiths_meta_rowid) == ?"
        return await executeSql(query, [...tags, getTranslator(), tags.length], errorCB());
    }

    async function addFavorite(hadithid: string) {
        console.debug("+-addFavorite()", { hadithid });
        let [book, id] = split_hadith_id(hadithid);
        console.debug({ book, id });
        db.transaction((tx) => {
            let query = "INSERT INTO favorites_list(hadiths_meta_rowid) SELECT hadiths.metarowid FROM hadiths WHERE book = ? AND idint = ?";
            tx.executeSql(query, [book, id], (tx, results) => {
                //console.debug({results});
            })
        });
    }

    async function removeFavorite(hadithid: string) {
        let [book, id] = split_hadith_id(hadithid);
        db.transaction((tx) => {
            let query = "DELETE FROM favorites_list WHERE hadiths_meta_rowid in (SELECT hadiths.metarowid FROM hadiths WHERE book = ? AND idint = ?)";
            tx.executeSql(query, [book, id], (tx, results) => {
            }, errorCB())
        });
    }

    async function getFavorites() {
        let query = "SELECT * FROM translations WHERE hadiths_meta_rowid IN (SELECT hadiths_meta_rowid FROM favorites) AND translator = ?";
        return await executeSql(query, [getTranslator()], errorCB());
    }

    async function getRange(book: string, ranges: Array<any> = []) {
        //console.debug("+- getRange() =>", {book, from, limit});
        console.debug("getrange ", { ranges });
        ranges = ranges.slice(1).reduce((prev, curr, currIndex) => {
            let last = prev[prev.length - 1];
            if ((curr[0] - last[1]) == 1) {
                // previous END and current BEGIN has diff of 1
                last[1] = curr[1];
            } else {
                prev.push(curr);
            }

            return prev;
        }, [ranges[0]]);
        console.debug("getrange reduced ", { ranges });
        let { query, queryParams } = constructQueryRanges("SELECT * FROM translations WHERE translator = ? AND", { book, ranges });
        return await executeSql(query, [getTranslator(), ...queryParams], errorCB());
    }

    async function getSelectedRanges(selected) {
        return await getSelectedRanges0(selected);
    }

    async function* getSelectedRanges0(selected) {
        for (let book in selected) {
            console.debug("getSelectedRanges0 ", { book });
            const sections: any = selected[book];
            let ranges: Array<any> = [];
            for (let sectionId in sections) {
                let section = sections[sectionId];
                ranges.push([section[SECTION_FIRST], section[SECTION_LAST]])
            }

            let gen = await getRange(book, ranges);
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

    async function search(params) {
        let { matchContent, matchBooks } = params;
        if (matchContent.length == 0) {
            console.debug("search => empty matchContent");
            return (function* () { })();//empty generator
        }
        matchContent = "*" + matchContent.split(" ").join("* *") + "*";

        if (matchContent.trim().length == 0) {
            if (!!params.selected) {
                await getSelectedRanges(params.selected);
            }
            return
        }

        let query = "SELECT * FROM translations WHERE translator = ? AND";
        let q0a = "(content MATCH ?)";
        query = `${query} (${q0a})`;
        let queryParams = [getTranslator(), matchContent];

        if ((matchBooks?.length ?? 0) > 0) {
            let bookcond = (new Array(matchBooks.length).fill('?').join(','));
            query = `${query} AND book IN (${bookcond})`;
            queryParams = [...queryParams, ...matchBooks];
        }


        // append selected sections to query
        if (!!params.selected) {
            let q1 = "";
            Object.keys(params.selected).forEach(bookSection => {
                let ranges: Array<any> = [];
                Object.keys(params.selected[bookSection]).forEach(sectionId => {
                    let section: Array<any> = params.selected[bookSection][sectionId];
                    ranges.push([section[SECTION_FIRST], section[SECTION_LAST]]);
                })
                let q0 = constructQueryRanges(q1, { book: bookSection, ranges });
                q1 = q0.query;
                queryParams = [...queryParams, ...q0.queryParams];
            });
            query = `${query} AND (${q1})`;
        }

        console.debug({ query });
        console.debug({ queryParams });

        return await executeSql(query, queryParams, errorCB());
    }

    async function searchByIDs(books: Array<string>, ids) {
        console.debug("searchByIds", { books, ids });
        if (books.length == 0 && ids.length == 0) {
            return [];
        }
        ids = ids.map(v => parseInt(v));
        let q = new Promise((resolve, reject) => {
            db.transaction((tx) => {
                let query = "SELECT * FROM translations WHERE translator = ?";
                let q0: Array<string> = [];
                if (books.length > 0) {
                    let queryBooks = (new Array(books.length)).fill("?").join(",");
                    q0.push(`book IN (${queryBooks})`);
                }
                if (ids.length > 0) {
                    let queryIds = (new Array(ids.length)).fill("?").join(",");
                    queryIds = `idint IN(${queryIds})`;
                    q0.push(queryIds);
                }
                query = `${query} AND (${q0.join(" AND ")})`;
                let queryParams = [getTranslator(), ...books, ...ids];

                console.debug("searchByIds", { query });
                console.debug({ queryParams });

                let rr: Array<any> = [];
                tx.executeSql(query, queryParams, (tx, r) => {
                    for (let i = 0; i < r.rows.length; i++) {
                        let item = r.rows.item(i);
                        rr.push(Object.assign({ id: `${item.book}:${item.idint}` }, item));
                    }
                    console.debug("searchByIDs results length =>", rr.length);
                    resolve({ translations: rr, total: rr.length });
                },
                    errorCB(reject));
            })
        })

        return await q;
    }

    async function getByID(id: string, lang: string = $$LOCALE) {
        //console.debug("getByID", {id, lang});
        let [book, idint] = split_hadith_id(id);
        const q = new Promise((resolve, reject) => {
            db.transaction((tx) => {
                tx.executeSql('SELECT * FROM translations WHERE idint = ? AND translator = ? AND book = ?', [idint, getTranslator(lang), book],
                    (tx, r) => {
                        //console.debug("getByID r=>", {r});
                        if (r.rows.length > 0) {
                            let item = r.rows.item(0);
                            //console.debug("getByID", {item});
                            let result = Object.assign({ id: `${item.book}:${item.idint}` }, item);
                            resolve(result);
                        } else {
                            reject();
                        }
                    },
                    errorCB(reject));
            })
        })
        return await q;
    }

    async function setContent(id: string, content: string) {
        let [book, idint] = split_hadith_id(id);
        let result = null;

        await db.transaction((tx) => {
            tx.executeSql('SELECT * FROM hadiths_index WHERE id = ? AND translator = ?', [id, getTranslator()],
                (tx, results) => {
                    if (results.rows.raw.length > 0) {
                        result = results.rows.raw[0].value;
                    }
                },
                errorCB());
        })
        return result;
    }


    return api;
}

const errorCB = (cb = (e) => { }) => (err) => {
    console.error('error:', err, (new Error()).stack)
    cb && cb(err)
}
