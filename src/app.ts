import { Converter } from 'opencc-js';
import configs from './configs';
import { getUser, registerObservers } from './services';
import { logger, parseArgs } from './lib';
import TelegramBot from 'node-telegram-bot-api';
import {
  alarmCreationHandler,
  alarmRemoveHandler,
  callmeHandler,
  dosageHandler,
  helpHandler,
  takeHandler,
  timezoneHandler,
  type MessageInfo,
} from './handlers';

const convertCC = Converter({ from: 'hk', to: 'cn' });
const { botToken, botUserName } = configs;

registerObservers();

if (!botToken) {
  logger.error('No token.');
  throw 'Please add your bot token to the env.';
}

setTimeout(() => {
  const bot = new TelegramBot(botToken, { polling: true });
  logger.info('Bot running.');

  bot.on('message', async msg => {
    // console.log(msg);
    const { id: uid, first_name, last_name } = msg.from ?? {};
    const { id: chatId, type } = msg.chat ?? {};
    const { text = '', message_id } = msg ?? {};
    if (!uid) {
      return 0;
    }

    try {
      const user = await getUser(`${uid}`, first_name);
      const nickname = user.nickname ?? '大哥哥';

      const info: MessageInfo = {
        user,
        nickname,
        uid,
        first_name,
        last_name,
        chatId,
        message_id,
      };

      if (
        type === 'private' ||
        text.match(new RegExp(`@${botUserName}`)) ||
        text.match(/^\//)
      ) {
        const args = parseArgs(
          text.replace(new RegExp(` *@${botUserName} *`), ''),
        );
        // console.log(args);

        if (args?.length) {
          if (convertCC(args[0]).match(/叫我/)) {
            const newNickname = args[1] ?? '大哥哥';
            return await callmeHandler(bot, info, { newNickname });
          }

          if (convertCC(args[0]).match(/(时区|utc|gmt)/i)) {
            const timezone = args[1];
            return await timezoneHandler(bot, info, { timezone });
          }

          if (convertCC(args[0]).match(/(次数|dosage)/i)) {
            const dosage = args[1];
            return await dosageHandler(bot, info, { dosage });
          }

          if (convertCC(args[0]).match(/(提醒|alarm|schedule)/i)) {
            const time = args[1];
            return await alarmCreationHandler(bot, info, { time });
          }

          if (convertCC(args[0]).match(/(取消|移除|remove|delete)/i)) {
            const time = args[1];
            return await alarmRemoveHandler(bot, info, { time });
          }

          if (convertCC(args[0]).match(/(吃药|take|medicine|pill)/i)) {
            return await takeHandler(bot, info);
          }

          if (convertCC(args[0]).match(/(帮助|help|start)/)) {
            return await helpHandler(bot, info);
          }
        }
      }
    } catch (error) {
      return logger.error((error as Error)?.message ?? error);
    }
  });
}, 3000);
