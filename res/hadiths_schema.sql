BEGIN TRANSACTION;


DROP TABLE IF EXISTS hadiths_meta;
CREATE TABLE hadiths_meta (
	idint	INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
	UNIQUE(idint, book_id)
);

DROP INDEX IF EXISTS hadiths_idx;
CREATE INDEX hadiths_idx ON hadiths_meta (
	idint, book_id
);

DROP TABLE IF EXISTS translations_meta;
CREATE TABLE translations_meta (
	translator_id   INTEGER NOT NULL,
    fts_rowid       INTEGER NOT NULL,
    hadiths_meta_rowid  INTEGER NOT NULL,
	PRIMARY KEY(fts_rowid)
);

DROP INDEX IF EXISTS translations_idx;
CREATE INDEX translations_idx ON translations_meta (
	translator_id, hadiths_meta_rowid
);

DROP TABLE IF EXISTS books_list;
CREATE TABLE books_list (
	book	TEXT NOT NULL,
	PRIMARY KEY(book)
);

DROP TABLE IF EXISTS translators_list;
CREATE TABLE translators_list (
	translator	TEXT NOT NULL,
	PRIMARY KEY(translator)
);

DROP TABLE IF EXISTS favorites_list;
CREATE TABLE favorites_list (
	hadiths_meta_rowid	INTEGER NOT NULL,
	PRIMARY KEY(hadiths_meta_rowid)
);

DROP TABLE IF EXISTS translations_fts;
CREATE VIRTUAL TABLE translations_fts USING fts4(content);

DROP VIEW IF EXISTS favorites;
CREATE VIEW favorites AS
SELECT  favorites_list.hadiths_meta_rowid,
        hadiths.idint,
        hadiths.book_id,
        hadiths.book
    FROM favorites_list
    JOIN hadiths ON hadiths.metarowid = favorites_list.hadiths_meta_rowid;

DROP VIEW IF EXISTS hadiths;
CREATE VIEW hadiths AS
SELECT  hadiths_meta.rowid as metarowid,
        hadiths_meta.idint,
        hadiths_meta.book_id,
        books_list.book
    FROM hadiths_meta
    JOIN books_list ON hadiths_meta.book_id = books_list.rowid;

DROP VIEW IF EXISTS translations;
CREATE VIEW translations AS
SELECT  translations_fts.content as content, 
        translations_fts.rowid as translation_id,
        translators_list.translator as translator,
        translations_meta.translator_id as translator_id,
        hadiths.idint as idint,
        hadiths.book as book, 
        hadiths.book_id as book_id,
        hadiths.metarowid as hadiths_meta_rowid
    FROM translations_fts 
    LEFT JOIN translations_meta ON translations_fts.rowid = translations_meta.fts_rowid
    LEFT JOIN hadiths on translations_meta.hadiths_meta_rowid = hadiths.metarowid
    LEFT JOIN translators_list on translations_meta.translator_id = translators_list.rowid
    LEFT JOIN favorites on favorites.hadiths_meta_rowid = hadiths.metarowid;


DROP TRIGGER IF EXISTS translations_insert;
CREATE TRIGGER IF NOT EXISTS translations_insert INSTEAD OF INSERT ON translations
    BEGIN
    INSERT INTO hadiths_meta(idint, book_id) 
        SELECT NEW.idint as idint, books_list.rowid as book_id FROM books_list
        WHERE NOT EXISTS(SELECT 1 FROM hadiths_meta WHERE idint = NEW.idint AND book_id = books_list.rowid)
        AND books_list.book = NEW.book;
    INSERT INTO translations_fts (content) VALUES (NEW.content);
    INSERT INTO translations_meta (fts_rowid, translator_id, hadiths_meta_rowid) 
        VALUES ( last_insert_rowid(), 
                (SELECT translators_list.rowid FROM translators_list WHERE translators_list.translator = NEW.translator), 
                (SELECT hadiths.metarowid FROM hadiths WHERE hadiths.book = NEW.book AND hadiths.idint = NEW.idint));
    END;

DROP TRIGGER IF EXISTS translations_delete;
CREATE TRIGGER IF NOT EXISTS translations_delete INSTEAD OF DELETE ON translations
    BEGIN
    DELETE FROM translations_meta WHERE translations_meta.fts_rowid = OLD.translation_id;
    DELETE FROM translations_fts WHERE translations_fts.rowid = OLD.translation_id;
    END;

INSERT INTO books_list(book) VALUES('bukhari');
INSERT INTO translators_list(translator) VALUES('google_tl');

COMMIT;
