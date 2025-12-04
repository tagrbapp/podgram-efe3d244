import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import AddListing from "./pages/AddListing";
import ListingDetails from "./pages/ListingDetails";
import Favorites from "./pages/Favorites";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Catalog from "./pages/Catalog";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import FAQ from "./pages/FAQ";
import Auctions from "./pages/Auctions";
import AuctionDetails from "./pages/AuctionDetails";
import DashboardListings from "./pages/DashboardListings";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import DashboardReports from "./pages/DashboardReports";
import DashboardGamification from "./pages/DashboardGamification";
import DashboardAdvancedAnalytics from "./pages/DashboardAdvancedAnalytics";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardReportsAdmin from "./pages/DashboardReportsAdmin";
import DashboardAuctions from "./pages/DashboardAuctions";
import DashboardAuctionAnalytics from "./pages/DashboardAuctionAnalytics";
import DashboardBidderProfile from "./pages/DashboardBidderProfile";
import AuctionInvitations from "./pages/AuctionInvitations";
import TestNotifications from "./pages/TestNotifications";
import Notifications from "./pages/Notifications";
import DashboardNotifications from "./pages/DashboardNotifications";
import DashboardNotificationTemplates from "./pages/DashboardNotificationTemplates";
import DashboardAnnouncements from "./pages/DashboardAnnouncements";
import DashboardHeroCarousel from "./pages/DashboardHeroCarousel";
import DashboardHomepage from "./pages/DashboardHomepage";
import DashboardAuthSettings from "./pages/DashboardAuthSettings";
import DashboardTopBar from "./pages/DashboardTopBar";
import DashboardFooter from "./pages/DashboardFooter";
import DashboardTheme from "./pages/DashboardTheme";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import DashboardUserApprovals from "./pages/DashboardUserApprovals";
import DashboardRoles from "./pages/DashboardRoles";
import DashboardCategories from "./pages/DashboardCategories";
import DashboardPointsCalculation from "./pages/DashboardPointsCalculation";
import DashboardLeaderboard from "./pages/DashboardLeaderboard";
import DashboardAchievements from "./pages/DashboardAchievements";
import DashboardAchievementsReports from "./pages/DashboardAchievementsReports";
import DashboardReferral from "./pages/DashboardReferral";
import DashboardReferralStats from "./pages/DashboardReferralStats";
import DashboardSEO from "./pages/DashboardSEO";
import DashboardEmailSettings from "./pages/DashboardEmailSettings";
import DashboardAliexpress from "./pages/DashboardAliexpress";
import { ThemeProvider } from "@/components/ThemeProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/add-listing" element={<AddListing />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/auction/:id" element={<AuctionDetails />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/listings" element={<DashboardListings />} />
          <Route path="/dashboard/analytics" element={<DashboardAnalytics />} />
          <Route path="/dashboard/analytics/advanced" element={<DashboardAdvancedAnalytics />} />
          <Route path="/dashboard/gamification" element={<DashboardGamification />} />
          <Route path="/dashboard/reports" element={<DashboardReports />} />
          <Route path="/dashboard/reports/admin" element={<DashboardReportsAdmin />} />
          <Route path="/dashboard/auctions" element={<DashboardAuctions />} />
          <Route path="/dashboard/auction-analytics" element={<DashboardAuctionAnalytics />} />
          <Route path="/dashboard/bidder-profile" element={<DashboardBidderProfile />} />
          <Route path="/auction-invitations" element={<AuctionInvitations />} />
          <Route path="/dashboard/admin" element={<DashboardAdmin />} />
          <Route path="/dashboard/user-approvals" element={<DashboardUserApprovals />} />
          <Route path="/dashboard/announcements" element={<DashboardAnnouncements />} />
          <Route path="/dashboard/hero-carousel" element={<DashboardHeroCarousel />} />
          <Route path="/dashboard/homepage" element={<DashboardHomepage />} />
          <Route path="/dashboard/auth-settings" element={<DashboardAuthSettings />} />
          <Route path="/dashboard/top-bar" element={<DashboardTopBar />} />
          <Route path="/dashboard/footer" element={<DashboardFooter />} />
          <Route path="/dashboard/theme" element={<DashboardTheme />} />
          <Route path="/dashboard/roles" element={<DashboardRoles />} />
          <Route path="/dashboard/categories" element={<DashboardCategories />} />
          <Route path="/dashboard/points-calculation" element={<DashboardPointsCalculation />} />
          <Route path="/dashboard/leaderboard" element={<DashboardLeaderboard />} />
          <Route path="/dashboard/achievements" element={<DashboardAchievements />} />
          <Route path="/dashboard/achievements-reports" element={<DashboardAchievementsReports />} />
          <Route path="/dashboard/referral" element={<DashboardReferral />} />
          <Route path="/dashboard/referral-stats" element={<DashboardReferralStats />} />
          <Route path="/dashboard/seo" element={<DashboardSEO />} />
          <Route path="/dashboard/email-settings" element={<DashboardEmailSettings />} />
          <Route path="/dashboard/aliexpress" element={<DashboardAliexpress />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/test-notifications" element={<TestNotifications />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/dashboard/notifications" element={<DashboardNotifications />} />
          <Route path="/dashboard/notification-templates" element={<DashboardNotificationTemplates />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
