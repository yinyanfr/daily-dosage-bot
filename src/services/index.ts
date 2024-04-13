import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import serviceAccount from '../../serviceAccountKey.json';
import { getFirestore } from 'firebase-admin/firestore';
import { ERROR_CODE, logger } from '../lib';
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

const db = getFirestore();

let users: User[] = [];
let alarms: Alarm[] = [];

function registerObservers() {
  db.collection('users').onSnapshot(
    snapshots => {
      const data: User[] = [];
      snapshots.forEach(e => {
        data.push({ ...e.data(), docId: e.id } as User);
      });
      logger.info(`Users updated.`);
      users = [...data];
    },
    error => {
      logger.error(error);
    },
  );

  db.collection('alarms').onSnapshot(
    snapshots => {
      const data: Alarm[] = [];
      snapshots.forEach(e => {
        data.push({ ...e.data(), docId: e.id } as Alarm);
      });
      logger.info(`Alarms updated.`);
      alarms = [...data];
    },
    error => {
      logger.error(error);
    },
  );
}
registerObservers();

export async function getUser(uid: string, first_name?: string) {
  const user = users.find(e => e.uid === uid);
  if (user) {
    return user;
  }
  await db.collection('users').add({ uid, first_name });
  return { uid, first_name };
}

export async function updateUser(docId: string, data: Partial<User>) {
  await db.collection('users').doc(docId).update(data);
}

export function getAlarms(uid: string) {
  return alarms.filter(e => e.uid === uid);
}

export async function addAlarm(
  uid: string,
  time: Date | Dayjs | string,
  timezone: number = 8,
) {
  const formattedTime = dayjs(time, 'hh:mm').utc().utcOffset(timezone).format();
  const alarm = {
    uid,
    time: formattedTime,
    nextTime: formattedTime,
  };
  await db.collection('alarms').add(alarm);
  return alarm;
}

export async function scheduleNextInvoke(docId: string) {
  const alarm = alarms.find(e => e.docId === docId);
  if (alarm) {
    const nextTime = dayjs(alarm.nextTime).add(1, 'day');
    await db
      .collection('alarms')
      .doc(docId)
      .update({ nextTime: nextTime.format() });
    return nextTime;
  }
  throw new Error(ERROR_CODE.NOT_FOUND);
}

export async function removeAlarm(
  uid: string,
  time: Date | Dayjs | string,
  timezone: number = 8,
) {
  const dayjsTime = dayjs(time, 'hh:mm').utc().utcOffset(timezone);
  const alarm = alarms.find(
    e => e.uid === uid && dayjsTime.isSame(dayjs(e.time)),
  );
  if (alarm) {
    alarms = alarms.filter(e => e.docId !== alarm.docId);
    return alarm;
  }
  return false;
}
