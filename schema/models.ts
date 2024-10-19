export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface File {
  id: number;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  publicUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  status: 'pending' | 'transcribing' | 'transcribed' | 'error';
  transcriptionId: string | null;
}

export interface Transcription {
  id: string;
  content: string | null;
  isTranscribing: boolean;
  error: string | null;
  fullTranscription: any | null; // Using 'any' for JSONB type
  createdAt: Date;
  updatedAt: Date;
  fileId: number;
  userId: string;
}
