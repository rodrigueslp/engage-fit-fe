export type Source = 'wellhub' | 'totalpass';

export type LoginResponse = {
  access_token: string;
};

export type Capabilities = {
  whatsapp: boolean;
  email: boolean;
  automation: boolean;
  workouts: boolean;
  llm: boolean;
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
  contact_status: 'unknown' | 'opted_in' | 'opted_out';
  contact_status_updated_at?: string;
  contact_status_source?: string;
  anonymized_at?: string;
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
  connection_mode: 'platform' | 'dedicated';
  provider: 'twilio' | 'meta_cloud';
  base_url: string;
  instance_name: string;
  has_api_key: boolean;
  updated_at?: string;
  enabled: boolean;
  platform_available: boolean;
  platform_sender?: string;
};

export type MessageTemplateType = 'ALMOST_THERE' | 'GOAL_REACHED' | 'WE_MISS_YOU';
export type MessageTemplateApprovalStatus = 'NOT_CONFIGURED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type MessageTemplate = {
  id: string;
  name: string;
  content: string;
  content_sid: string;
  template_type: MessageTemplateType;
  provider: string;
  approval_status: MessageTemplateApprovalStatus;
  language: string;
  editable: boolean;
};

export type MessageCampaign = {
  id: string;
  name: string;
  campaign_id: string;
  audience: 'near_goal' | 'almost_there' | 'achieved' | 'inactive' | 'all';
  template_id: string;
  template_type: MessageTemplateType;
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

export type OfficialWhatsappTemplatePreview = {
  type: MessageTemplateType;
  label: string;
  description: string;
  editable: boolean;
  approvalStatus: MessageTemplateApprovalStatus;
  providerTemplateId: string;
  preview: string;
};

export type MessageRecipient = {
  id: string;
  message_campaign_id: string;
  student_id: string;
  phone: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  provider_message_sid?: string;
  provider_status?: string;
  dispatch_id?: string;
  sent_at?: string;
  created_at: string;
};

export type MessagingPolicy = {
  id: string;
  scope: 'box' | 'platform';
  box_id?: string;
  daily_message_limit: number;
  monthly_message_limit: number;
  per_dispatch_limit: number;
  estimated_cost_micros_per_message: number;
  daily_cost_limit_micros: number;
  monthly_cost_limit_micros: number;
  currency: string;
  warning_percent: number;
  timezone: string;
  blocked: boolean;
  updated_at?: string;
};

export type MessagingUsage = {
  daily_accepted: number;
  daily_reserved: number;
  monthly_accepted: number;
  monthly_reserved: number;
  daily_estimated_cost_micros: number;
  daily_reserved_cost_micros: number;
  monthly_estimated_cost_micros: number;
  monthly_reserved_cost_micros: number;
};

export type MessagingPolicyWithUsage = {
  policy: MessagingPolicy;
  usage: MessagingUsage;
};

export type MessagingBoxOverview = MessagingPolicyWithUsage & {
  box_id: string;
  box_name: string;
  connection_mode: 'platform' | 'dedicated';
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
  idempotent_replay?: boolean;
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
