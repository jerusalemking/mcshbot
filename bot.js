const mineflayer = require('mineflayer');

// ===== 环境变量 =====
const HOST = process.env.MC_HOST || "127.0.0.1";
const PORT = parseInt(process.env.MC_PORT || "25565");
const USERNAME = process.env.MC_USERNAME || "AFK_Bot";

let reconnectCount = 0;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function startBot() {
  console.log("🚀 启动Bot...");

  const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME
  });

  // 登录成功
  bot.on('login', () => console.log("🔐 登录成功"));

  // 进入世界
  bot.on('spawn', () => {
    console.log("✅ 已进入服务器");
    reconnectCount = 0;

    // 🧠 防AFK核心行为
    const loop = setInterval(() => {
      const r = Math.random();

      if (r < 0.25) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 400);
      }
      else if (r < 0.5) {
        bot.setControlState('forward', true);
        setTimeout(() => bot.setControlState('forward', false), 600);
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

    // 🧨 防假死（30分钟刷新）
    setTimeout(() => {
      console.log("🧨 watchdog重启");
      clearInterval(loop);
      bot.quit();
    }, 1000 * 60 * 30);
  });

  // ❌ 掉线重连（指数退避）
  bot.on('end', async () => {
    reconnectCount++;

    const delay = Math.min(60000, 2000 * reconnectCount * reconnectCount);

    console.log(`❌ 掉线，第${reconnectCount}次，${delay}ms后重连`);

    await sleep(delay);
    startBot();
  });

  // ⚠️ 错误
  bot.on('error', (err) => {
    console.log("⚠️ error:", err.message);
  });

  // ❗ spawn失败检测
  setTimeout(() => {
    if (!bot.entity) {
      console.log("❌ spawn失败，重启");
      bot.quit();
    }
  }, 15000);
}

startBot();
