// subscriber.js —— MQTT 温湿度订阅：收到数据后存入 SQLite，并通知 server.js 推送
// 由 server.js 加载运行，无需单独启动

const mqtt = require('mqtt');
const { EventEmitter } = require('events');
const db = require('./db');

// ================= 可修改的配置 =================
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://broker.emqx.io:1883'; // MQTT Broker 地址
const MQTT_TOPIC  = process.env.MQTT_TOPIC  || 'iot/lab/temphumi';           // 订阅主题
// ==============================================

const emitter = new EventEmitter(); // 新数据事件：emitter.emit('reading', data)

const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
    console.log(`[MQTT] 已连接 ${MQTT_BROKER}，订阅主题：${MQTT_TOPIC}`);
    mqttClient.subscribe(MQTT_TOPIC);
});

mqttClient.on('message', (topic, payload) => {
    const data = parsePayload(payload.toString());
    if (!data) {
        console.log(`[MQTT] 无法解析的消息：${payload.toString()}`);
        return;
    }
    const saved = db.insertReading(data.temperature, data.humidity);
    console.log(`[MQTT] 已入库 温度=${saved.temperature}℃ 湿度=${saved.humidity}% 时间=${saved.time}`);
    emitter.emit('reading', saved);
});

mqttClient.on('error', err => console.error('[MQTT] 连接错误：', err.message));

// 解析报文：支持 JSON {"temperature":25.3,"humidity":60} 或 CSV "25.3,60"
function parsePayload(text) {
    try {
        const obj = JSON.parse(text);
        const t = obj.temperature ?? obj.temp;
        const h = obj.humidity ?? obj.humi;
        if (t !== undefined && h !== undefined) {
            return { temperature: Number(t), humidity: Number(h) };
        }
    } catch { /* 不是 JSON，尝试 CSV */ }
    const parts = text.split(',');
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { temperature: Number(parts[0]), humidity: Number(parts[1]) };
    }
    return null;
}

module.exports = emitter;
