import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const time = dayjs('12:00', 'hh:mm').utc().utcOffset(8);

console.log(time.format());
