import React, { useMemo, useState } from "react";

export function split_hadith_id(hadith_id) {
    let ss = hadith_id.split(":");
    return [ss[0], parseInt(ss[1])];
}

export function book_of(hadith_id) {
    return split_hadith_id(hadith_id)[0];
}

export function id_of(hadith_id) {
    return split_hadith_id(hadith_id)[1];
}

export function computed_property<T>(watch_source) {
    return useMemo<T>(() => watch_source, [watch_source]);
}

export function watch<T>(watch_source: unknown, cb: (val) => T) {
    let memoized;
    memoized = useMemo(() => cb(watch_source), [watch_source]);
    return memoized;
}

export function ref<T>(initial?: T): Record<'value', T> {
    const [t, setT] = useState(initial);
    const o = { value: undefined };
    Object.defineProperty(o, 'value', {
        get() {
            return t;
        },
        set(value) {
            setT(value)
        },
    });

    return o;
}