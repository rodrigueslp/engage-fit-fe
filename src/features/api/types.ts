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
  provider: 'twilio' | 'evolution' | 'meta_cloud';
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
  audience: 'near_goal' | 'almost_there' | 'achieved' | 'inactive' | 'all';
  template_id: string;
  sent_at?: string;
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
