// query-data.js —— 命令行查询温湿度历史记录
// 用法：
//   node query-data.js                                    最近 20 条
//   node query-data.js --limit 50                         最近 50 条
//   node query-data.js --from "2026-10-28 00:00:00" --to "2026-10-28 23:59:59"   时间段查询

const db = require('./db');

// ---------- 解析命令行参数 ----------
function parseArgs(argv) {
    const args = { limit: 20, from: null, to: null };
    for (let i = 2; i < argv.length; i += 2) {
        const key = argv[i];
        const val = argv[i + 1];
        if (key === '--limit') args.limit = parseInt(val) || 20;
        else if (key === '--from') args.from = normalize(val, '00:00:00');
        else if (key === '--to') args.to = normalize(val, '23:59:59');
    }
    return args;
}

// 允许只写日期（如 2026-10-28），自动补全时分秒
function normalize(s, suffix) {
    return s.length === 10 ? `${s} ${suffix}` : s;
}

// ---------- 查询 ----------
const args = parseArgs(process.argv);
let rows, desc;
if (args.from && args.to) {
    rows = db.getRange(args.from, args.to);
    desc = `${args.from} ~ ${args.to}`;
} else {
    rows = db.getRecent(args.limit);
    desc = `最近 ${args.limit} 条`;
}

// ---------- 表格输出 ----------
console.log(`\n查询结果（${desc}）：共 ${rows.length} 条\n`);
console.log('ID      时间                  温度(℃)   湿度(%RH)');
console.log('-'.repeat(48));
rows.forEach(r => {
    console.log(
        String(r.id).padEnd(8) +
        String(r.time).padEnd(22) +
        String(r.temperature).padEnd(10) +
        String(r.humidity)
    );
});
if (rows.length === 0) console.log('（无数据）');
console.log('');
