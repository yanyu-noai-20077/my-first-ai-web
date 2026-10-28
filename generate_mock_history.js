// generate_mock_history.js —— 生成过去 24 小时的温湿度模拟数据，批量写入 iot_data.db
// 运行：node generate_mock_history.js

const db = require('./db');

const INTERVAL_MIN = 5;                    // 每隔 5 分钟一条
const HOURS = 24;                          // 过去 24 小时
const COUNT = (HOURS * 60) / INTERVAL_MIN; // 共 288 条

// 时间格式与 db.js 一致：YYYY-MM-DD HH:mm:ss
function fmt(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
           `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const rows = [];
const now = Date.now();

for (let i = COUNT - 1; i >= 0; i--) {
    const t = new Date(now - i * INTERVAL_MIN * 60 * 1000);
    const hour = t.getHours() + t.getMinutes() / 60;

    // 温度：午后 15 点最高（约 29℃）、凌晨 3 点最低（约 19℃）的正弦曲线 + 随机波动
    const wave = Math.sin(((hour - 9) / 24) * 2 * Math.PI);
    const temperature = 24 + 5 * wave + (Math.random() - 0.5);
    // 湿度：与温度反向变化（约 50% ~ 70%）+ 随机波动
    const humidity = 60 - 10 * wave + (Math.random() - 0.5) * 4;

    rows.push({
        temperature: Math.round(temperature * 10) / 10,
        humidity: Math.round(humidity * 10) / 10,
        time: fmt(t)
    });
}

db.insertReadingsBatch(rows);
console.log(`已插入 ${rows.length} 条模拟数据（${fmt(new Date(now - HOURS * 3600 * 1000))} ~ ${fmt(new Date(now))}）`);
