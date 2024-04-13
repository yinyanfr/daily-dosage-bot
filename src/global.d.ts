interface User {
  docId: string;
  uid: string;
  first_name?: string;
  nickname?: string;
  message?: string;
  timezone?: number;
  dosage?: number;
  dosageTaken?: number;
}

interface Alarm {
  docId: string;
  uid: string;
  time: Date;
  nextTime: Date;
}
