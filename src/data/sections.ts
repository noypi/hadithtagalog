export const SECTION_FIRST = 0;
export const SECTION_LAST  = 1;

const bukhariSectionsOffset = require("./json/bukhari-sections.json");
const bukhariSectionName_tagalog = require("./json/bukhari-sections-name_tagalog.json");
const bukhariSectionName_english = require("./json/bukhari-sections-name_english.json");
const bukhariSectionsOffsetSorted = Object.values(bukhariSectionsOffset).sort((a,b) => a[SECTION_FIRST] > b[SECTION_FIRST]);

const abudawudSectionName_english = require("./json/abudawud-sections-name_english.json");
const abudawudSectionName_arabic = abudawudSectionName_english;
const ibnmajahSectionName_english = require("./json/ibnmajah-sections-name_english.json");
const ibnmajahSectionName_arabic = ibnmajahSectionName_english;
const malikSectionName_english = require("./json/malik-sections-name_english.json");
const malikSectionName_arabic = malikSectionName_english;
const muslimSectionName_english = require("./json/muslim-sections-name_english.json");
const muslimSectionName_arabic = muslimSectionName_english;
const nasaiSectionName_english = require("./json/nasai-sections-name_english.json");
const nasaiSectionName_arabic = nasaiSectionName_english;
const tirmidhiSectionName_english = require("./json/tirmidhi-sections-name_english.json");
const tirmidhiSectionName_arabic = tirmidhiSectionName_english;

const bookname = require("./json/bookname.json");

const booksSectionsOffset = {
    "bukhari": bukhariSectionsOffsetSorted
}

export const books2SectionName = {
    "bukhari": {
        "fil": bukhariSectionName_tagalog,
        "eng": bukhariSectionName_english,
        "ara": bukhariSectionName_english
    },
    "abudawud": {
        "fil": abudawudSectionName_english,
        "eng": abudawudSectionName_english,
        "ara": abudawudSectionName_arabic
    },
    "ibnmajah": {
        "fil": ibnmajahSectionName_english,
        "eng": abudawudSectionName_english,
        "ara": ibnmajahSectionName_arabic
    },
    "malik": {
        "fil": malikSectionName_english,
        "eng": malikSectionName_english,
        "ara": malikSectionName_arabic
    },
    "muslim": {
        "fil": muslimSectionName_english,
        "eng": muslimSectionName_english,
        "ara": muslimSectionName_arabic
    },
    "nasai": {
        "fil": nasaiSectionName_english,
        "eng": nasaiSectionName_english,
        "ara": nasaiSectionName_arabic
    },
    "tirmidhi": {
        "fil": tirmidhiSectionName_english,
        "eng": tirmidhiSectionName_english,
        "ara": tirmidhiSectionName_arabic
    }
}

export const booksMap = bookname;
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
    if (book != 'bukhari') { return 'noname' }
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
