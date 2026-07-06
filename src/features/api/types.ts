export type Source = 'wellhub' | 'totalpass';

export type LoginResponse = {
  access_token: string;
};

export type CurrentUser = {
  id: string;
  box_id: string;
  name: string;
  email: string;
  role: string;
};

export type Box = {
  id: string;
  name: string;
  risk_inactive_days: number;
  risk_message_cooldown_days: number;
};

export type DashboardSummary = {
  total_students: number;
  total_checkins: number;
  eligible_students: number;
  near_goal_students: number;
  at_risk_students: number;
  pending_rewards: number;
  delivered_rewards: number;
  checkins_by_platform: Record<string, number>;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: Source;
  external_id: string;
  risk_status?: 'active' | 'observing' | 'paused' | 'not_interested';
  risk_last_message_at?: string;
};

export type Campaign = {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  active: boolean;
};

export type CampaignGoal = {
  id: string;
  campaign_id: string;
  source: Source;
  target_checkins: number;
};

export type CampaignProgress = {
  id: string;
  campaign_id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  student_phone?: string;
  student_source?: Source;
  current_checkins: number;
  target_checkins: number;
  remaining_checkins: number;
  progress_percentage: number;
  achieved: boolean;
  near_goal: boolean;
};

export type Reward = {
  id: string;
  campaign_id: string;
  name: string;
  description: string;
  quantity: number;
  pending_deliveries: number;
  delivered_deliveries: number;
  available_quantity: number;
};

export type RewardDelivery = {
  id: string;
  campaign_id?: string;
  campaign_name?: string;
  reward_id: string;
  reward_name?: string;
  student_id: string;
  student_name?: string;
  student_phone?: string;
  delivered: boolean;
  delivered_at?: string;
};

export type EligibleStudentReport = {
  campaign_id: string;
  campaign_name: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  source: Source;
  current_checkins: number;
  target_checkins: number;
  remaining_checkins: number;
  progress_percentage: number;
  reward_name: string;
};

export type MonthlyFrequencyReport = {
  student_id: string;
  student_name: string;
  student_phone: string;
  source: Source;
  checkins: number;
  first_checkin: string;
  last_checkin: string;
};

export type ImportHistory = {
  id: string;
  filename: string;
  source: Source;
  total_records: number;
  students?: number;
  checkins?: number;
  imported_at: string;
};

export type WhatsappSettings = {
  id: string;
  box_id: string;
  provider: 'twilio' | 'meta_cloud';
  base_url: string;
  instance_name: string;
  has_api_key: boolean;
  updated_at?: string;
  enabled: boolean;
};

export type MessageTemplate = {
  id: string;
  name: string;
  content: string;
  content_sid: string;
};

export type MessageCampaign = {
  id: string;
  name: string;
  campaign_id: string;
  audience: 'near_goal' | 'almost_there' | 'achieved' | 'inactive' | 'all';
  template_id: string;
  sent_at?: string;
};

export type MessageCampaignPreview = {
  total: number;
  body: string;
  student_id?: string;
  student_name?: string;
  phone?: string;
};

export type SendMessageCampaignResult = {
  total: number;
  sent: number;
  failed: number;
};

export type MessageRecipient = {
  id: string;
  message_campaign_id: string;
  student_id: string;
  phone: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at?: string;
  created_at: string;
};


export type EmailSettings = {
  id: string;
  box_id: string;
  provider: 'smtp' | 'mock';
  smtp_host: string;
  smtp_port: number;
  username: string;
  from_email: string;
  from_name: string;
  has_password: boolean;
  updated_at?: string;
  enabled: boolean;
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  content: string;
};

export type EmailCampaign = {
  id: string;
  name: string;
  campaign_id: string;
  audience: 'near_goal' | 'almost_there' | 'achieved' | 'inactive' | 'all';
  template_id: string;
  sent_at?: string;
};

export type EmailCampaignPreview = {
  total: number;
  subject: string;
  body: string;
  student_id?: string;
  student_name?: string;
  email?: string;
};

export type SendEmailCampaignResult = {
  total: number;
  sent: number;
  failed: number;
};

export type EmailRecipient = {
  id: string;
  email_campaign_id: string;
  student_id: string;
  email: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at?: string;
  created_at: string;
};

export type AutomationRun = {
  id: string;
  status: 'running' | 'success' | 'failed';
  source: string;
  filename: string;
  imported: boolean;
  recalculated_campaigns: number;
  skipped_message_campaigns: number;
  sent_messages: number;
  failed_messages: number;
  error_message?: string;
  started_at: string;
  finished_at?: string;
};


export type AutomationSchedule = {
  id: string;
  name: string;
  mode: 'full_daily' | 'recalculate_only' | 'send_almost_there' | 'send_achieved' | 'send_inactive';
  run_time: string;
  timezone: string;
  days_of_week: string;
  allow_resend: boolean;
  enabled: boolean;
  last_run_at?: string;
  created_at: string;
  updated_at: string;
};

export type Workout = {
  id: string;
  workout_date: string;
  title: string;
  goal: string;
  movements: string;
  coach_notes: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
};

export type WorkoutDraft = {
  id: string;
  workout_id: string;
  campaign_id?: string;
  audience: 'near_goal' | 'almost_there' | 'achieved' | 'inactive' | 'all';
  generated_body: string;
  approved_body: string;
  status: 'draft' | 'approved' | 'sent';
  total_recipients: number;
  sent_recipients: number;
  failed_recipients: number;
  generated_at: string;
  approved_at?: string;
  sent_at?: string;
};

export type WorkoutRecipient = {
  id: string;
  workout_message_draft_id: string;
  student_id: string;
  phone: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at?: string;
  created_at: string;
};

export type SendWorkoutDraftResult = {
  total: number;
  sent: number;
  failed: number;
};

