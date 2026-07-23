import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import FacilityEditorForm from './pages/facility-editor-form';
import InteractiveMapDashboard from './pages/interactive-map-dashboard';
import UserRoleManagement from './pages/user-role-management';
import AnalyticsReportingDashboard from './pages/analytics-reporting-dashboard';
import WorkflowManagementConsole from './pages/workflow-management-console';
import MobileFieldCollectionApp from './pages/mobile-field-collection-app';
import CCETSTicketManagementDashboard from './pages/ccets-ticket-management-dashboard';
import TechnicianMobileWorkspace from './pages/technician-mobile-workspace';
import FacilitiesList from './pages/facilities-list';
import AuditLogViewer from './pages/audit-log-viewer';
import PublicVerification from './pages/public-verification';

import AdminConsole from './pages/admin-console';
import SystemSettings from './pages/system-settings';
import DataDictionaryPage from './pages/data-dictionary';
import VersionManagementPage from './pages/version-management';
import InteroperabilityHubPage from './pages/interoperability-hub';
import AdminHierarchyPage from './pages/admin-hierarchy';
import LoginPage from './pages/login';
import ProtectedRoute from './components/ProtectedRoute';

import { ThemeProvider } from './components/ThemeProvider';

const Routes = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify/:id" element={<PublicVerification />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <InteractiveMapDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin-hierarchy" element={
            <ProtectedRoute>
              <AdminHierarchyPage />
            </ProtectedRoute>
          } />
          <Route path="/data-dictionary" element={
            <ProtectedRoute>
              <DataDictionaryPage />
            </ProtectedRoute>
          } />

          <Route path="/version-management" element={
            <ProtectedRoute>
              <VersionManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/interoperability-hub" element={
            <ProtectedRoute>
              <InteroperabilityHubPage />
            </ProtectedRoute>
          } />


          <Route path="/facility-editor-form" element={
            <ProtectedRoute>
              <FacilityEditorForm />
            </ProtectedRoute>
          } />
          <Route path="/interactive-map-dashboard" element={
            <ProtectedRoute>
              <InteractiveMapDashboard />
            </ProtectedRoute>
          } />
          <Route path="/user-role-management" element={
            <ProtectedRoute>
              <UserRoleManagement />
            </ProtectedRoute>
          } />
          <Route path="/analytics-reporting-dashboard" element={
            <ProtectedRoute>
              <AnalyticsReportingDashboard />
            </ProtectedRoute>
          } />
          <Route path="/workflow-management-console" element={
            <ProtectedRoute>
              <WorkflowManagementConsole />
            </ProtectedRoute>
          } />
          <Route path="/workflow-console" element={
            <ProtectedRoute>
              <WorkflowManagementConsole />
            </ProtectedRoute>
          } />
          <Route path="/mobile-field-collection-app" element={
            <ProtectedRoute>
              <MobileFieldCollectionApp />
            </ProtectedRoute>
          } />
          <Route path="/ccets-ticket-management-dashboard" element={
            <ProtectedRoute>
              <CCETSTicketManagementDashboard />
            </ProtectedRoute>
          } />
          <Route path="/technician-mobile-workspace" element={
            <ProtectedRoute>
              <TechnicianMobileWorkspace />
            </ProtectedRoute>
          } />
          <Route path="/facilities" element={
            <ProtectedRoute>
              <FacilitiesList />
            </ProtectedRoute>
          } />
          <Route path="/facilities/:id" element={
            <ProtectedRoute>
              <FacilityEditorForm />
            </ProtectedRoute>
          } />
          <Route path="/admin-console" element={
            <ProtectedRoute>
              <AdminConsole />
            </ProtectedRoute>
          } />
          <Route path="/audit-logs" element={
            <ProtectedRoute>
              <AuditLogViewer />
            </ProtectedRoute>
          } />
          <Route path="/system-settings" element={
            <ProtectedRoute>
              <SystemSettings />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
        </BrowserRouter>
      </ThemeProvider>
    );
  };

export default Routes;