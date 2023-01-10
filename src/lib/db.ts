'strict';

import SQLite from 'react-native-sqlite-storage';
import {SECTION_FIRST, SECTION_LAST} from '@data';
import { splitHadithId } from './data';

const DEFAULT_TAGALOG_TRANSLATOR = "google_tl";
export const QUERY_STEP = 25;

export const openHadithsDb: any = async (name: string, readOnly: boolean = false) => {
    // createFromLocation: 1 => if using ~www/
    const db = await SQLite.openDatabase({name, createFromLocation: 1, readOnly},_ => {}, errorCB())
    
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
        getByID
    };

    const constructQueryRanges = (query, {book, ranges}) => {
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
        console.debug({query});
        console.debug({queryParams});

        return {query, queryParams};
    }

    async function* executeSql(query, queryParams, onError) {
        const handleResults = (onDoneResults) => (tx, r) => {
            //console.debug("handleResults", {r});
            let results: Array<any> = [];
            for(let i=0; i<r.rows.length; i++) {
                let item = r.rows.item(i);
                //console.debug("executeSql=>", {item});
                if (item.book && item.idint && item.content) {
                    item = Object.assign({id: `${item.book}:${item.idint}`}, item);
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
        while(!done) {
            let query0 = `${query} LIMIT ${step} OFFSET ${offset}`;
            console.debug({query0});
            console.debug({queryParams});
            let q = new Promise(resolve => {
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
                            }));
                        })
                    } else {
                        console.debug("no total");
                        resolve2(-1);
                    }
                })
                db.transaction(async (tx) => {
                    tx.executeSql(query0, queryParams, handleResults(async r => {
                        //console.debug({r});
                        if (r.length < step) {
                            done = true;
                        }
                        offset += QUERY_STEP;
                        resolve({translations: r, total: await q2});
                    }));
                })
            });
            let rr = await q;
            console.debug("yielding length =>", rr?.translations.length);
            yield(rr);
        }
    }

    async function addHadithTag(hadithid: string, tag: string) {
        let [book, id] = splitHadithId(hadithid);
        console.debug({book, id});
        db.transaction((tx) => {
            let query = "INSERT INTO tags(tag, book, idint) VALUES(?, ?, ?)";
            tx.executeSql(query, [tag, book, id], (tx, results) => {
                //console.debug({results});
            })
        });
    }

    async function removeHadithTag(hadithid: string, tag: string) {
        let [book, id] = splitHadithId(hadithid);
        db.transaction((tx) => {
            let query = "DELETE FROM tags WHERE tag = ? AND book = ? AND idint = ?";
            tx.executeSql(query, [tag, book, id], (tx, results) => {
            })
        });
    }

    async function delTagAndUnTagHadiths(tag: string) {
        db.transaction((tx) => {
            let query1 = "DELETE FROM tags_meta WHERE tag_id IN (SELECT rowid FROM tags_list WHERE tag = ?);";
            let query2 = "DELETE FROM tags_list WHERE tag = ?;";
            tx.executeSql(query1, [tag], (tx, results) => {
                console.debug("delTagAndUnTagHadiths query1", {affected: results.rowsAffected});
                tx.executeSql(query2, [tag], (tx, results) => {
                    console.debug("delTagAndUnTagHadiths query2", {affected: results.rowsAffected});
                })
            })
        });
    }

    async function getHadithTags(hadithId: string) {
        let [book, id] = splitHadithId(hadithId);
        let query = "SELECT tag FROM tags WHERE book = ? AND idint = ?";
        const q = new Promise(resolve => {
            db.transaction((tx) => {
                let tags: Array<any> = [];
                tx.executeSql(query, [book, id], (tx, r) => {
                    //console.debug("getHadithTags", {r});
                    for(let i=0; i<r.rows.length; i++) {
                        let item = r.rows.item(i);
                        tags.push(item.tag);
                    }
                    resolve(tags);
                });
            });
        });
        
        return await q;
    }

    async function getTags() {
        let query = "SELECT tag from tags_list";
        const q = new Promise(resolve => {
            db.transaction((tx) => {
                let tags: Array<any> = [];
                tx.executeSql(query, [], (tx, r) => {
                    //console.debug("getTags", {r});
                    for(let i=0; i<r.rows.length; i++) {
                        let item = r.rows.item(i);
                        tags.push(item.tag);
                    }
                    resolve(tags);
                });
            });
        });

        return await q;
    }

    async function newTag(tag: string) {
        if (tag.length == 0) {return}
        const q = new Promise(resolve => {
            db.transaction((tx) => {
                let tags: Array<any> = [];
                tx.executeSql("INSERT INTO tags_list(tag) VALUES(?)", [tag], (tx, r) => {
                    resolve(r.rowsAffected == 1);
                });
            });
        })
        return await q;
    }

    async function getTagged(tags: Array<string>, translator: string = DEFAULT_TAGALOG_TRANSLATOR) {
        let prepareTags = new Array(tags.length).fill('?').join(' ');
        let query = "SELECT * FROM translations LEFT JOIN tags ON tags.hadiths_meta_rowid = translations.hadiths_meta_rowid "+
                    `WHERE tag IN (${prepareTags}) AND translator = ?`;
        return await executeSql(query, [...tags, translator], errorCB());
    }

    async function addFavorite(hadithid: string) {
        console.debug("+-addFavorite()", {hadithid});
        let [book, id] = splitHadithId(hadithid);
        console.debug({book, id});
        db.transaction((tx) => {
            let query = "INSERT INTO favorites_list(hadiths_meta_rowid) SELECT hadiths.metarowid FROM hadiths WHERE book = ? AND idint = ?";
            tx.executeSql(query, [book, id], (tx, results) => {
                //console.debug({results});
            })
        });
    }

    async function removeFavorite(hadithid: string) {
        let [book, id] = splitHadithId(hadithid);
        db.transaction((tx) => {
            let query = "DELETE FROM favorites_list WHERE hadiths_meta_rowid in (SELECT hadiths.metarowid FROM hadiths WHERE book = ? AND idint = ?)";
            tx.executeSql(query, [book, id], (tx, results) => {
            })
        });
    }

    async function getFavorites(translator = DEFAULT_TAGALOG_TRANSLATOR) {
        let query = "SELECT * FROM translations WHERE hadiths_meta_rowid IN (SELECT hadiths_meta_rowid FROM favorites) AND translator = ?";
        return await executeSql(query, [translator], errorCB());
    }

    async function getRange(book: string, ranges: Array<any> = []) {
        //console.debug("+- getRange() =>", {book, from, limit});
        console.debug("getrange ", {ranges});
        ranges = ranges.slice(1).reduce((prev, curr, currIndex) => {
            let last = prev[prev.length-1];
            if ((curr[0] - last[1]) == 1) {
                // previous END and current BEGIN has diff of 1
                last[1] = curr[1];
            } else {
                prev.push(curr);
            }

            return prev;
        }, [ranges[0]]);
        console.debug("getrange reduced ", {ranges});
        let {query, queryParams} = constructQueryRanges("SELECT * FROM translations WHERE", {book, ranges});
        return await executeSql(query, queryParams, errorCB());
    }

    async function getSelectedRanges(selected) {
        return await getSelectedRanges0(selected);
    }

    async function* getSelectedRanges0(selected) {
        for(let book in selected) {
            console.debug("getSelectedRanges0 ", {book});
            const sections: any = selected[book];
            let ranges: Array<any> = [];
            for(let sectionId in sections) {
                let section = sections[sectionId];
                ranges.push([section[SECTION_FIRST], section[SECTION_LAST]])
            }

            let gen  = await getRange(book, ranges);
            while(true) {
                let y = await gen.next();
                console.debug("getSelectedRanges0 ", {y});
                if (y.done) {
                    break;
                };
                yield(y.value);
            }
        }
    }

    async function search(params) {
        let {matchContent} = params;
        if (matchContent.length == 0) {
            return (function*(){})();//empty generator
        }
        matchContent = matchContent.split(" ").join("* ") + "*";

        if (matchContent.trim().length == 0) {
            if (!!params.selected) {
                await getSelectedRanges(params.selected);
            }
            return
        }

        let query = "SELECT * FROM translations WHERE";
        let q0a = "(content MATCH ?)";
        let queryParams;
        query =  `${query} (${q0a})`;
        queryParams = [matchContent];
        

        // append selected sections to query
        if (!!params.selected) {
            let q1 = "";
            Object.keys(params.selected).forEach(bookSection => {
                let ranges: Array<any> = [];
                Object.keys(params.selected[bookSection]).forEach(sectionId => {
                    let section: Array<any> = params.selected[bookSection][sectionId];
                    ranges.push([section[SECTION_FIRST], section[SECTION_LAST]]);
                })
                let q0 = constructQueryRanges(q1, {book: bookSection, ranges});
                q1 = q0.query;
                queryParams = [...queryParams, ...q0.queryParams];
            });
            query = `${query} AND (${q1})`;
        }  

        console.debug({query});
        console.debug({queryParams});
        
        return await executeSql(query, queryParams, errorCB());
    }

    async function searchByIDs(books: Array<string>, ids, translator: string = DEFAULT_TAGALOG_TRANSLATOR) {
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
                query = `${query} AND ${q0.join(" OR ")}`;
                let queryParams = [translator, ...books, ...ids];

                console.debug("searchByIds", {query});
                console.debug({queryParams});

                let rr: Array<any> = [];
                tx.executeSql(query, queryParams, (tx, r) => {
                        for(let i=0; i<r.rows.length; i++) {
                            let item = r.rows.item(i);
                            rr.push(Object.assign({id: `${item.book}:${item.idint}`}, item));
                        }
                        console.debug("searchByIDs results length =>", rr.length);
                        resolve({translations: rr, total: rr.length});
                    },
                    errorCB(reject));
            })
        })

        return await q;
    }

    async function getByID(id: string, translator: string = DEFAULT_TAGALOG_TRANSLATOR) {
        let [book, idint] = splitHadithId(id);
        let result = null;
        await db.transaction((tx) => {
            tx.executeSql('SELECT * FROM translations WHERE idint = ? AND translator = ? AND book = ?', [idint, translator, book], 
                (tx, r) => {
                    if (r.rows.length > 0) {
                        let item = r.row.item(0);
                        result = Object.assign({id: `${item.book}:${item.idint}`}, item);
                    }
                },
                errorCB());
        })
        return result;
    }

    async function setContent(id: string, content: string, translator: string = DEFAULT_TAGALOG_TRANSLATOR) {
        let [book, idint] = splitHadithId(id);
        let result = null;

        await db.transaction((tx) => {
            tx.executeSql('SELECT * FROM hadiths_index WHERE id = ? AND translator = ?', [id, translator], 
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

const errorCB = (cb = (e) => {}) => (err) => {
    console.error('error:', err)
    cb && cb(err)
 }
