import { ERROR_CODE, logger } from '../lib';
import { addAlarm, removeAlarm, updateUser } from '../services';
import { type MessageHandler } from './type';

interface DosageProps {
  dosage: string;
}

export const dosageHandler: MessageHandler<DosageProps> = async (
  bot,
  info,
  props,
) => {
  const { user, chatId, message_id, nickname, uid, first_name, last_name } =
    info;
  const { dosage } = props ?? {};
  try {
    if (!dosage) {
      throw ERROR_CODE.INVALID_INPUT;
    }
    await updateUser(`${user.docId}`, { dosage: parseInt(dosage) });
    const message = await bot.sendMessage(
      chatId,
      `${nickname}每天要吃${parseInt(dosage)}次药。`,
    );
    await bot.pinChatMessage(chatId, message.message_id);
    return logger.info(
      `${uid} - ${first_name} ${
        last_name ?? ''
      } has set their dosage to ${parseInt(dosage)}.`,
    );
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
    let message = errorMessage;
    if (errorMessage === ERROR_CODE.INVALID_INPUT) {
      message = `请输入一个正整数`;
    }
    await bot.sendMessage(chatId, message, {
      reply_to_message_id: message_id,
    });
    return logger.error((error as Error)?.message ?? error);
  }
};

interface AlarmProps {
  time: string;
}

export const alarmCreationHandler: MessageHandler<AlarmProps> = async (
  bot,
  info,
  props,
) => {
  const { chatId, message_id, nickname, uid, first_name, last_name } = info;
  const { time } = props ?? {};
  try {
    if (!time?.match(/^([0-9][0-9]?[:：][0-9][0-9])$/)) {
      throw new Error(ERROR_CODE.INVALID_INPUT);
    }
    const alarm = await addAlarm(`${uid}`, time);
    await bot.sendMessage(
      chatId,
      `已为${nickname}设置了${time}的提醒。（提醒功能正在开发中，目前还不会发送提醒）`,
      {
        reply_to_message_id: message_id,
      },
    );
    return logger.info(
      `${uid} - ${first_name} ${
        last_name ?? ''
      } has set up an alarm at ${alarm.time}.`,
    );
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
    let message = errorMessage;
    if (errorMessage === ERROR_CODE.INVALID_INPUT) {
      message = `请以 hh:mm 的格式输入时间，如 12:00`;
    }
    await bot.sendMessage(chatId, message, {
      reply_to_message_id: message_id,
    });
    return logger.error((error as Error)?.message ?? error);
  }
};

export const alarmRemoveHandler: MessageHandler<AlarmProps> = async (
  bot,
  info,
  props,
) => {
  const { chatId, message_id, nickname, uid, first_name, last_name } = info;
  const { time } = props ?? {};
  try {
    if (!time?.match(/^([0-9][0-9]?[:：][0-9][0-9])$/)) {
      throw new Error(ERROR_CODE.INVALID_INPUT);
    }
    const alarm = await removeAlarm(`${uid}`, time);
    if (alarm) {
      await bot.sendMessage(chatId, `已为${nickname}移除了${time}的提醒。`, {
        reply_to_message_id: message_id,
      });
      return logger.info(
        `${uid} - ${first_name} ${
          last_name ?? ''
        } has removed an alarm at ${alarm.time}.`,
      );
    } else {
      throw ERROR_CODE.NOT_FOUND;
    }
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
    let message = errorMessage;
    if (errorMessage === ERROR_CODE.INVALID_INPUT) {
      message = `请以 hh:mm 的格式输入时间，如 12:00`;
    }
    if (errorMessage === ERROR_CODE.NOT_FOUND) {
      message = `未发现于${time}的提醒。`;
    }
    await bot.sendMessage(chatId, message, {
      reply_to_message_id: message_id,
    });
    return logger.error((error as Error)?.message ?? error);
  }
};

export const takeHandler: MessageHandler = async (bot, info) => {
  const { chatId, message_id, nickname, uid, first_name, last_name } = info;
  try {
    await bot.sendMessage(
      chatId,
      `${nickname}吃了一次药。(吃药相关的功能正在开发，后续版本会显示本日吃药次数)`,
      {
        reply_to_message_id: message_id,
      },
    );
    return logger.info(
      `${uid} - ${first_name} ${last_name ?? ''} has taken their medicines.`,
    );
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
    await bot.sendMessage(chatId, errorMessage, {
      reply_to_message_id: message_id,
    });
    return logger.error((error as Error)?.message ?? error);
  }
};
