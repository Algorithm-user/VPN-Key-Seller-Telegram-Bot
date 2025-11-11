const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../logs/bot.txt');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function formatDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function writeLog(message) {
  const timestamp = formatDate();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  try {
    fs.appendFileSync(LOG_FILE, logMessage, 'utf8');
  } catch (error) {
    console.error('Ошибка записи в лог файл:', error);
  }
}

function logTrialKey(user) {
  const username = user.username ? `@${user.username}` : 'без username';
  const userId = user.id;
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  const message = `TRIAL | ${username} | ID: ${userId} | ${fullName} | Получение бесплатной тестовой версии`;
  writeLog(message);
}

function logPaidKey(user, paymentLink) {
  const username = user.username ? `@${user.username}` : 'без username';
  const userId = user.id;
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  const message = `PAID | ${username} | ID: ${userId} | ${fullName} | Покупка | Чек: ${paymentLink}`;
  writeLog(message);
}

function logError(errorMessage) {
  const message = `ERROR | ${errorMessage}`;
  writeLog(message);
}

module.exports = {
  logTrialKey,
  logPaidKey,
  logError
};
