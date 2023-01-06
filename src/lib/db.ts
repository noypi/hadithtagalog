'strict';

import SQLite from 'react-native-sqlite-storage';
import {SECTION_FIRST, SECTION_LAST} from '@data';

const DEFAULT_TAGALOG_TRANSLATOR = "google_tl";

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

    function executeSql(tx, query, queryParams, onResult, onDone, onError) {
        const handleResults = (onDoneResults) => (tx, results, ) => {
            console.debug("found results.rows.length =>", results.rows.length);
            for(let i=0; i<results.rows.length; i++) {
                let item = results.rows.item(i);
                if (item.id && item.content) {
                    onResult(item);
                }
            }
            onDoneResults(results.rows.length)
        };

        tx.executeSql(query + " LIMIT 10", queryParams, handleResults(resultsCount => {
            if (resultsCount == 10) {
                tx.executeSql(query + " LIMIT -1 OFFSET 10", queryParams, handleResults(_ => {
                    onDone();
                }));
            } else {
                onDone();
            }
        }));
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
                executeSql(tx, query, [], onResult, () => {
                    resolve(true);
                 }, err => {
                    errorCB(err);
                    reject(err);
                });
            })
        })
        await q;
        onDone();
    }

    async function getRange(book: string, ranges: Array<any> = [], onResult) {
        //console.debug("+- getRange() =>", {book, from, limit});
        let {query, queryParams} = constructQueryRanges("SELECT * from hadiths WHERE", {book, ranges});
        
        const q = new Promise((resolve, reject) => {
            db.transaction((tx) => {
                executeSql(tx, query, queryParams, onResult, () => {
                    resolve(true);
                 }, err => {
                    errorCB(err);
                    reject(err);
                });
            })
        })
        await q;
    }

    async function getSelectedRanges(selected, onResult, onDone) {
        for(let book in selected) {
            const sections: any = selected[book];
            let ranges: Array<any> = [];
            for(let sectionId in sections) {
                let section = sections[sectionId];
                ranges.push([section[SECTION_FIRST], section[SECTION_LAST]])
            }
            await getRange(book, ranges, onResult);
        }
        onDone();
    }

    async function search(params, onResult, onDone) {
        let {book, matchContent, matchIds} = Object.assign({book: "", matchContent: "*", matchIds: []}, params);
        matchIds = matchIds.map(v => parseInt(v));

        if (matchContent.trim().length == 0) {
            if (!!params.selected) {
                await getSelectedRanges(params.selected, onResult, onDone);
            }
            return
        }

        let query = "SELECT * from hadiths WHERE";
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
        
        const q = new Promise((resolve, reject) => {
            db.transaction((tx) => {
                executeSql(tx, query, queryParams, onResult, () => {
                    resolve(true);
                 }, err => {
                    errorCB(err);
                    reject(err);
                });
            })
        })
        await q;
        onDone();
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
