export interface FocusHero {
  label: string;
  value: string;
  description: string;
  urgency: 'critical' | 'high' | 'medium';
  ksf_name?: string;
}

export interface FocusMetric {
  label: string;
  current: string;
  target: string;
  trend: 'up' | 'down' | 'flat' | 'unknown';
  color: 'green' | 'amber' | 'red' | 'blue';
}

export interface FocusPriority {
  rank: number;
  title: string;
  why: string;
  ksf_impact: string;
  estimated_minutes: number;
  category: 'strategic' | 'client' | 'team' | 'admin';
}

export interface FocusMomentum {
  streak_days: number;
  message: string;
  weekly_score: number;
}

export interface FocusPulse {
  source: string;
  label: string;
  count: number;
  urgency: 'high' | 'medium' | 'low';
  preview?: string;
}

export interface FocusBrief {
  date: string;
  hero: FocusHero;
  metrics: FocusMetric[];
  priorities: FocusPriority[];
  momentum: FocusMomentum;
  pulse: FocusPulse[];
  generated_at: string;
}
