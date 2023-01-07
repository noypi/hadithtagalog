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
	translator_id  INTEGER NOT NULL,
    fts_rowid       INTEGER NOT NULL,
    book_id         INTEGER NOT NULL,
    book_idint      INTEGER NOT NULL,
	PRIMARY KEY(fts_rowid)
);

DROP INDEX IF EXISTS translations_idx;
CREATE INDEX translations_idx ON translations_meta (
	translator_id, book_id, book_idint
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

DROP TABLE IF EXISTS favorites;
CREATE TABLE favorites (
	favorites_id	TEXT,
	PRIMARY KEY(favorites_id)
);

DROP TABLE IF EXISTS translations_fts;
CREATE VIRTUAL TABLE translations_fts USING fts4(content);

DROP VIEW IF EXISTS translations;
CREATE VIEW translations AS
SELECT  translations_fts.content as content, 
        translators_list.translator as translator,
        translations_meta.translator_id as translator_id,
        translations_meta.book_idint as idint,
        books_list.book as book, 
        books_list.rowid as book_id
    FROM translations_meta 
    LEFT JOIN translations_fts ON translations_meta.fts_rowid = translations_fts.rowid
    LEFT JOIN translators_list on translations_meta.translator_id = translators_list.rowid
    LEFT JOIN books_list on translations_meta.book_id = books_list.rowid
    LEFT JOIN hadiths_meta on translations_meta.book_idint = hadiths_meta.idint AND translations_meta.book_id = hadiths_meta.book_id;
    

DROP TRIGGER IF EXISTS translations_insert;
CREATE TRIGGER IF NOT EXISTS translations_insert INSTEAD OF INSERT ON translations
    BEGIN
    INSERT INTO translations_fts (content) VALUES (NEW.content);
    INSERT INTO translations_meta (fts_rowid, book_idint, translator_id, book_id) 
        VALUES ( last_insert_rowid(), NEW.idint,
                (SELECT translators_list.rowid FROM translators_list WHERE translators_list.translator = NEW.translator), 
                (SELECT books_list.rowid FROM books_list WHERE books_list.book = NEW.book) );
    INSERT INTO hadiths_meta(idint, book_id) 
        SELECT NEW.idint as idint, books_list.rowid as book_id FROM books_list
        WHERE NOT EXISTS(SELECT 1 FROM hadiths_meta WHERE idint = NEW.idint AND book_id = books_list.rowid);
    END;

DROP TRIGGER IF EXISTS translations_delete;
CREATE TRIGGER IF NOT EXISTS translations_delete INSTEAD OF DELETE ON translations
    BEGIN
    DELETE FROM translations_meta WHERE translations_meta.fts_rowid = OLD.book_id;
    DELETE FROM translations_fts WHERE translations_fts.rowid = OLD.book_id;
    END;

INSERT INTO books_list(book) VALUES('bukhari');
INSERT INTO translators_list(translator) VALUES('google_tl');

COMMIT;
