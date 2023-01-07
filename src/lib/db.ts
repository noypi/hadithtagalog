'strict';

import SQLite from 'react-native-sqlite-storage';
import {SECTION_FIRST, SECTION_LAST} from '@data';

const DEFAULT_TAGALOG_TRANSLATOR = "google_tl";
export const QUERY_STEP = 25;

export const openHadithsDb: any = async (name: string, readOnly: boolean = true) => {
    // createFromLocation: 1 => if using ~www/
    const db = await SQLite.openDatabase({name, createFromLocation: 1, readOnly},_ => {}, errorCB)
    
    const api = {
        addFavorite,
        removeFavorite,
        getFavorites,
        getRange,
        getSelectedRanges,
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
            let results: Array<any> = [];
            for(let i=0; i<r.rows.length; i++) {
                let item = r.rows.item(i);
                item = Object.assign({id: `${item.book}:${item.idint}`}, item);
                //console.debug("executeSql=>", {item});
                if (item.book && item.idint && item.content) {
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
                db.transaction(async (tx) => {
                    tx.executeSql(query0, queryParams, handleResults(r => {
                        //console.debug({r});
                        if (r.length < step) {
                            done = true;
                        }
                        offset += QUERY_STEP;
                        resolve(r);
                    }));
                })
            });
            let rr = await q;
            console.debug("yielding rr.length =>", rr.length);
            yield(rr);
        }
    }

    async function addFavorite(id: string) {
        db.transaction((tx) => {
            let query = "INSERT INTO favorites_list(favorites_id) VALUES(?)";
            tx.executeSql(query, [id], (tx, results) => {
            })
        });
    }

    async function removeFavorite(id: string) {
        db.transaction((tx) => {
            let query = "DELETE FROM favorites_list WHERE favorites_id = ?";
            tx.executeSql(query, [id], (tx, results) => {
            })
        });
    }

    async function getFavorites(onResult, onDone) {
        let query = "SELECT * from hadiths WHERE favorites_id IS NOT NULL";
        const q = new Promise((resolve, reject) => {
            db.transaction((tx) => {
                executeSql(tx, query, [], err => {
                    errorCB(err);
                    reject(err);
                });
            })
        })
        await q;
        onDone();
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
        let {query, queryParams} = constructQueryRanges("SELECT * from translations WHERE", {book, ranges});
        return await executeSql(query, queryParams, errorCB);
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
        let {book, matchContent, matchIds} = Object.assign({book: "", matchContent: "*", matchIds: []}, params);
        matchIds = matchIds.map(v => parseInt(v));
        matchContent = matchContent.split(" ").join("* ") + "*";

        if (matchContent.trim().length == 0) {
            if (!!params.selected) {
                await getSelectedRanges(params.selected);
            }
            return
        }

        let query = "SELECT * from translations WHERE";
        let q0a = "(content MATCH ?)";
        let q0b = (new Array(matchIds.length)).fill("idint = ?").join(" OR ");
        let queryParams;
        if (matchIds.length > 0) {
            if (!params.selected) {
                query = `${query} ${q0b} UNION ${query} ${q0a}`;
                queryParams = [...matchIds, matchContent];
            } else {
                query = `${query} (${q0a})`;
                queryParams = [matchContent];
            }            
        } else {
            query =  `${query} (${q0a})`;
            queryParams = [matchContent];
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
                let q0 = constructQueryRanges(q1, {book: bookSection, ranges});
                q1 = q0.query;
                queryParams = [...queryParams, ...q0.queryParams];
            });
            query = `${query} AND (${q1})`;
        }  

        console.debug({query});
        console.debug({queryParams});
        
        return await executeSql(query, queryParams, errorCB);
    }

    async function getByID(id: string, translator: string = DEFAULT_TAGALOG_TRANSLATOR) {
        let [book, idint] = splitHadithId(id);
        let result = null;
        await db.transaction((tx) => {
            tx.executeSql('SELECT * FROM translations WHERE idint = ? AND translator = ? AND book = ?', [idint, translator, book], 
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
        let [book, idint] = splitHadithId(id);
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
