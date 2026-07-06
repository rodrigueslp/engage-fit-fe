import { apiDownload, apiRequest } from './client';
import type {
  Box,
  Campaign,
  CampaignGoal,
  CampaignProgress,
  CurrentUser,
  DashboardSummary,
  EligibleStudentReport,
  EmailCampaign,
  EmailCampaignPreview,
  EmailRecipient,
  EmailSettings,
  EmailTemplate,
  AutomationRun,
  AutomationSchedule,
  ImportHistory,
  LoginResponse,
  MessageCampaign,
  MessageCampaignPreview,
  MessageRecipient,
  MonthlyFrequencyReport,
  SendMessageCampaignResult,
  SendEmailCampaignResult,
  MessageTemplate,
  Reward,
  RewardDelivery,
  Student,
  WhatsappSettings,
  Workout,
  WorkoutDraft,
  WorkoutRecipient,
  SendWorkoutDraftResult,
} from './types';

export const api = {
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    }),
  me: () => apiRequest<CurrentUser>('/api/v1/auth/me'),
  box: () => apiRequest<Box>('/api/v1/box'),
  updateBox: (payload: { name: string; risk_inactive_days: number; risk_message_cooldown_days: number }) =>
    apiRequest<Box>('/api/v1/box', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  dashboardSummary: () => apiRequest<DashboardSummary>('/api/v1/dashboard/summary'),
  activeCampaigns: () => apiRequest<Campaign[]>('/api/v1/dashboard/active-campaigns'),
  nearGoalStudents: () => apiRequest<Student[]>('/api/v1/dashboard/near-goal-students'),
  atRiskStudents: () => apiRequest<Student[]>('/api/v1/dashboard/at-risk-students'),
  pendingRewards: () => apiRequest<RewardDelivery[]>('/api/v1/dashboard/pending-rewards'),
  rewardDeliveries: () => apiRequest<RewardDelivery[]>('/api/v1/rewards/deliveries'),
  markRewardDelivered: (deliveryId: string) =>
    apiRequest<void>(`/api/v1/reward-deliveries/${deliveryId}/deliver`, {
      method: 'PATCH',
    }),
  students: () => apiRequest<Student[]>('/api/v1/students'),
  updateStudentRiskStatus: (studentId: string, riskStatus: NonNullable<Student['risk_status']>) =>
    apiRequest<void>(`/api/v1/students/${studentId}/risk-status`, {
      method: 'PATCH',
      body: JSON.stringify({ risk_status: riskStatus }),
    }),
  imports: () => apiRequest<ImportHistory[]>('/api/v1/imports'),
  uploadImport: (formData: FormData) =>
    apiRequest<ImportHistory>('/api/v1/imports', {
      method: 'POST',
      body: formData,
    }),
  campaigns: () => apiRequest<Campaign[]>('/api/v1/campaigns'),
  createCampaign: (payload: Partial<Campaign>) =>
    apiRequest<Campaign>('/api/v1/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCampaign: (campaignId: string, payload: Partial<Campaign>) =>
    apiRequest<Campaign>(`/api/v1/campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  closeCampaign: (campaignId: string) =>
    apiRequest<void>(`/api/v1/campaigns/${campaignId}/close`, {
      method: 'PATCH',
    }),
  campaignGoals: (campaignId: string) => apiRequest<CampaignGoal[]>(`/api/v1/campaigns/${campaignId}/goals`),
  createCampaignGoal: (campaignId: string, payload: { source: string; target_checkins: number }) =>
    apiRequest<CampaignGoal>(`/api/v1/campaigns/${campaignId}/goals`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCampaignGoal: (campaignId: string, goalId: string, payload: { source: string; target_checkins: number }) =>
    apiRequest<CampaignGoal>(`/api/v1/campaigns/${campaignId}/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  campaignProgress: (campaignId: string) => apiRequest<CampaignProgress[]>(`/api/v1/campaigns/${campaignId}/progress`),
  recalculateCampaignProgress: (campaignId: string) =>
    apiRequest<void>(`/api/v1/campaigns/${campaignId}/recalculate-progress`, {
      method: 'POST',
    }),
  rewards: (campaignId: string) => apiRequest<Reward[]>(`/api/v1/campaigns/${campaignId}/rewards`),
  createReward: (campaignId: string, payload: { name: string; description: string; quantity: number }) =>
    apiRequest<Reward>(`/api/v1/campaigns/${campaignId}/rewards`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateReward: (rewardId: string, payload: { name: string; description: string; quantity: number }) =>
    apiRequest<Reward>(`/api/v1/rewards/${rewardId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  whatsappSettings: () => apiRequest<WhatsappSettings>('/api/v1/whatsapp/settings'),
  updateWhatsappSettings: (payload: { provider: 'twilio' | 'meta_cloud'; base_url: string; instance_name: string; api_key: string; enabled: boolean }) =>
    apiRequest<WhatsappSettings>('/api/v1/whatsapp/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  testWhatsappSettings: (payload?: { provider: 'twilio' | 'meta_cloud'; base_url: string; instance_name: string; api_key: string; enabled: boolean }) =>
    apiRequest<void>('/api/v1/whatsapp/settings/test', {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined,
    }),
  templates: () => apiRequest<MessageTemplate[]>('/api/v1/message-templates'),
  createTemplate: (payload: { name: string; content: string; content_sid: string }) =>
    apiRequest<MessageTemplate>('/api/v1/message-templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTemplate: (templateId: string, payload: { name: string; content: string; content_sid: string }) =>
    apiRequest<MessageTemplate>(`/api/v1/message-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  messageCampaigns: () => apiRequest<MessageCampaign[]>('/api/v1/message-campaigns'),
  createMessageCampaign: (payload: { name: string; campaign_id: string; audience: string; template_id: string }) =>
    apiRequest<MessageCampaign>('/api/v1/message-campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  messageCampaignPreview: (campaignId: string) => apiRequest<MessageCampaignPreview>(`/api/v1/message-campaigns/${campaignId}/preview`),
  sendMessageCampaign: (campaignId: string) =>
    apiRequest<SendMessageCampaignResult>(`/api/v1/message-campaigns/${campaignId}/send`, {
      method: 'POST',
    }),
  messageRecipients: (campaignId: string) => apiRequest<MessageRecipient[]>(`/api/v1/message-campaigns/${campaignId}/recipients`),

  emailSettings: () => apiRequest<EmailSettings>('/api/v1/email/settings'),
  updateEmailSettings: (payload: { provider: 'smtp' | 'mock'; smtp_host: string; smtp_port: number; username: string; password: string; from_email: string; from_name: string; enabled: boolean }) =>
    apiRequest<EmailSettings>('/api/v1/email/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  testEmailSettings: (payload?: { provider: 'smtp' | 'mock'; smtp_host: string; smtp_port: number; username: string; password: string; from_email: string; from_name: string; enabled: boolean }) =>
    apiRequest<void>('/api/v1/email/settings/test', {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined,
    }),
  emailTemplates: () => apiRequest<EmailTemplate[]>('/api/v1/email-templates'),
  createEmailTemplate: (payload: { name: string; subject: string; content: string }) =>
    apiRequest<EmailTemplate>('/api/v1/email-templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateEmailTemplate: (templateId: string, payload: { name: string; subject: string; content: string }) =>
    apiRequest<EmailTemplate>(`/api/v1/email-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  emailCampaigns: () => apiRequest<EmailCampaign[]>('/api/v1/email-campaigns'),
  createEmailCampaign: (payload: { name: string; campaign_id: string; audience: string; template_id: string }) =>
    apiRequest<EmailCampaign>('/api/v1/email-campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  emailCampaignPreview: (campaignId: string) => apiRequest<EmailCampaignPreview>(`/api/v1/email-campaigns/${campaignId}/preview`),
  sendEmailCampaign: (campaignId: string) =>
    apiRequest<SendEmailCampaignResult>(`/api/v1/email-campaigns/${campaignId}/send`, {
      method: 'POST',
    }),
  emailRecipients: (campaignId: string) => apiRequest<EmailRecipient[]>(`/api/v1/email-campaigns/${campaignId}/recipients`),

  workouts: () => apiRequest<Workout[]>('/api/v1/workouts'),
  createWorkout: (payload: { workout_date: string; title: string; goal: string; movements: string; coach_notes: string; status: string }) =>
    apiRequest<Workout>('/api/v1/workouts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateWorkout: (workoutId: string, payload: { workout_date: string; title: string; goal: string; movements: string; coach_notes: string; status: string }) =>
    apiRequest<Workout>(`/api/v1/workouts/${workoutId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteWorkout: (workoutId: string) =>
    apiRequest<void>(`/api/v1/workouts/${workoutId}`, {
      method: 'DELETE',
    }),
  workoutDrafts: (workoutId: string) => apiRequest<WorkoutDraft[]>(`/api/v1/workouts/${workoutId}/message-drafts`),
  generateWorkoutDraft: (workoutId: string, payload: { audience: string; campaign_id: string; student_ids?: string[] }) =>
    apiRequest<WorkoutDraft>(`/api/v1/workouts/${workoutId}/message-drafts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateWorkoutDraft: (draftId: string, payload: { approved_body: string }) =>
    apiRequest<WorkoutDraft>(`/api/v1/workout-message-drafts/${draftId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  approveWorkoutDraft: (draftId: string, payload: { approved_body: string }) =>
    apiRequest<WorkoutDraft>(`/api/v1/workout-message-drafts/${draftId}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  sendWorkoutDraft: (draftId: string) =>
    apiRequest<SendWorkoutDraftResult>(`/api/v1/workout-message-drafts/${draftId}/send`, {
      method: 'POST',
    }),
  workoutRecipients: (draftId: string) => apiRequest<WorkoutRecipient[]>(`/api/v1/workout-message-drafts/${draftId}/recipients`),

  automationRuns: () => apiRequest<AutomationRun[]>('/api/v1/automation/runs'),
  automationSchedules: () => apiRequest<AutomationSchedule[]>('/api/v1/automation/schedules'),
  createAutomationSchedule: (payload: { name: string; mode: string; run_time: string; timezone: string; days_of_week: string; allow_resend: boolean; enabled: boolean }) =>
    apiRequest<AutomationSchedule>('/api/v1/automation/schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAutomationSchedule: (scheduleId: string, payload: { name: string; mode: string; run_time: string; timezone: string; days_of_week: string; allow_resend: boolean; enabled: boolean }) =>
    apiRequest<AutomationSchedule>(`/api/v1/automation/schedules/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteAutomationSchedule: (scheduleId: string) =>
    apiRequest<void>(`/api/v1/automation/schedules/${scheduleId}`, {
      method: 'DELETE',
    }),
  runAutomationScheduleNow: (scheduleId: string) =>
    apiRequest<AutomationRun>(`/api/v1/automation/schedules/${scheduleId}/run`, {
      method: 'POST',
    }),
  eligibleStudentsReport: () => apiRequest<EligibleStudentReport[]>('/api/v1/reports/eligible-students'),
  pendingRewardsReport: () => apiRequest<RewardDelivery[]>('/api/v1/reports/pending-rewards'),
  monthlyFrequencyReport: (month: string) => apiRequest<MonthlyFrequencyReport[]>(`/api/v1/reports/monthly-frequency?month=${month}`),
  downloadReport: (path: string) => apiDownload(path),
};
