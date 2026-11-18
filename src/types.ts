export type SubjectId =
  | 'toan'
  | 'ngu-van'
  | 'tieng-anh'
  | 'khoa-hoc'
  | 'lich-su-dia-ly';

export interface SubjectInfo {
  id: SubjectId;
  name: string;
  shortDescription: string;
  starterPrompts: string[];
  sampleDocument: {
    title: string;
    content: string;
  };
}

export interface StudyDocument {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  sourceType: 'text' | 'file' | 'sample';
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: number;
  usedDocumentTitles?: string[];
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  subject: SubjectId;
  messages: ChatMessage[];
  documents: StudyDocument[];
  strictDocumentOnly: boolean;
  createdAt: number;
  updatedAt: number;
}

export type WorkspaceView = 'chat' | 'timetable';

export type WeekdayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export type SessionId = 'morning' | 'afternoon';

export interface TimetableSlot {
  id: string;
  day: WeekdayId;
  session: SessionId;
  period: number;
  timeRange: string;
  subjectName: string;
  linkedSubjectId?: SubjectId;
  room?: string;
  note?: string;
}

