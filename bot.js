const mineflayer = require('mineflayer')

// =======================
// Bot实例
// =======================
let bot

// =======================
// 状态控制
// =======================
let ready = false
let alive = true
let lastSpeakTime = 0
let boredom = 0

// =======================
// 随机话术库（可自行扩展）
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
// 启动Bot
// =======================
function createBot() {
  bot = mineflayer.createBot({
    host: process.env.HOST,
    port: process.env.PORT,
    username: process.env.USERNAME
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

    // ❗关键：spawn后必须冷却，否则容易 invalid move packet
    setTimeout(() => {
      ready = true
      console.log('[ready] bot stable')

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

  bot.on('kicked', console.log)
  bot.on('error', console.log)
}

// =======================
// 行为系统（低频拟人）
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
    // 10% 微动作
    else {
      microTurn()
    }

  }, random(25000, 60000)) // 非固定节奏
}

// =======================
// 无聊值系统（核心拟人点）
// =======================
function updateBoredom() {
  boredom += 0.02
  if (boredom > 1) boredom = 1
}

// =======================
// 行为1：发呆（最重要）
// =======================
function idle() {
  // 故意什么都不做
}

// =======================
// 行为2：随机看方向
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
// 行为3：轻微转头（人类微操作）
// =======================
function microTurn() {
  if (!bot.entity) return

  const yaw =
    bot.entity.yaw + (Math.random() - 0.5) * 0.6

  const pitch =
    bot.entity.pitch + (Math.random() - 0.5) * 0.1

  safeLook(yaw, pitch)

  boredom -= 0.05
  if (boredom < 0) boredom = 0
}

// =======================
// 自动说话系统（核心需求）
// =======================
function startAutoSpeak() {
  setInterval(() => {

    if (!bot.entity || !alive || !ready) return

    const now = Date.now()

    // ❗防刷屏（最低60秒间隔）
    if (now - lastSpeakTime < 60000) return

    const chance = Math.random()

    // ❗基础概率 + 无聊驱动
    const speakChance = boredom > 0.6 ? 0.4 : 0.15

    if (chance < speakChance) {
      sayRandom()
      lastSpeakTime = now
      boredom -= 0.3
      if (boredom < 0) boredom = 0
    }

  }, random(20000, 50000))
}

// =======================
// 发言函数
// =======================
function sayRandom() {
  if (!bot || !bot.chat) return

  let msg

  // 避免重复
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
