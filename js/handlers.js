const messages = require('./messages');
const logger = require('./logger');

function getMainKeyboard() {
  return {
    keyboard: [
      [{ text: messages.buttons.trial }],
      [{ text: messages.buttons.buy }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, messages.welcome, {
    reply_markup: getMainKeyboard(),
    parse_mode: 'Markdown'
  });
}

function handleTrial(bot, db, msg) {
  const chatId = msg.chat.id;

  try {
    const key = db.getTrialKey();

    if (!key) {
      bot.sendMessage(chatId, messages.trialNoKeys, {
        reply_markup: getMainKeyboard(),
        parse_mode: 'Markdown'
      });
      return;
    }

    db.markTrialKeyAsUsed(key);
    logger.logTrialKey(msg.from);

    bot.sendMessage(chatId, messages.trialSuccess(key), {
      reply_markup: getMainKeyboard(),
      parse_mode: 'Markdown'
    });

    console.log(`✓ Выдан пробный ключ пользователю ${msg.from.username || chatId}`);
  } catch (error) {
    console.error('Ошибка при выдаче пробного ключа:', error);
    bot.sendMessage(chatId, messages.error, {
      reply_markup: getMainKeyboard()
    });
  }
}

function handleBuy(bot, msg, userStates) {
  const chatId = msg.chat.id;

  userStates.set(chatId, 'waiting_payment');

  bot.sendMessage(chatId, messages.buyRequest, {
    parse_mode: 'Markdown'
  });
}

function handleMessage(bot, db, msg, userStates) {
  const chatId = msg.chat.id;
  const text = msg.text;

  const userState = userStates.get(chatId);

  if (userState !== 'waiting_payment') {
    return;
  }

  if (!text || !text.includes('t.me/send?start=')) {
    bot.sendMessage(chatId, messages.invalidPayment, {
      parse_mode: 'Markdown'
    });
    return;
  }

  try {
    const key = db.getPaidKey();

    if (!key) {
      bot.sendMessage(chatId, messages.paidNoKeys, {
        reply_markup: getMainKeyboard(),
        parse_mode: 'Markdown'
      });
      userStates.delete(chatId);
      return;
    }

    db.markPaidKeyAsUsed(key);
    logger.logPaidKey(msg.from, text);

    bot.sendMessage(chatId, messages.paidSuccess(key), {
      reply_markup: getMainKeyboard(),
      parse_mode: 'Markdown'
    });

    console.log(`✓ Выдан платный ключ пользователю ${msg.from.username || chatId}`);
    userStates.delete(chatId);
  } catch (error) {
    console.error('Ошибка при выдаче платного ключа:', error);
    bot.sendMessage(chatId, messages.error, {
      reply_markup: getMainKeyboard()
    });
    userStates.delete(chatId);
  }
}

module.exports = {
  handleStart,
  handleTrial,
  handleBuy,
  handleMessage,
  getMainKeyboard
};
