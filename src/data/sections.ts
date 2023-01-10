export const SECTION_NAME  = 0;
export const SECTION_FIRST = 1;
export const SECTION_LAST  = 2;

export const bukhariSections = require("./bukhari-sections.json");
export const bukhariSectionsList = Object.values(bukhariSections).sort((a,b) => a[SECTION_FIRST] > b[SECTION_FIRST]);

const hadithInfo = require("./hadithInfo.json");

export const books2Sections = {
    "bukhari": bukhariSections,
    "bukhari-list": bukhariSectionsList
}

export const bookNameOf = (book) => hadithInfo[book]["metadata"].name;

export const hadithSectionListOf = (book) => books2Sections[book+'-list'];

export const hadithSectionOf = (hadithId) => {
    const [book, id] = splitHadithId(hadithId);

    const sections = books2Sections[book+'-list'];
    for (let i=0; i<sections.length; i++) {
        let item = sections[i];
        if (item[SECTION_FIRST]<= id && id <= item[SECTION_LAST]) {
            return {
                title: item[SECTION_NAME],
                id: i+1
            }
        }
    }
    return {
        title: "",
        id: 0
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
        throw "invalid section type";
    }

    if (section.length != 3) {
        throw "invalid section length";
    }

    if (typeof(section[0]) != 'string') {
        throw "invalid 1st section item";
    }

    if (typeof(section[1]) != 'number') {
        throw "invalid 2nd section item";
    }

    if (typeof(section[2]) != 'number') {
        throw "invalid 3rd section item";
    }
}
