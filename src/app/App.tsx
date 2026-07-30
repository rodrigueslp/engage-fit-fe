import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { api } from '../features/api/endpoints';
import type { Box, Capabilities, CurrentUser } from '../features/api/types';
import { AutomationPage } from '../pages/automation/AutomationPage';
import { CampaignsPage } from '../pages/campaigns/CampaignsPage';
import { CheckinsPage } from '../pages/checkins/CheckinsPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { EmailPage } from '../pages/email/EmailPage';
import { ImportsPage } from '../pages/imports/ImportsPage';
import { LoginPage } from '../pages/login/LoginPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { RewardsPage } from '../pages/rewards/RewardsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { StudentsPage } from '../pages/students/StudentsPage';
import { WhatsappPage } from '../pages/whatsapp/WhatsappPage';
import { WorkoutsPage } from '../pages/workouts/WorkoutsPage';
import { LoadingState } from '../components/common/State';
import { ShowcasePage } from '../pages/showcase/ShowcasePage';
import { MessagingGovernancePage } from '../pages/admin/MessagingGovernancePage';
import { BillingManagementPage } from '../pages/admin/BillingManagementPage';
import { BillingPage } from '../pages/billing/BillingPage';
import { RetentionPage } from '../pages/retention/RetentionPage';
import { TeamPage } from '../pages/team/TeamPage';

export type PageKey = 'showcase' | 'dashboard' | 'retention' | 'campaigns' | 'rewards' | 'students' | 'checkins' | 'imports' | 'whatsapp' | 'workouts' | 'email' | 'automation' | 'reports' | 'team' | 'settings' | 'billing' | 'admin-messaging' | 'admin-billing';

const pageKeys: PageKey[] = ['showcase', 'dashboard', 'retention', 'campaigns', 'rewards', 'students', 'checkins', 'imports', 'whatsapp', 'workouts', 'email', 'automation', 'reports', 'team', 'settings', 'billing', 'admin-messaging', 'admin-billing'];
const coachPages: PageKey[] = ['dashboard', 'retention', 'students', 'checkins'];

function pageFromHash(): PageKey {
  const hashPage = window.location.hash.replace(/^#\/?/, '');
  return pageKeys.includes(hashPage as PageKey) ? (hashPage as PageKey) : 'dashboard';
}

export function App() {
  const [page, setPage] = useState<PageKey>(pageFromHash);
  const [user, setUser] = useState<CurrentUser>();
  const [box, setBox] = useState<Box>();
  const [checkingSession, setCheckingSession] = useState(true);
  const [capabilities, setCapabilities] = useState<Capabilities>({ whatsapp: false, email: false, automation: false, workouts: false, llm: false, billing: false });

  async function loadSession() {
    const enabled = await api.capabilities().catch(() => ({ whatsapp: false, email: false, automation: false, workouts: false, llm: false, billing: false }));
    setCapabilities(enabled);
    try {
      const currentUser = await api.me();
      const currentBox = currentUser.role === 'PLATFORM_ADMIN' ? undefined : await api.box();
      setUser(currentUser);
      setBox(currentBox);
      if (currentUser.role === 'PLATFORM_ADMIN' && !['admin-messaging', 'admin-billing'].includes(pageFromHash())) {
        window.location.hash = 'admin-messaging';
        setPage('admin-messaging');
      }
    } catch {
      setUser(undefined);
      setBox(undefined);
    } finally {
      setCheckingSession(false);
    }
  }

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    const disabled = (page === 'whatsapp' && !capabilities.whatsapp)
      || (page === 'automation' && !capabilities.automation)
      || (page === 'email' && !capabilities.email)
      || (page === 'workouts' && !capabilities.workouts)
      || ((page === 'billing' || page === 'admin-billing') && !capabilities.billing);
    if (disabled) {
      window.location.hash = 'dashboard';
      setPage('dashboard');
    }
  }, [page, capabilities]);

  useEffect(() => {
    if (user?.role === 'COACH' && !coachPages.includes(page)) {
      window.location.hash = 'retention';
      setPage('retention');
    }
  }, [page, user]);

  useEffect(() => {
    function handleHashChange() {
      setPage(pageFromHash());
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (page === 'showcase') {
    return <ShowcasePage />;
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingState label="Abrindo EngageFit" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={loadSession} />;
  }

  function logout() {
    void api.logout().catch(() => undefined);
    setUser(undefined);
    setBox(undefined);
  }

  function navigate(nextPage: PageKey) {
    if (user?.role === 'COACH' && !coachPages.includes(nextPage)) nextPage = 'retention';
    if (nextPage === 'whatsapp' && !capabilities.whatsapp) nextPage = 'dashboard';
    if (nextPage === 'automation' && !capabilities.automation) nextPage = 'dashboard';
    if (nextPage === 'email' && !capabilities.email) nextPage = 'dashboard';
    if (nextPage === 'workouts' && !capabilities.workouts) nextPage = 'dashboard';
    if ((nextPage === 'billing' || nextPage === 'admin-billing') && !capabilities.billing) nextPage = 'dashboard';
    setPage(nextPage);
    window.location.hash = nextPage;
  }

  const renderedPage: PageKey = user.role === 'COACH' && !coachPages.includes(page) ? 'retention' : page;

  return (
    <AppLayout currentPage={renderedPage} onNavigate={navigate} box={box} user={user} onLogout={logout} capabilities={capabilities}>
      {renderedPage === 'dashboard' && <DashboardPage />}
      {renderedPage === 'retention' && <RetentionPage />}
      {renderedPage === 'campaigns' && <CampaignsPage />}
      {renderedPage === 'rewards' && <RewardsPage />}
      {renderedPage === 'students' && <StudentsPage canManagePrivacy={user.role === 'OWNER'} />}
      {renderedPage === 'checkins' && <CheckinsPage />}
      {renderedPage === 'imports' && <ImportsPage />}
      {renderedPage === 'whatsapp' && capabilities.whatsapp && <WhatsappPage />}
      {renderedPage === 'workouts' && capabilities.workouts && <WorkoutsPage />}
      {renderedPage === 'email' && capabilities.email && <EmailPage />}
      {renderedPage === 'automation' && capabilities.automation && <AutomationPage />}
      {renderedPage === 'reports' && <ReportsPage />}
      {renderedPage === 'team' && user.role === 'OWNER' && <TeamPage />}
      {renderedPage === 'settings' && <SettingsPage whatsappEnabled={capabilities.whatsapp} onSessionRevoked={() => { setUser(undefined); setBox(undefined); }} />}
      {renderedPage === 'billing' && capabilities.billing && user.role !== 'PLATFORM_ADMIN' && <BillingPage />}
      {renderedPage === 'admin-messaging' && user.role === 'PLATFORM_ADMIN' && <MessagingGovernancePage whatsappEnabled={capabilities.whatsapp} />}
      {renderedPage === 'admin-billing' && capabilities.billing && user.role === 'PLATFORM_ADMIN' && <BillingManagementPage />}
    </AppLayout>
  );
}
