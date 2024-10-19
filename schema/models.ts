export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface File {
  id: string;
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
  fullTranscription: FullTranscription | null;
  createdAt: Date;
  updatedAt: Date;
  fileId: string;
  userId: string;
}

export type FullTranscription = {
  results: {
    channels: Array<{
      alternatives: Array<{
        words: Array<{
          word: string;
          start: number;
          end: number;
          confidence: number;
          punctuated_word: string;
        }>;
      }>;
    }>;
    utterances: Array<{
      id: string;
      start: number;
      end: number;
      words: Array<{
        word: string;
        start: number;
        end: number;
        confidence: number;
        punctuated_word: string;
      }>;
      transcript: string;
    }>;
  };
};
