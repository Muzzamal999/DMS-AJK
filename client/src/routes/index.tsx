import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";
import { ROUTES } from "@/constants";
import { lazy, Suspense } from "react";
import { CitizenLayout } from "@/components/layout/CitizenLayout";
import { ClerkLayout } from "@/components/layout/ClerkLayout";

const Landing      = lazy(() => import("@/pages/landing"));
const Login        = lazy(() => import("@/pages/login"));
const Register     = lazy(() => import("@/pages/register"));
const Verify       = lazy(() => import("@/pages/verify"));
const Dashboard    = lazy(() => import("@/pages/dashboard"));
const Apply        = lazy(() => import("@/pages/apply"));
const Applications = lazy(() => import("@/pages/applications"));
const NotFound     = lazy(() => import("@/pages/not-found"));

// Admin Pages
const AdminDashboardPage    = lazy(() => import("@/pages/admin/DashboardPage"));
const AdminApplicationsPage = lazy(() => import("@/pages/admin/ApplicationsPage"));
const AdminStatusTrackerPage = lazy(() => import("@/pages/admin/StatusTrackerPage"));
const AdminDocumentWalletPage = lazy(() => import("@/pages/admin/DocumentWalletPage"));
const AdminNotificationsPage = lazy(() => import("@/pages/admin/NotificationsPage"));
const AdminSupportClerksPage = lazy(() => import("@/pages/admin/SupportClerksPage"));
const AdminPrivacyPolicyPage = lazy(() => import("@/pages/admin/PrivacyPolicyPage"));
const AdminSettingsPage     = lazy(() => import("@/pages/admin/SettingsPage"));

// Citizen Pages (wrapped with CitizenLayout)
const CitizenDashboardPage = lazy(() => import("@/pages/citizen/DashboardPage"));
const CitizenApplicationsPage = lazy(() => import("@/pages/citizen/ApplicationsPage"));
const CitizenTrackPage = lazy(() => import("@/pages/citizen/TrackPage"));
const CitizenDocumentsPage = lazy(() => import("@/pages/citizen/DocumentsPage"));
const CitizenSupportPage = lazy(() => import("@/pages/citizen/SupportPage"));
const CitizenPrivacyPolicyPage = lazy(() => import("@/pages/citizen/PrivacyPolicyPage"));
const CitizenNotificationsPage = lazy(() => import("@/pages/citizen/NotificationsPage"));
const CitizenProfilePage = lazy(() => import("@/pages/citizen/ProfilePage"));

// Clerk Pages (wrapped with ClerkLayout)
const ClerkApplicationsPage = lazy(() => import("@/pages/clerk/ApplicationsPage"));
const ClerkDocumentWalletPage = lazy(() => import("@/pages/clerk/DocumentWalletPage"));
const ClerkStatusTrackerPage = lazy(() => import("@/pages/clerk/StatusTrackerPage"));
const ClerkNotificationsPage = lazy(() => import("@/pages/clerk/NotificationsPage"));
const ClerkSupportPage = lazy(() => import("@/pages/clerk/SupportPage"));
const ClerkPrivacyPolicyPage = lazy(() => import("@/pages/clerk/PrivacyPolicyPage"));
const ClerkSettingsPage = lazy(() => import("@/pages/clerk/SettingsPage"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

interface ProtectedRouteProps {
  component: React.ComponentType;
  role?: UserRole;
}

function ProtectedRoute({ component: Component, role }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to={ROUTES.LOGIN} />;

  if (role && user?.role !== role) {
    if (user?.role === "admin")  return <Redirect to="/admin/dashboard" />;
    if (user?.role === "clerk")  return <Redirect to="/clerk/applications" />;
    return <Redirect to={ROUTES.DASHBOARD} />;
  }

  return <Component />;
}

// Admin-only guard - redirects non-admins
function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to={ROUTES.LOGIN} />;
  if (user?.role !== "admin") {
    return <Redirect to={user?.role === "clerk" ? "/clerk/applications" : ROUTES.DASHBOARD} />;
  }

  return <Component />;
}

// Citizen-only guard - wraps component with CitizenLayout
function CitizenRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to={ROUTES.LOGIN} />;
  if (user?.role !== "citizen") {
    if (user?.role === "admin") return <Redirect to="/admin/dashboard" />;
    if (user?.role === "clerk") return <Redirect to="/clerk/applications" />;
    return <Redirect to={ROUTES.DASHBOARD} />;
  }

  return (
    <CitizenLayout>
      <Component />
    </CitizenLayout>
  );
}

// Clerk-only guard - wraps component with ClerkLayout
function ClerkRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to={ROUTES.LOGIN} />;
  if (user?.role !== "clerk") {
    if (user?.role === "admin") return <Redirect to="/admin/dashboard" />;
    if (user?.role === "citizen") return <Redirect to="/citizen/dashboard" />;
    return <Redirect to={ROUTES.LOGIN} />;
  }

  return (
    <ClerkLayout>
      <Component />
    </ClerkLayout>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path={ROUTES.HOME}          component={Landing} />
        <Route path={ROUTES.LOGIN}         component={Login} />
        <Route path={ROUTES.REGISTER}      component={Register} />
        <Route path={ROUTES.VERIFY}        component={Verify} />

        {/* Legacy Citizen Routes */}
        <Route path={ROUTES.DASHBOARD}>
          <ProtectedRoute component={Dashboard} role="citizen" />
        </Route>
        <Route path={ROUTES.APPLY}>
          <ProtectedRoute component={Apply} role="citizen" />
        </Route>
        <Route path={ROUTES.APPLICATIONS}>
          <ProtectedRoute component={Applications} role="citizen" />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/dashboard">
          <AdminRoute component={AdminDashboardPage} />
        </Route>
        <Route path="/admin/applications">
          <AdminRoute component={AdminApplicationsPage} />
        </Route>
        <Route path="/admin/status-tracker">
          <AdminRoute component={AdminStatusTrackerPage} />
        </Route>
        <Route path="/admin/document-wallet">
          <AdminRoute component={AdminDocumentWalletPage} />
        </Route>
        <Route path="/admin/notifications">
          <AdminRoute component={AdminNotificationsPage} />
        </Route>
        <Route path="/admin/support">
          <AdminRoute component={AdminSupportClerksPage} />
        </Route>
        <Route path="/admin/privacy-policy">
          <AdminRoute component={AdminPrivacyPolicyPage} />
        </Route>
        <Route path="/admin/settings">
          <AdminRoute component={AdminSettingsPage} />
        </Route>
        <Route path={ROUTES.ADMIN}>
          <AdminRoute component={AdminDashboardPage} />
        </Route>

        {/* Citizen Panel Routes - wrapped with shared CitizenLayout */}
        <Route path="/citizen/dashboard">
          <CitizenRoute component={CitizenDashboardPage} />
        </Route>
        <Route path="/citizen/applications">
          <CitizenRoute component={CitizenApplicationsPage} />
        </Route>
        <Route path="/citizen/track">
          <CitizenRoute component={CitizenTrackPage} />
        </Route>
        <Route path="/citizen/documents">
          <CitizenRoute component={CitizenDocumentsPage} />
        </Route>
        <Route path="/citizen/support">
          <CitizenRoute component={CitizenSupportPage} />
        </Route>
        <Route path="/citizen/privacy-policy">
          <CitizenRoute component={CitizenPrivacyPolicyPage} />
        </Route>
        <Route path="/citizen/notifications">
          <CitizenRoute component={CitizenNotificationsPage} />
        </Route>
        <Route path="/citizen/profile">
          <CitizenRoute component={CitizenProfilePage} />
        </Route>

        {/* Clerk Panel Routes - wrapped with shared ClerkLayout */}
        <Route path="/clerk/applications">
          <ClerkRoute component={ClerkApplicationsPage} />
        </Route>
        <Route path="/clerk/document-wallet">
          <ClerkRoute component={ClerkDocumentWalletPage} />
        </Route>
        <Route path="/clerk/status-tracker">
          <ClerkRoute component={ClerkStatusTrackerPage} />
        </Route>
        <Route path="/clerk/notifications">
          <ClerkRoute component={ClerkNotificationsPage} />
        </Route>
        <Route path="/clerk/support">
          <ClerkRoute component={ClerkSupportPage} />
        </Route>
        <Route path="/clerk/privacy-policy">
          <ClerkRoute component={ClerkPrivacyPolicyPage} />
        </Route>
        <Route path="/clerk/settings">
          <ClerkRoute component={ClerkSettingsPage} />
        </Route>
        {/* Default clerk route */}
        <Route path="/clerk">
          <ClerkRoute component={ClerkApplicationsPage} />
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}