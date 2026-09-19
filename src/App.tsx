import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MusicProvider } from "@/contexts/MusicContext";
import { FuelProvider } from "@/contexts/FuelContext";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Feedback from "./pages/Feedback";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import SubscriptionPage from "./pages/SubscriptionPage";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2 } from "lucide-react";

// Public routes that don't need subscription check
const PUBLIC_PATHS = ['/', '/auth', '/verify-email', '/terms', '/terms-and-conditions', '/privacy', '/privacy-policy', '/about', '/contact', '/feedback'];

/** Gate: redirect logged-in users without active subscription to /subscribe */
const SubscriptionGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isPremium, loading: subLoading, status } = useSubscription();
  const location = useLocation();

  const isPublicPath = PUBLIC_PATHS.includes(location.pathname);

  // Show spinner while auth or subscription loads (only for protected paths)
  if (!isPublicPath && (authLoading || (user && subLoading))) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // If user is logged in and on a protected path but has no premium access, redirect to subscribe
  if (user && !isPublicPath && !isPremium && !subLoading && location.pathname !== '/subscribe') {
    return <Navigate to="/subscribe" replace />;
  }

  // If user is logged in, has premium, and lands on /subscribe → send to dashboard
  if (user && isPremium && location.pathname === '/subscribe') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MusicProvider>
        <FuelProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <SubscriptionGate>
                <Routes>
                  <Route path="/" element={<Welcome />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/subscribe" element={<SubscriptionPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/terms-and-conditions" element={<Terms />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </SubscriptionGate>
            </AuthProvider>
          </BrowserRouter>
          <PWAInstallBanner />
        </FuelProvider>
      </MusicProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
