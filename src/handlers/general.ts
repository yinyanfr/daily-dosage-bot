import { ERROR_CODE, logger } from '../lib';
import { updateUser } from '../services';
import { type MessageHandler } from './type';
import { helpText } from './help';

interface CallmeProps {
  newNickname: string;
}

export const callmeHandler: MessageHandler<CallmeProps> = async (
  bot,
  info,
  props,
) => {
  const { user, chatId, message_id, uid, first_name, last_name } = info;
  const { newNickname } = props ?? {};

  try {
    await updateUser(`${user.docId}`, { nickname: newNickname });
    await bot.sendMessage(chatId, `好的，${newNickname}`, {
      reply_to_message_id: message_id,
    });
    return logger.info(
      `${uid} - ${first_name} ${
        last_name ?? ''
      } has changed their nickname to ${newNickname}.`,
    );
  } catch (error) {
    await bot.sendMessage(chatId, (error as Error)?.message ?? '未知错误');
    return logger.error((error as Error)?.message ?? error);
  }
};

export const helpHandler: MessageHandler = async (bot, info) => {
  const { uid, first_name, last_name, chatId } = info;

  await bot.sendMessage(chatId, helpText);
  return logger.info(
    `${uid} - ${first_name} ${last_name ?? ''} consulted the help.`,
  );
};

interface TimezoneProps {
  timezone: string;
}

export const timezoneHandler: MessageHandler<TimezoneProps> = async (
  bot,
  info,
  props,
) => {
  const { user, chatId, message_id, nickname, uid, first_name, last_name } =
    info;
  const { timezone } = props ?? {};
  try {
    if (!timezone?.match(/^[+-]?[0-9][0-9]?$/)) {
      throw new Error(ERROR_CODE.INVALID_INPUT);
    }
    await updateUser(`${user.docId}`, { timezone: parseInt(timezone) });
    await bot.sendMessage(
      chatId,
      `已将${nickname}的时区设定为 UTC${timezone}。`,
      {
        reply_to_message_id: message_id,
      },
    );
    return logger.info(
      `${uid} - ${first_name} ${
        last_name ?? ''
      } has changed their timezone to ${timezone}.`,
    );
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
    let message = errorMessage;
    if (errorMessage === ERROR_CODE.INVALID_INPUT) {
      message = `请以 +-数字 的格式输入时区，如 +8，-6`;
    }
    await bot.sendMessage(chatId, message, {
      reply_to_message_id: message_id,
    });
    return logger.error((error as Error)?.message ?? error);
  }
};
