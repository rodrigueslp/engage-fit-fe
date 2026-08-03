export type Source = 'wellhub' | 'totalpass' | 'box_member';

export type LoginResponse = {
  access_token: string;
};

export type Capabilities = {
  whatsapp: boolean;
  email: boolean;
  automation: boolean;
  workouts: boolean;
  llm: boolean;
  billing: boolean;
};

export type CurrentUser = {
  id: string;
  box_id: string;
  name: string;
  email: string;
  role: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'COACH';
  active: boolean;
  created_at: string;
};

export type Box = {
  id: string;
  name: string;
  status: BoxStatus;
  risk_inactive_days: number;
  risk_message_cooldown_days: number;
};

export type BoxStatus = 'active' | 'suspended' | 'archived';

export type AdminBox = {
  id: string;
  name: string;
  status: BoxStatus;
  status_reason: string;
  status_changed_at?: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  created_at: string;
};

export type BillingPlan = {
  id: string;
  code: string;
  version: number;
  name: string;
  description: string;
  monthly_price_cents: number;
  currency: string;
  monthly_message_limit: number;
  daily_message_limit: number;
  per_dispatch_limit: number;
  warning_percent: number;
  grace_period_days: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type BillingCustomer = {
  id: string;
  box_id: string;
  provider: string;
  provider_customer_id?: string;
  legal_name: string;
  cpf_cnpj: string;
  email: string;
  phone: string;
  postal_code: string;
  address: string;
  address_number: string;
  complement: string;
  province: string;
  city: string;
  state: string;
  notification_disabled: boolean;
};

export type BillingSubscription = {
  id: string;
  box_id: string;
  plan_id: string;
  provider: string;
  provider_subscription_id?: string;
  status: 'trialing' | 'pending' | 'active' | 'past_due' | 'suspended' | 'canceled';
  billing_type: 'UNDEFINED' | 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  next_due_date: string;
  current_period_start?: string;
  current_period_end?: string;
  grace_until?: string;
  started_at: string;
  canceled_at?: string;
  cancel_at_period_end: boolean;
  last_reconciled_at?: string;
};

export type BillingInvoice = {
  id: string;
  status: string;
  billing_type: string;
  value_cents: number;
  net_value_cents?: number;
  due_date: string;
  confirmed_at?: string;
  received_at?: string;
  invoice_url?: string;
  bank_slip_url?: string;
  description: string;
  provider_payment_id?: string;
};

export type BillingOverview = {
  box_id: string;
  box_name: string;
  box_status: string;
  billing_access_blocked: boolean;
  billing_access_reason: string;
  customer?: BillingCustomer;
  subscription?: BillingSubscription;
  plan?: BillingPlan;
  latest_invoice?: BillingInvoice;
  invoices?: BillingInvoice[];
};

export type BillingSummary = {
  monthly_recurring_revenue_cents: number;
  active_subscriptions: number;
  past_due_subscriptions: number;
  suspended_subscriptions: number;
  canceled_subscriptions: number;
  pending_amount_cents: number;
  received_this_month_cents: number;
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
  membership_started_at?: string;
  membership_started_source?: 'manual' | 'integration' | 'first_checkin_inferred' | 'self_registration';
  anonymized_at?: string;
};

export type StudentCheckin = {
  id: string;
  student_id: string;
  checkin_date: string;
  checkin_time?: string;
  source: Source;
  entry_method: 'import' | 'manual' | 'self_service';
};

export type SelfCheckinSession = {
  token?: string;
  box_name?: string;
  expires_at: string;
};

export type AttendanceCheckin = {
  student_id: string;
  student_name?: string;
  checkin_date: string;
  already_recorded: boolean;
};

export type ContactActivationConfig = {
  box_name: string;
  activation_code: string;
  sender_phone: string;
  consent_version: string;
  consent_text: string;
};

export type ContactActivationStart = {
  whatsapp_url: string;
  expires_at: string;
};

export type ContactActivationSummary = {
  total_students: number;
  with_phone: number;
  opted_in: number;
  opted_out: number;
  pending_review: number;
  pending_sync: number;
  awaiting_message: number;
  activation_code: string;
  sender_phone: string;
  whatsapp_ready: boolean;
};

export type ContactActivation = {
  id: string;
  student_id?: string;
  student_name?: string;
  claimed_name: string;
  source: Source;
  recent_checkin_date?: string;
  is_new_student: boolean;
  phone?: string;
  match_strategy?: string;
  status: 'awaiting_message' | 'confirmed' | 'pending_sync' | 'needs_review' | 'expired' | 'cancelled';
  consented_at?: string;
  expires_at: string;
  resolved_at?: string;
  created_at: string;
};

export type EngagementLevel = 'history_insufficient' | 'healthy' | 'attention' | 'at_risk' | 'critical' | 'recovered';
export type RetentionWorkflowStatus = 'none' | 'needs_action' | 'waiting_return' | 'follow_up_due' | 'paused' | 'closed' | 'recovered' | 'historical' | 'excluded';
export type RetentionExclusionReason = 'visitor' | 'former_member' | 'long_pause' | 'outside_retention' | 'other';

export type RetentionRadarItem = {
  student_id: string;
  student_name: string;
  student_phone: string;
  source: Source;
  contact_status: Student['contact_status'];
  level: EngagementLevel;
  first_checkin?: string;
  last_checkin?: string;
  days_since_checkin?: number;
  total_checkins: number;
  recent_checkins: number;
  previous_checkins: number;
  recent_weekly_average: number;
  previous_weekly_average: number;
  drop_percentage?: number;
  signals: { code: string; message: string }[];
  last_completed_intervention?: string;
  first_return_after_action?: string;
  return_within_3_days: boolean;
  return_within_7_days: boolean;
  return_within_14_days: boolean;
  workflow_status: RetentionWorkflowStatus;
  follow_up_due_at?: string;
  last_intervention_id?: string;
  last_intervention_channel?: RetentionIntervention['channel'];
  last_intervention_status?: RetentionIntervention['status'];
  last_intervention_outcome?: RetentionIntervention['outcome'];
  last_intervention_planned_for?: string;
  last_intervention_created_at?: string;
  last_intervention_assignee_id?: string;
  last_intervention_assignee_name?: string;
  retention_monitoring_status: 'monitored' | 'excluded';
  retention_exclusion_reason?: RetentionExclusionReason;
  retention_excluded_until?: string;
  retention_excluded_at?: string;
  recommendation: {
    code: string;
    title: string;
    message: string;
  };
};

export type RetentionRules = {
  recent_start: string;
  recent_end: string;
  previous_start: string;
  previous_end: string;
  history_required_before: string;
  history_days: number;
  minimum_total_checkins: number;
  minimum_previous_checkins: number;
  attention_inactive_days: number;
  at_risk_inactive_days: number;
  critical_inactive_days: number;
  attention_drop_percentage: number;
  at_risk_drop_percentage: number;
  critical_drop_percentage: number;
  operational_inactive_days: number;
  baseline_at?: string;
};

export type RetentionReason = 'travel' | 'schedule' | 'financial' | 'motivation' | 'service' | 'health' | 'moved' | 'unknown' | 'other';

export type RetentionIntervention = {
  id: string;
  student_id: string;
  created_by_user_id: string;
  assigned_to_user_id?: string;
  assigned_to_user_name?: string;
  channel: 'whatsapp' | 'phone' | 'in_person' | 'other';
  status: 'planned' | 'completed' | 'cancelled';
  outcome?: 'contacted' | 'no_response' | 'follow_up' | 'paused' | 'not_interested' | 'other';
  reason_code?: RetentionReason;
  planned_for?: string;
  completed_at?: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type RetentionSummary = {
  period_start: string;
  period_end: string;
  needs_action: number;
  waiting_return: number;
  follow_up_due: number;
  recovered: number;
  historical_inactive: number;
  excluded: number;
  completed_interventions: number;
  return_within_3_days: number;
  return_within_7_days: number;
  return_within_14_days: number;
  median_days_to_return: number | null;
  reasons: { code: string; count: number }[];
  channels: { code: string; count: number }[];
  outcomes: { code: string; count: number }[];
};

export type OnboardingJourneyItem = {
  student_id: string;
  student_name: string;
  student_phone: string;
  source: Source;
  contact_status: Student['contact_status'];
  membership_started_at: string;
  membership_started_source: 'manual' | 'integration' | 'first_checkin_inferred' | 'self_registration';
  membership_start_confidence: 'confirmed' | 'probable';
  observation_days_before_start: number;
  day: number;
  first_checkin?: string;
  second_checkin?: string;
  last_checkin?: string;
  days_since_checkin?: number;
  checkins_first_7_days: number;
  checkins_first_14_days: number;
  checkins_first_30_days: number;
  status: 'no_first_visit' | 'needs_second_visit' | 'interrupted' | 'building_habit' | 'on_track';
  status_message: string;
  recommendation: RetentionRadarItem['recommendation'];
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

export type CheckinIngestionSource = {
  id: string;
  name: string;
  source: Source;
  enabled: boolean;
  last_ingested_at?: string;
  created_at: string;
  updated_at: string;
  token?: string;
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
