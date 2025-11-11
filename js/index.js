require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const KeyDatabase = require('./database');
const messages = require('./messages');
const handlers = require('./handlers');

if (!process.env.token) {
  console.error('❌ Ошибка: token не установлен в .env файле');
  console.error('Получите токен у @BotFather и добавьте его в .env файл');
  process.exit(1);
}

const dbPath = process.env.db || './data/keys.db';
const db = new KeyDatabase(dbPath);

const bot = new TelegramBot(process.env.token, { polling: true });
const userStates = new Map();

console.log('🤖 Telegram Bot запущен!');
console.log('Database:', dbPath);

const stats = db.getStats();
console.log('\n📊 Статистика ключей:');
console.log(`  Пробные: ${stats.trial.available}/${stats.trial.total} доступно`);
console.log(`  Платные: ${stats.paid.available}/${stats.paid.total} доступно\n`);

bot.onText(/\/start/, (msg) => {
  handlers.handleStart(bot, msg);
});

bot.on('message', (msg) => {
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }

  const text = msg.text;

  if (text === messages.buttons.trial) {
    handlers.handleTrial(bot, db, msg);
    return;
  }

  if (text === messages.buttons.buy) {
    handlers.handleBuy(bot, msg, userStates);
    return;
  }

  handlers.handleMessage(bot, db, msg, userStates);
});

bot.on('polling_error', (error) => {
  console.error('❌ Ошибка polling:', error.message);
});

bot.on('error', (error) => {
  console.error('❌ Ошибка бота:', error.message);
});

process.on('SIGINT', () => {
  console.log('\n👋 Остановка бота...');
  bot.stopPolling();
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Остановка бота...');
  bot.stopPolling();
  db.close();
  process.exit(0);
});
