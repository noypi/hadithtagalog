export const SECTION_FIRST = 0;
export const SECTION_LAST  = 1;

const bukhariSectionsOffset = require("./bukhari-sections.json");
const bukhariSectionName_tagalog = require("./bukhari-sections-name_tagalog.json");
const bukhariSectionName_english = require("./bukhari-sections-name_english.json");
const bukhariSectionsOffsetSorted = Object.values(bukhariSectionsOffset).sort((a,b) => a[SECTION_FIRST] > b[SECTION_FIRST]);

const bookname = require("./bookname.json");

const booksSectionsOffset = {
    "bukhari": bukhariSectionsOffsetSorted
}

export const books2SectionName = {
    "bukhari": {
        "fil": bukhariSectionName_tagalog,
        "eng": bukhariSectionName_english
    }
}

export const bookNameOf = (book) => bookname[book];

const hadithSectionIdOf = (book, id) => {
    //console.debug("hadithSectionIdOf", {book, id});
    const ls = booksSectionsOffset[book];
    //console.debug({ls});
    for (let i=0; i<ls.length; i++) {
        let item = ls[i];
        if (item[SECTION_FIRST]<= id && id <= item[SECTION_LAST]) {
            return i+1
        }
    }
    return 0
}

export const hadithSectionOffsets = (book) => booksSectionsOffset[book];

export const hadithSectionNameOf = (book, sectionId, lang = $$LOCALE) => {
    //console.debug("hadithSectionNameOf", {book, sectionId, lang});
    const bynames = books2SectionName[book][lang];
    //console.debug({bynames});
    return bynames[sectionId];
}

export const hadithSectionInfoOf = (hadithId, lang = $$LOCALE) => {
    const [book, id] = splitHadithId(hadithId);

    const bynames = books2SectionName[book][lang];
    
    const sectionId = hadithSectionIdOf(book, id);
    const title = hadithSectionNameOf(book, sectionId);

    return {
        title,
        id: sectionId
    }
}

// see filterReadyFormat
export const createFilter = (obj: any) => {
    // returns true if hadithId is valid
    return function filter(hadithId) {
        const [book, id] = splitHadithId(hadithId);
        const sectionsMap = obj[book];
        for(const sectionId in sectionsMap) {
            const section = sectionsMap[sectionId];
            if (section[SECTION_FIRST]<= id && id <= section[SECTION_LAST]) {
                // found;
                return true;
            }
        }
        return false;
    }
}

export const pushFilterReadyFormat = (obj: any, book: string, sectionId:number, section: Array<any>) => {
    if (!obj.hasOwnProperty(book)) {
        obj[book] = {};
    }

    validateSection(section);
    obj[book][sectionId] = section;

    return obj;
}

export const deleteFromFilterReadyFormat = (obj: any, book: string, sectionId: number) => {
    delete obj[book][sectionId];
    if (Object.keys(obj[book]).length == 0) {
        delete obj[book];
    }
}

function validateSection(section) {
    if (!Array.isArray(section)) {
        throw "validateSection(), invalid section type";
    }

    if (section.length != 2) {
        throw "validateSection(), invalid section length";
    }

    if (typeof(section[0]) != 'number') {
        throw "validateSection(), invalid 2nd section item";
    }

    if (typeof(section[1]) != 'number') {
        throw "validateSection(), invalid 3rd section item";
    }
}
