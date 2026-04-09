const mineflayer = require('mineflayer');

// 🧠 从环境变量读取配置
const HOST = process.env.MC_HOST;
const PORT = parseInt(process.env.MC_PORT || "25565");
const USERNAME = process.env.MC_USERNAME || "AFK_Bot";

let reconnectCount = 0;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function createBot() {
  console.log("🚀 启动Bot...");

  const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME
  });

  bot.on('spawn', () => {
    console.log("✅ 已进入服务器");

    reconnectCount = 0;

    // 🧠 随机行为（防AFK）
    const loop = setInterval(() => {
      const r = Math.random();

      if (r < 0.25) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 300);
      }

      else if (r < 0.5) {
        bot.setControlState('forward', true);
        setTimeout(() => bot.setControlState('forward', false), 500);
      }

      else if (r < 0.75) {
        bot.look(
          Math.random() * Math.PI * 2,
          Math.random() * 0.4,
          true
        );
      }

      else {
        bot.swingArm();
      }

    }, 12000);

    // 🧨 watchdog（30分钟重连）
    setTimeout(() => {
      console.log("🧨 watchdog重启");
      clearInterval(loop);
      bot.quit();
    }, 1000 * 60 * 30);
  });

  // 🔁 强化重连机制
  bot.on('end', async () => {
    reconnectCount++;

    const delay = Math.min(60000, 2000 * reconnectCount * reconnectCount);

    console.log(`❌ 掉线，第${reconnectCount}次，${delay}ms后重连`);

    await sleep(delay);
    createBot();
  });

  bot.on('error', (err) => {
    console.log("⚠️ error:", err.message);
  });

  // ❗ spawn失败检测
  setTimeout(() => {
    if (!bot.entity) {
      console.log("❌ spawn失败，重试");
      bot.quit();
    }
  }, 15000);
}

createBot();
