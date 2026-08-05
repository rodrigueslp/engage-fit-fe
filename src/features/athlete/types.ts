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
};

export type AthleteWorkout = Workout & { box_name: string };
