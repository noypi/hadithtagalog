export const splitHadithId = (hadithId) => {
    //console.debug("splitHadithId", {hadithId});
    let ss = hadithId.split(":");
    return [ss[0], parseInt(ss[1])];
}

export const bookOf = (hadithId) => splitHadithId(hadithId)[0];

export const idOf = (hadithId) => splitHadithId(hadithId)[1];