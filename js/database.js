// Модуль для работы с базой данных SQLite
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class KeyDatabase {
  constructor(dbPath) {
    // Создаем директорию для БД, если её нет
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Подключаемся к базе данных
    this.db = new Database(dbPath);
    this.initTables();
  }

  /**
   * Инициализация таблиц базы данных
   */
  initTables() {
    // Таблица для пробных ключей
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS trial_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        is_used INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        used_at TEXT
      )
    `);

    // Таблица для платных ключей
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS paid_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        is_used INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        used_at TEXT
      )
    `);

    console.log('✓ Таблицы базы данных инициализированы');
  }

  /**
   * Добавление пробного ключа в базу данных
   * @param {string} key - VLESS ключ
   * @returns {boolean} - успех операции
   */
  addTrialKey(key) {
    try {
      const stmt = this.db.prepare('INSERT INTO trial_keys (key) VALUES (?)');
      stmt.run(key);
      return true;
    } catch (error) {
      console.error('Ошибка добавления пробного ключа:', error.message);
      return false;
    }
  }

  /**
   * Добавление платного ключа в базу данных
   * @param {string} key - VLESS ключ
   * @returns {boolean} - успех операции
   */
  addPaidKey(key) {
    try {
      const stmt = this.db.prepare('INSERT INTO paid_keys (key) VALUES (?)');
      stmt.run(key);
      return true;
    } catch (error) {
      console.error('Ошибка добавления платного ключа:', error.message);
      return false;
    }
  }

  /**
   * Массовое добавление пробных ключей
   * @param {string[]} keys - массив VLESS ключей
   * @returns {number} - количество успешно добавленных ключей
   */
  addTrialKeys(keys) {
    let count = 0;
    const stmt = this.db.prepare('INSERT INTO trial_keys (key) VALUES (?)');
    
    for (const key of keys) {
      try {
        stmt.run(key);
        count++;
      } catch (error) {
        console.error(`Ошибка добавления ключа ${key}:`, error.message);
      }
    }
    
    return count;
  }

  /**
   * Массовое добавление платных ключей
   * @param {string[]} keys - массив VLESS ключей
   * @returns {number} - количество успешно добавленных ключей
   */
  addPaidKeys(keys) {
    let count = 0;
    const stmt = this.db.prepare('INSERT INTO paid_keys (key) VALUES (?)');
    
    for (const key of keys) {
      try {
        stmt.run(key);
        count++;
      } catch (error) {
        console.error(`Ошибка добавления ключа ${key}:`, error.message);
      }
    }
    
    return count;
  }

  /**
   * Получение одного неиспользованного пробного ключа
   * @returns {string|null} - ключ или null, если ключи закончились
   */
  getTrialKey() {
    const stmt = this.db.prepare('SELECT id, key FROM trial_keys WHERE is_used = 0 LIMIT 1');
    const row = stmt.get();
    return row ? row.key : null;
  }

  /**
   * Получение одного неиспользованного платного ключа
   * @returns {string|null} - ключ или null, если ключи закончились
   */
  getPaidKey() {
    const stmt = this.db.prepare('SELECT id, key FROM paid_keys WHERE is_used = 0 LIMIT 1');
    const row = stmt.get();
    return row ? row.key : null;
  }

  /**
   * Пометка пробного ключа как использованного
   * @param {string} key - VLESS ключ
   * @returns {boolean} - успех операции
   */
  markTrialKeyAsUsed(key) {
    try {
      const stmt = this.db.prepare(
        'UPDATE trial_keys SET is_used = 1, used_at = CURRENT_TIMESTAMP WHERE key = ? AND is_used = 0'
      );
      const result = stmt.run(key);
      return result.changes > 0;
    } catch (error) {
      console.error('Ошибка пометки пробного ключа:', error.message);
      return false;
    }
  }

  /**
   * Пометка платного ключа как использованного
   * @param {string} key - VLESS ключ
   * @returns {boolean} - успех операции
   */
  markPaidKeyAsUsed(key) {
    try {
      const stmt = this.db.prepare(
        'UPDATE paid_keys SET is_used = 1, used_at = CURRENT_TIMESTAMP WHERE key = ? AND is_used = 0'
      );
      const result = stmt.run(key);
      return result.changes > 0;
    } catch (error) {
      console.error('Ошибка пометки платного ключа:', error.message);
      return false;
    }
  }

  /**
   * Получение статистики по ключам
   * @returns {object} - статистика
   */
  getStats() {
    const trialTotal = this.db.prepare('SELECT COUNT(*) as count FROM trial_keys').get().count;
    const trialUsed = this.db.prepare('SELECT COUNT(*) as count FROM trial_keys WHERE is_used = 1').get().count;
    const paidTotal = this.db.prepare('SELECT COUNT(*) as count FROM paid_keys').get().count;
    const paidUsed = this.db.prepare('SELECT COUNT(*) as count FROM paid_keys WHERE is_used = 1').get().count;

    return {
      trial: {
        total: trialTotal,
        used: trialUsed,
        available: trialTotal - trialUsed
      },
      paid: {
        total: paidTotal,
        used: paidUsed,
        available: paidTotal - paidUsed
      }
    };
  }

  /**
   * Закрытие соединения с базой данных
   */
  close() {
    this.db.close();
  }
}

module.exports = KeyDatabase;
