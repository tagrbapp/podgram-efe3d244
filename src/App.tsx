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
import Auctions from "./pages/Auctions";
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
import DashboardAnnouncements from "./pages/DashboardAnnouncements";
import DashboardHeroCarousel from "./pages/DashboardHeroCarousel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/add-listing" element={<AddListing />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
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
          <Route path="/dashboard/announcements" element={<DashboardAnnouncements />} />
          <Route path="/dashboard/hero-carousel" element={<DashboardHeroCarousel />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/test-notifications" element={<TestNotifications />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
