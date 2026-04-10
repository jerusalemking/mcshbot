const mineflayer = require('mineflayer')

// =======================
// 环境变量（标准写法）
// =======================
const HOST = process.env.MC_HOST || "127.0.0.1"
const PORT = Number(process.env.MC_PORT || 25565)
const USERNAME = process.env.MC_USERNAME || "AFK_Bot"

// =======================
// 状态变量
// =======================
let bot
let ready = false
let alive = true
let lastSpeakTime = 0
let boredom = 0

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

  console.log("🔌 Connecting to:", HOST, PORT, USERNAME)

  bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME
  })

  bindEvents()
}

// =======================
// 事件绑定
// =======================
function bindEvents() {

  bot.on('spawn', () => {
    console.log('[spawn]')

    alive = true
    ready = false
    boredom = 0

    // ❗关键：spawn冷却（防 Invalid move packet）
    setTimeout(() => {
      ready = true
      console.log('[ready] stable state')

      startBehaviorLoop()
      startAutoSpeak()
    }, 15000)
  })

  bot.on('death', () => {
    console.log('[death]')
    alive = false
    ready = false
  })

  bot.on('end', () => {
    console.log('[end] reconnecting...')
    setTimeout(createBot, 5000)
  })

  bot.on('kicked', (reason) => {
    console.log('[kicked]', reason?.toString?.() || reason)
  })

  bot.on('error', (err) => {
    console.log('[error]', err)
  })
}

// =======================
// 行为系统（拟人核心）
// =======================
function startBehaviorLoop() {

  setInterval(() => {

    if (!bot.entity || !alive || !ready) return

    updateBoredom()

    const r = Math.random()

    // 70% 发呆
    if (r < 0.7) {
      idle()
    }
    // 20% 看一眼
    else if (r < 0.9) {
      lookAround()
    }
    // 10% 微动
    else {
      microTurn()
    }

  }, random(25000, 60000))
}

// =======================
// 无聊系统（核心拟人）
// =======================
function updateBoredom() {
  boredom += 0.02
  if (boredom > 1) boredom = 1
}

// =======================
// 行为1：发呆
// =======================
function idle() {
  // intentionally empty (像真人挂机)
}

// =======================
// 行为2：随机观察
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
// 行为3：轻微转头
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
// 自动说话系统（无人环境核心）
// =======================
function startAutoSpeak() {

  setInterval(() => {

    if (!bot.entity || !alive || !ready) return

    const now = Date.now()

    // ❗防刷屏
    if (now - lastSpeakTime < 60000) return

    const speakChance = boredom > 0.6 ? 0.4 : 0.15

    if (Math.random() < speakChance) {
      sayRandom()
      lastSpeakTime = now

      boredom -= 0.3
      if (boredom < 0) boredom = 0
    }

  }, random(20000, 50000))
}

// =======================
// 随机发言
// =======================
function sayRandom() {

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
// 安全look（防 invalid packet）
// =======================
function safeLook(yaw, pitch) {
  try {
    if (!ready || !bot.entity) return
    bot.look(yaw, pitch, true)
  } catch (e) {}
}

// =======================
// 工具函数
// =======================
function random(min, max) {
  return Math.floor(Math.random() * (max - min) + min)
}

// =======================
// 启动
// =======================
createBot()
