import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AddListing from "./pages/AddListing";
import Dashboard from "./pages/Dashboard";
import DashboardListings from "./pages/DashboardListings";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import DashboardReports from "./pages/DashboardReports";
import DashboardReportsAdmin from "./pages/DashboardReportsAdmin";
import DashboardAdvancedAnalytics from "./pages/DashboardAdvancedAnalytics";
import DashboardGamification from "./pages/DashboardGamification";
import DashboardAdmin from "./pages/DashboardAdmin";
import Messages from "./pages/Messages";
import ListingDetails from "./pages/ListingDetails";
import Catalog from "./pages/Catalog";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/listings" element={<DashboardListings />} />
          <Route path="/dashboard/analytics" element={<DashboardAnalytics />} />
          <Route path="/dashboard/analytics/advanced" element={<DashboardAdvancedAnalytics />} />
          <Route path="/dashboard/gamification" element={<DashboardGamification />} />
          <Route path="/dashboard/reports" element={<DashboardReports />} />
          <Route path="/dashboard/reports/admin" element={<DashboardReportsAdmin />} />
          <Route path="/dashboard/admin" element={<DashboardAdmin />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/settings" element={<Settings />} />
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
