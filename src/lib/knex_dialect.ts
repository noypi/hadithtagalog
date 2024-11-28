/**
 * code from: patterned from: 
 * https://github.com/expo/knex-expo-sqlite-dialect/blob/main/packages/knex-expo-sqlite-dialect/index.js
 */
import ClientSQLite3 from 'knex/lib/dialects/sqlite3';

class ClientExpoSQLite extends ClientSQLite3 {
    _driver() {
        return require('react-native-sqlite-2').default;
    }

    async acquireRawConnection() {
        const openDatabaseAsync = this.driver.openDatabase;
        const conn = openDatabaseAsync('SQLite/' + this.connectionSettings.filename);
        return conn;
    }

    async destroyRawConnection(connection) {
        await connection.closeAsync();
    }

    async _query(connection, obj) {
        if (!obj.sql) throw new Error('The query is empty');
        if (!connection) {
            throw new Error('No connection provided');
        }
        const { method } = obj;
        let expectReturning = true;
        switch (method) {
            case 'insert':
            case 'update':
                expectReturning = obj.returning;
                break;
            case 'counter':
            case 'del':
                expectReturning = false;
                break;
            default:
                expectReturning = true;
        }

        if (expectReturning) {
            const read_only = false;
            response = await this._exec_async(connection, obj.sql, obj.bindings, read_only);
            obj.response = response;
            return obj;
        } else {
            const read_only = false;
            const response = await this._exec_async(connection, obj.sql, obj.bindings, read_only);
            console.log('dialect', { response });
            obj.response = response[0];
            obj.context = {
                lastID: response.lastInsertRowid,
                changes: response.changes,
            };
            return obj;
        }
    }

    async _exec_async(connection, sql, args, read_only) {
        return new Promise((resolve, reject) => {
            connection._db.exec([{ sql, args }], read_only, (err, result) => {
                if (err) {
                    console.error(err);
                }
                const res = result[0];
                resolve(res?.rows ?? {});
            });
        })
    }

}

Object.assign(ClientExpoSQLite.prototype, {
    driverName: 'react-native-sqlite-2',
});

export default ClientExpoSQLite;
