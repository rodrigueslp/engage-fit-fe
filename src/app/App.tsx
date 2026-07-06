import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { clearToken, getToken } from '../features/api/client';
import { api } from '../features/api/endpoints';
import type { Box, CurrentUser } from '../features/api/types';
import { AutomationPage } from '../pages/automation/AutomationPage';
import { CampaignsPage } from '../pages/campaigns/CampaignsPage';
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

export type PageKey = 'showcase' | 'dashboard' | 'campaigns' | 'rewards' | 'students' | 'imports' | 'whatsapp' | 'workouts' | 'email' | 'automation' | 'reports' | 'settings';

const pageKeys: PageKey[] = ['showcase', 'dashboard', 'campaigns', 'rewards', 'students', 'imports', 'whatsapp', 'workouts', 'email', 'automation', 'reports', 'settings'];

function pageFromHash(): PageKey {
  const hashPage = window.location.hash.replace(/^#\/?/, '');
  return pageKeys.includes(hashPage as PageKey) ? (hashPage as PageKey) : 'dashboard';
}

export function App() {
  const [page, setPage] = useState<PageKey>(pageFromHash);
  const [user, setUser] = useState<CurrentUser>();
  const [box, setBox] = useState<Box>();
  const [checkingSession, setCheckingSession] = useState(true);

  async function loadSession() {
    if (!getToken()) {
      setCheckingSession(false);
      return;
    }
    try {
      const [currentUser, currentBox] = await Promise.all([api.me(), api.box()]);
      setUser(currentUser);
      setBox(currentBox);
    } catch {
      clearToken();
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
    clearToken();
    setUser(undefined);
    setBox(undefined);
  }

  function navigate(nextPage: PageKey) {
    setPage(nextPage);
    window.location.hash = nextPage;
  }

  return (
    <AppLayout currentPage={page} onNavigate={navigate} box={box} user={user} onLogout={logout}>
      {page === 'dashboard' && <DashboardPage />}
      {page === 'campaigns' && <CampaignsPage />}
      {page === 'rewards' && <RewardsPage />}
      {page === 'students' && <StudentsPage />}
      {page === 'imports' && <ImportsPage />}
      {page === 'whatsapp' && <WhatsappPage />}
      {page === 'workouts' && <WorkoutsPage />}
      {page === 'email' && <EmailPage />}
      {page === 'automation' && <AutomationPage />}
      {page === 'reports' && <ReportsPage />}
      {page === 'settings' && <SettingsPage />}
    </AppLayout>
  );
}
