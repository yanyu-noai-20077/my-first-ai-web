// server.js —— Express 网页服务 + 历史数据 API
// 运行：npm start，然后访问 http://localhost:3000

const express = require('express');
const path = require('path');
const db = require('./db');
const subscriber = require('./subscriber'); // 加载即启动 MQTT 订阅

const PORT = process.env.PORT || 3000;
const app = express();
const clients = new Set(); // 已连接的浏览器（SSE）

// 收到新的 MQTT 数据时，实时推送给所有打开的网页
subscriber.on('reading', data => {
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(res => res.write(msg));
});

// ---------- 页面 ----------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/history', (req, res) => {
    res.sendFile(path.join(__dirname, 'visualization_history.html'));
});

// ---------- API ----------
// 最近 N 条：/api/history?limit=50（默认 50，上限 500）
app.get('/api/history', (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    res.json(db.getRecent(limit));
});

// 时间段查询：/api/history/range?from=2026-10-28 00:00:00&to=2026-10-28 23:59:59
app.get('/api/history/range', (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) {
        return res.status(400).json({ error: '缺少 from / to 参数，格式：YYYY-MM-DD HH:mm:ss' });
    }
    res.json(db.getRange(from, to));
});

// SSE 实时推送
app.get('/events', (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.flushHeaders();
    clients.add(res);
    req.on('close', () => clients.delete(res));
});

app.listen(PORT, () => {
    console.log(`[HTTP] 服务已启动`);
    console.log(`[HTTP] 实时仪表盘：http://localhost:${PORT}`);
    console.log(`[HTTP] 历史曲线图：http://localhost:${PORT}/history`);
});
