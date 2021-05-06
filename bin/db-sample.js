import mysql from 'mysql2';

const pool = mysql.createPool({
    host: '',
    user: '',
    password: '',
    database: '',
    connectionLimit: 10
})

const promisePool = pool.promise();

export default promisePool