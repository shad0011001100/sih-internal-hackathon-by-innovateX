// @ts-nocheck
import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { ToastProvider } from "./context/ToastContext";

// Screens — lazy loaded for performance
import LandingScreen from "./features/landing/LandingScreen";
import RoleSelectScreen from "./features/landing/RoleSelectScreen";
import RoleLoginScreen from "./features/landing/RoleLoginScreen";
import OtpScreen from "./features/auth/OtpScreen";

const DashboardScreen   = lazy(() => import("./features/citizen/DashboardScreen"));
const ReportScreen      = lazy(() => import("./features/citizen/ReportScreen"));
const CitizenProfileScreen = lazy(() => import("./features/citizen/CitizenProfileScreen"));
const OfficialDashboard  = lazy(() => import("./features/official/OfficialDashboard"));
const StudentDashboard   = lazy(() => import("./features/student/StudentDashboard"));
const UniversityDashboard = lazy(() => import("./features/university/UniversityDashboard"));
const IndustryDashboard  = lazy(() => import("./features/industry/IndustryDashboard"));

// Maps each role → its home route
const ROLE_HOME: Record<string, string> = {
    citizen:    "/dashboard",
    student:    "/student-dashboard",
    university: "/university-dashboard",
    official:   "/official-dashboard",
    verifier:   "/official-dashboard",
    industry:   "/industry-dashboard",
    admin:      "/official-dashboard",
};

function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
        </div>
    );
}

function ProtectedRoute({ children, allowedRoles }) {
    const { isAuthenticated, role } = useAuthStore();
    const location = useLocation();
    if (!isAuthenticated) return <Navigate to="/" state={{ from: location }} replace />;
    if (role && !allowedRoles.includes(role)) {
        return <Navigate to={ROLE_HOME[role] || "/"} replace />;
    }
    return children;
}

function AppContent() {
    const location = useLocation();
    const { isAuthenticated, role } = useAuthStore();

    // Redirect logged-in users away from root
    if (location.pathname === "/" && isAuthenticated && role) {
        return <Navigate to={ROLE_HOME[role] || "/"} replace />;
    }

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Public: Landing & Auth */}
                <Route path="/"              element={<LandingScreen />} />
                <Route path="/select-role"   element={<RoleSelectScreen />} />
                <Route path="/login/:role"   element={<RoleLoginScreen />} />
                <Route path="/otp"           element={<OtpScreen />} />

                {/* Citizen Portal */}
                <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={["citizen"]}>
                        <Suspense fallback={<LoadingSpinner />}><DashboardScreen /></Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/report" element={
                    <ProtectedRoute allowedRoles={["citizen"]}>
                        <Suspense fallback={<LoadingSpinner />}><ReportScreen /></Suspense>
                    </ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute allowedRoles={["citizen"]}>
                        <Suspense fallback={<LoadingSpinner />}><CitizenProfileScreen /></Suspense>
                    </ProtectedRoute>
                } />

                {/* Official / Verifier Portal */}
                <Route path="/official-dashboard" element={
                    <ProtectedRoute allowedRoles={["official", "verifier", "admin"]}>
                        <Suspense fallback={<LoadingSpinner />}><OfficialDashboard /></Suspense>
                    </ProtectedRoute>
                } />

                {/* Student Portal */}
                <Route path="/student-dashboard" element={
                    <ProtectedRoute allowedRoles={["student"]}>
                        <Suspense fallback={<LoadingSpinner />}><StudentDashboard /></Suspense>
                    </ProtectedRoute>
                } />

                {/* University Portal */}
                <Route path="/university-dashboard" element={
                    <ProtectedRoute allowedRoles={["university"]}>
                        <Suspense fallback={<LoadingSpinner />}><UniversityDashboard /></Suspense>
                    </ProtectedRoute>
                } />

                {/* Industry Partner Portal */}
                <Route path="/industry-dashboard" element={
                    <ProtectedRoute allowedRoles={["industry"]}>
                        <Suspense fallback={<LoadingSpinner />}><IndustryDashboard /></Suspense>
                    </ProtectedRoute>
                } />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
}

export default function App() {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
}
