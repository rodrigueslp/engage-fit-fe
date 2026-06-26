import { apiDownload, apiRequest } from './client';
import type {
  Box,
  Campaign,
  CampaignGoal,
  CampaignProgress,
  CurrentUser,
  DashboardSummary,
  EligibleStudentReport,
  ImportHistory,
  LoginResponse,
  MessageCampaign,
  MessageRecipient,
  MonthlyFrequencyReport,
  SendMessageCampaignResult,
  MessageTemplate,
  Reward,
  RewardDelivery,
  Student,
  WhatsappSettings,
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
  campaignGoals: (campaignId: string) => apiRequest<CampaignGoal[]>(`/api/v1/campaigns/${campaignId}/goals`),
  createCampaignGoal: (campaignId: string, payload: { source: string; target_checkins: number }) =>
    apiRequest<CampaignGoal>(`/api/v1/campaigns/${campaignId}/goals`, {
      method: 'POST',
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
  whatsappSettings: () => apiRequest<WhatsappSettings>('/api/v1/whatsapp/settings'),
  updateWhatsappSettings: (payload: { provider: 'twilio' | 'evolution' | 'meta_cloud'; base_url: string; instance_name: string; api_key: string; enabled: boolean }) =>
    apiRequest<WhatsappSettings>('/api/v1/whatsapp/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  testWhatsappSettings: (payload?: { provider: 'twilio' | 'evolution' | 'meta_cloud'; base_url: string; instance_name: string; api_key: string; enabled: boolean }) =>
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
  messageCampaigns: () => apiRequest<MessageCampaign[]>('/api/v1/message-campaigns'),
  createMessageCampaign: (payload: { name: string; audience: string; template_id: string }) =>
    apiRequest<MessageCampaign>('/api/v1/message-campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  sendMessageCampaign: (campaignId: string) =>
    apiRequest<SendMessageCampaignResult>(`/api/v1/message-campaigns/${campaignId}/send`, {
      method: 'POST',
    }),
  messageRecipients: (campaignId: string) => apiRequest<MessageRecipient[]>(`/api/v1/message-campaigns/${campaignId}/recipients`),
  eligibleStudentsReport: () => apiRequest<EligibleStudentReport[]>('/api/v1/reports/eligible-students'),
  pendingRewardsReport: () => apiRequest<RewardDelivery[]>('/api/v1/reports/pending-rewards'),
  monthlyFrequencyReport: (month: string) => apiRequest<MonthlyFrequencyReport[]>(`/api/v1/reports/monthly-frequency?month=${month}`),
  downloadReport: (path: string) => apiDownload(path),
};
