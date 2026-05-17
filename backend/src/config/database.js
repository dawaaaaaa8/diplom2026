const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'diplom',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'mypassword',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Query function
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`📊 Executed query: ${text} (${duration}ms)`);
        return result;
    } catch (error) {
        console.error('❌ Query error:', error);
        throw error;
    }
};

module.exports = {
    query,
    pool
};