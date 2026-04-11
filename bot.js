const mineflayer = require('mineflayer')

// =======================
// 环境变量
// =======================
const HOST = process.env.MC_HOST || "darkodyssey932.mcsh.io"
const PORT = Number(process.env.MC_PORT || 25565)
const USERNAME = process.env.MC_USERNAME || "AFK_Bot"

// =======================
// 状态系统（关键升级）
// =======================
let bot

let stage = "INIT"
// INIT → STABLE → ACTIVE → CHAT_UNLOCKED

let alive = true
let lastSpeakTime = 0
let boredom = 0

let chatLocked = true

// =======================
// 话术库
// =======================
const phrases = [
  "hmm...",
  "just chilling",
  "this place is quiet",
  "lol",
  "nothing happening",
  "afk for a bit",
  "interesting...",
  "..."
]

// =======================
// 启动
// =======================
function createBot() {

  console.log("🔌 Connecting:", HOST, PORT, USERNAME)

  bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME,
    version: "1.21.4"
  })

  bindEvents()
}

// =======================
// 事件绑定
// =======================
function bindEvents() {

  bot.on('spawn', async () => {

    console.log('[spawn] INIT → STABLE')

    alive = true
    stage = "STABLE"
    chatLocked = true
    boredom = 0

    // =========================
    // ⭐ 第一阶段：世界稳定检测
    // =========================
    await waitForStableWorld()

    console.log('[stable] world confirmed')

    // =========================
    // ⭐ 第二阶段：行为激活
    // =========================
    stage = "ACTIVE"
    startBehaviorLoop()

    // =========================
    // ⭐ 第三阶段：延迟解锁聊天（关键防踢）
    // =========================
    setTimeout(() => {
      stage = "CHAT_UNLOCKED"
      chatLocked = false
      console.log('[chat] unlocked')
      startAutoSpeak()
    }, 20000)
  })

  bot.on('death', () => {
    console.log('[death]')
    alive = false
    stage = "INIT"
    chatLocked = true
  })

  bot.on('end', () => {
    console.log('[end] reconnecting...')
    setTimeout(createBot, 5000)
  })

  bot.on('kicked', (r) => {
    console.log('[kicked]', r?.toString?.() || r)
  })

  bot.on('error', (e) => {
    console.log('[error]', e)
  })
}

// =======================
// ⭐ 核心：稳定检测（防 move packet + spawn未同步）
// =======================
function waitForStableWorld() {
  return new Promise(resolve => {

    let stableTicks = 0

    const timer = setInterval(() => {

      if (!bot.entity) return
      if (!bot.entity.position) return

      stableTicks++

      // 连续稳定 2 秒以上（20 tick * 100ms）
      if (stableTicks >= 20) {
        clearInterval(timer)
        resolve()
      }

    }, 100)
  })
}

// =======================
// 行为系统（拟人核心）
// =======================
function startBehaviorLoop() {

  setInterval(() => {

    if (!bot.entity || !alive) return
    if (stage !== "ACTIVE" && stage !== "CHAT_UNLOCKED") return

    updateBoredom()

    const r = Math.random()

    if (r < 0.7) {
      idle()
    } else if (r < 0.9) {
      lookAround()
    } else {
      microTurn()
    }

  }, random(25000, 65000))
}

// =======================
// 无聊系统
// =======================
function updateBoredom() {
  boredom += 0.02
  if (boredom > 1) boredom = 1
}

// =======================
// 行为1：发呆
// =======================
function idle() {
  // intentionally empty
}

// =======================
// 行为2：观察
// =======================
function lookAround() {

  if (!bot.entity) return

  const yaw = Math.random() * Math.PI * 2
  const pitch = (Math.random() - 0.5) * 0.3

  safeLook(yaw, pitch)

  boredom -= 0.1
  if (boredom < 0) boredom = 0
}

// =======================
// 行为3：微动作
// =======================
function microTurn() {

  if (!bot.entity) return

  const yaw = bot.entity.yaw + (Math.random() - 0.5) * 0.6
  const pitch = bot.entity.pitch + (Math.random() - 0.5) * 0.1

  safeLook(yaw, pitch)

  boredom -= 0.05
  if (boredom < 0) boredom = 0
}

// =======================
// 自动说话（关键：必须解锁后才允许）
// =======================
function startAutoSpeak() {

  setInterval(() => {

    if (!bot.entity || !alive) return
    if (chatLocked) return

    const now = Date.now()

    // 防刷屏
    if (now - lastSpeakTime < 60000) return

    const chance = boredom > 0.6 ? 0.4 : 0.15

    if (Math.random() < chance) {
      sayRandom()
      lastSpeakTime = now

      boredom -= 0.3
      if (boredom < 0) boredom = 0
    }

  }, random(20000, 50000))
}

// =======================
// 发言
// =======================
function sayRandom() {

  if (chatLocked) return

  let msg

  do {
    msg = phrases[Math.floor(Math.random() * phrases.length)]
  } while (Math.random() < 0.3 && msg === phrases[0])

  try {
    bot.chat(msg)
    console.log('[chat]', msg)
  } catch (e) {}
}

// =======================
// 安全look（防 invalid move packet）
// =======================
function safeLook(yaw, pitch) {

  try {
    if (stage === "INIT") return
    if (!bot.entity) return

    bot.look(yaw, pitch, true)
  } catch (e) {}
}

// =======================
// 工具
// =======================
function random(min, max) {
  return Math.floor(Math.random() * (max - min) + min)
}

// =======================
// 启动
// =======================
createBot()
