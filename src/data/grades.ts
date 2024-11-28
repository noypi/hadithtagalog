const grades = {
    abudawud: require("./json/grades/abudawud-grades.json"),
    ibnmajah: require("./json/grades/ibnmajah-grades.json"),
    malik: require("./json/grades/malik-grades.json"),
    nasai: require("./json/grades/nasai-grades.json"),
    tirmidhi: require("./json/grades/tirmidhi-grades.json"),
}

// {"sahih": {}, "others": {}, "daif": {}, "hasan": {}, "mawdu": {},
//  "shadh": {}, "mursal": {}, "mauquf": {}, "munqar": {}, "batil": {},
//  "maqtu": {}, "isnaad": {}, "sanad": {}};

const hadithRating = {
    "sahih": 10,
    "hasan": 5,
    "shadh": 0,
    "sanad": 0,
    "isnaad": 0,
    "mursal": -1,
    "mauquf": -1,
    "maqtu": -1,
    "daif": -5,
    "others": -6,
    "munqar": -6,
    "batil": -6,
    "mawdu": -15,
};

const hadithRatingsList = Object.keys(hadithRating)
                                .map(name => ({name, rating: hadithRating[name]})) 
                                .sort((a,b) => a.rating - b.rating);

const rateGrade = (grade) => {
    let g = grade.toLowerCase();
    for(let i=0; i<hadithRatingsList.length; i++) {
        if (g.indexOf(hadithRatingsList[i].name) >= 0) {
            return hadithRatingsList[i].rating;
        }
    }

    return hadithRating["others"];
}

export const gradesRating = (grades: Array<any>) => {
    if (grades.length == 0) {
        return hadithRating["others"];
    }

    let rate = hadithRating["sahih"];
    for (let i=0; i<grades.length; i++) {
        let grade = grades[i];
        let currRate = rateGrade(grade.grade);
        if (currRate < rate) {
            rate = currRate;
        }
    }
    return rate;
}

export const gradesOf = (book, id) => {
    //console.debug("gradesOf", {book, id});
    if ("bukhari" === book || "muslim" === book) {
        return [{name: "", grade: "Sahih"}];
    }

    let gs = grades[book][id];
    //console.debug({gs});
    return gs;
}
