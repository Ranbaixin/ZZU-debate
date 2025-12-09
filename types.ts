export interface DebateStage {
  id: string;
  label: string;
  affTitle?: string;
  negTitle?: string;
  time: number; // in seconds
  type: 'setup' | 'intro' | 'sound_check' | 'normal' | 'free_debate' | 'dual_debate';
  activeSide?: 'aff' | 'neg' | 'both';
}

export interface MatchInfo {
  title: string;
  affSchool: string;
  negSchool: string;
  affTopic: string;
  negTopic: string;
  logoUrl: string | null;
}

export enum SoundType {
  WARN_30 = 'WARN_30',
  WARN_5 = 'WARN_5',
  END = 'END',
}