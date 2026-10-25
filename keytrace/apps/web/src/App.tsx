import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/useAuth.js";
import { AppLayout } from "./components/layout/AppLayout.js";
import { ErrorBoundary } from "./pages/ErrorBoundary.js";

// Pages
import { LandingPage } from "./pages/LandingPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { ConsentPage } from "./pages/ConsentPage.js";
import { OnboardingPage } from "./pages/OnboardingPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { EnrollmentPage } from "./pages/EnrollmentPage.js";
import { VerificationWorkspacePage } from "./pages/VerificationWorkspacePage.js";
import { HistoryPage } from "./pages/HistoryPage.js";
import { AnalyticsPage } from "./pages/AnalyticsPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { AdminPage } from "./pages/AdminPage.js";
import { DocumentationPage } from "./pages/DocumentationPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
import { AccessDeniedPage } from "./pages/AccessDeniedPage.js";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="text-xs text-foreground-muted">Checking authentication state...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppLayout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/docs" element={<DocumentationPage />} />

                {/* Protected Routes */}
                <Route
                  path="/consent"
                  element={
                    <ProtectedRoute>
                      <ConsentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/enrollment"
                  element={
                    <ProtectedRoute>
                      <EnrollmentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/verification"
                  element={
                    <ProtectedRoute>
                      <VerificationWorkspacePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Route */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />

                {/* Status & Fallbacks */}
                <Route path="/403" element={<AccessDeniedPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
