import { useMutation } from '@tanstack/react-query';

type PracticeSessionPayload = {
  user_id: string;
  page_id: string;
  file_name: string;
  started_at: string; // ISO
  duration_seconds: number;
};

export function useLogPracticeSession() {
  return useMutation({
    mutationFn: async (payload: PracticeSessionPayload) => {
      const res = await fetch('/api/practice-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });
}