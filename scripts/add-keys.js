require('dotenv').config();
const KeyDatabase = require('../js/database');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.db || './data/keys.db';
const db = new KeyDatabase(dbPath);

function addKeysFromFile(filePath, type) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Файл не найден: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const keys = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));

  if (keys.length === 0) {
    console.log('⚠️  Файл не содержит ключей');
    return;
  }

  console.log(`📝 Найдено ключей: ${keys.length}`);

  let count = 0;
  if (type === 'trial') {
    count = db.addTrialKeys(keys);
    console.log(`✓ Добавлено пробных ключей: ${count} из ${keys.length}`);
  } else if (type === 'paid') {
    count = db.addPaidKeys(keys);
    console.log(`✓ Добавлено платных ключей: ${count} из ${keys.length}`);
  }
}

function showStats() {
  const stats = db.getStats();
  console.log('\n📊 Статистика ключей:');
  console.log('─────────────────────────────────────');
  console.log(`Пробные ключи:`);
  console.log(`  Всего: ${stats.trial.total}`);
  console.log(`  Использовано: ${stats.trial.used}`);
  console.log(`  Доступно: ${stats.trial.available}`);
  console.log('─────────────────────────────────────');
  console.log(`Платные ключи:`);
  console.log(`  Всего: ${stats.paid.total}`);
  console.log(`  Использовано: ${stats.paid.used}`);
  console.log(`  Доступно: ${stats.paid.available}`);
  console.log('─────────────────────────────────────\n');
}

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === 'stats') {
  showStats();
  db.close();
  process.exit(0);
}

const command = args[0];
const filePath = args[1];

if (!filePath) {
  console.log('Использование:');
  console.log('  node scripts/add-keys.js trial <путь_к_файлу>   - добавить пробные ключи');
  console.log('  node scripts/add-keys.js paid <путь_к_файлу>    - добавить платные ключи');
  console.log('  node scripts/add-keys.js stats                  - показать статистику');
  db.close();
  process.exit(1);
}

if (command === 'trial') {
  addKeysFromFile(filePath, 'trial');
  showStats();
} else if (command === 'paid') {
  addKeysFromFile(filePath, 'paid');
  showStats();
} else {
  console.error('❌ Неизвестная команда. Используйте: trial, paid или stats');
}

db.close();
