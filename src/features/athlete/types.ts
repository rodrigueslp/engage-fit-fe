import type { Workout } from '../api/types';

export type AthleteInvitation = {
  box_name: string;
  student_name: string;
  expires_at: string;
};

export type AthleteMembership = {
  id: string;
  box_id: string;
  box_name: string;
  joined_at: string;
};

export type AthleteProfile = {
  id: string;
  name: string;
  email: string;
  memberships: AthleteMembership[];
  email_verified: boolean;
};

export type AthleteResultEntry = {
  section_index: number; section_type: string; movement: string; score_type: 'time' | 'rounds_reps' | 'reps' | 'load' | 'distance' | 'calories' | 'completed';
  time_seconds?: number; rounds?: number; repetitions?: number; load_kg?: number; distance_meters?: number; calories?: number; completed?: boolean;
};
export type AthleteWorkoutResult = { id: string; workout_id: string; membership_id: string; scale: 'rx' | 'scaled' | 'adapted'; entries: AthleteResultEntry[]; rpe?: number; notes: string; performed_at: string; updated_at: string };
export type AthletePersonalRecord = { id: string; movement_key: string; movement_name: string; metric: 'load' | 'reps' | 'time'; best_value: number; unit: string; status: 'estimated' | 'confirmed'; source_result_id: string; achieved_at: string; confirmed_at?: string };
export type AthleteGuidance = { movement: string; message: string; reference_value?: number; reference_unit?: string; suggested_min?: number; suggested_max?: number };
export type AthletePersonalization = { summary: string; pacing: string; guidance: AthleteGuidance[]; generated_by: string };
export type AthleteWorkoutInsight = { id: string; provider: string; model: string; body: string; created_at: string };
export type AthleteWorkout = Workout & { box_name: string; membership_id: string; result?: AthleteWorkoutResult; personalization: AthletePersonalization };
export type SaveAthleteResult = { scale: 'rx' | 'scaled' | 'adapted'; entries: AthleteResultEntry[]; rpe: number; notes: string; performed_at?: string };
