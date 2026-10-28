// db.js —— SQLite 数据库层（使用 Node 内置 node:sqlite，无需额外依赖）
// 数据库文件：项目根目录下 iot_data.db

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'iot_data.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS readings (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        temperature REAL NOT NULL,
        humidity    REAL NOT NULL,
        created_at  TEXT NOT NULL
    )
`);

// 当前本地时间，格式 YYYY-MM-DD HH:mm:ss（便于时间段查询）
function now() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
           `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const insertStmt = db.prepare(
    'INSERT INTO readings (temperature, humidity, created_at) VALUES (?, ?, ?)'
);

// 写入一条数据，返回 { temperature, humidity, time }
function insertReading(temperature, humidity) {
    const time = now();
    insertStmt.run(temperature, humidity, time);
    return { temperature, humidity, time };
}

// 批量插入（用于模拟数据脚本），rows: [{ temperature, humidity, time }]
function insertReadingsBatch(rows) {
    db.exec('BEGIN');
    try {
        const stmt = db.prepare(
            'INSERT INTO readings (temperature, humidity, created_at) VALUES (?, ?, ?)'
        );
        for (const r of rows) stmt.run(r.temperature, r.humidity, r.time);
        db.exec('COMMIT');
    } catch (e) {
        db.exec('ROLLBACK');
        throw e;
    }
}

// 最近 N 条（按时间倒序）
function getRecent(limit = 50) {
    return db.prepare(
        'SELECT id, temperature, humidity, created_at AS time FROM readings ORDER BY id DESC LIMIT ?'
    ).all(limit);
}

// 按时间段查询（按时间正序），from/to 格式：YYYY-MM-DD HH:mm:ss
function getRange(from, to) {
    return db.prepare(
        'SELECT id, temperature, humidity, created_at AS time FROM readings WHERE created_at BETWEEN ? AND ? ORDER BY id ASC'
    ).all(from, to);
}

module.exports = { insertReading, insertReadingsBatch, getRecent, getRange };
