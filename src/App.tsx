import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import OrdersPage from "./pages/dashboard/OrdersPage";
import NewOrderPage from "./pages/dashboard/NewOrderPage";
import ServicesPage from "./pages/dashboard/ServicesPage";
import FinancialPage from "./pages/dashboard/FinancialPage";
import UserProfilePage from "./pages/dashboard/UserProfilePage";
import UsersManagementPage from "./pages/dashboard/UsersManagementPage";
import CompanySettingsPage from "./pages/dashboard/CompanySettingsPage";
import ClientsPage from "./pages/dashboard/ClientsPage";
import ContactsPage from "./pages/dashboard/ContactsPage";
import CatalogPage from "./pages/dashboard/CatalogPage";
import CatalogFormPage from "./pages/dashboard/CatalogFormPage";
import ServiceManagementPage from "./pages/dashboard/ServiceManagementPage";
import TasksPage from "./pages/dashboard/TasksPage";
import QuickTasksPage from "./pages/dashboard/QuickTasksPage";
import QuickTasksCatalogPage from "./pages/dashboard/QuickTasksCatalogPage";
import QuickTasksCatalogFormPage from "./pages/dashboard/QuickTasksCatalogFormPage";
import ClientFormPage from "./pages/dashboard/ClientFormPage";
import ContactFormPage from "./pages/dashboard/ContactFormPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="servix-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
            <Route path="/dashboard/orders" element={<DashboardLayout><OrdersPage /></DashboardLayout>} />
            <Route path="/dashboard/orders/new" element={<DashboardLayout><NewOrderPage /></DashboardLayout>} />
            <Route path="/dashboard/orders/:id/edit" element={<DashboardLayout><NewOrderPage /></DashboardLayout>} />
            <Route path="/dashboard/services" element={<DashboardLayout><ServicesPage /></DashboardLayout>} />
            <Route path="/dashboard/services/manage/:orderId/:itemId" element={<DashboardLayout><ServiceManagementPage /></DashboardLayout>} />
            <Route path="/dashboard/tasks" element={<DashboardLayout><TasksPage /></DashboardLayout>} />
            <Route path="/dashboard/quick-tasks" element={<DashboardLayout><QuickTasksPage /></DashboardLayout>} />
            <Route path="/dashboard/quick-tasks/catalog" element={<DashboardLayout><QuickTasksCatalogPage /></DashboardLayout>} />
            <Route path="/dashboard/quick-tasks/catalog/new" element={<DashboardLayout><QuickTasksCatalogFormPage /></DashboardLayout>} />
            <Route path="/dashboard/quick-tasks/catalog/:id/edit" element={<DashboardLayout><QuickTasksCatalogFormPage /></DashboardLayout>} />
            <Route path="/dashboard/clients" element={<DashboardLayout><ClientsPage /></DashboardLayout>} />
            <Route path="/dashboard/clients/new" element={<DashboardLayout><ClientFormPage /></DashboardLayout>} />
            <Route path="/dashboard/clients/:id/edit" element={<DashboardLayout><ClientFormPage /></DashboardLayout>} />
            <Route path="/dashboard/contacts" element={<DashboardLayout><ContactsPage /></DashboardLayout>} />
            <Route path="/dashboard/contacts/new" element={<DashboardLayout><ContactFormPage /></DashboardLayout>} />
            <Route path="/dashboard/contacts/:id/edit" element={<DashboardLayout><ContactFormPage /></DashboardLayout>} />
            <Route path="/dashboard/catalog" element={<DashboardLayout><CatalogPage /></DashboardLayout>} />
            <Route path="/dashboard/catalog/new" element={<DashboardLayout><CatalogFormPage /></DashboardLayout>} />
            <Route path="/dashboard/catalog/:id/edit" element={<DashboardLayout><CatalogFormPage /></DashboardLayout>} />
            <Route path="/dashboard/financial" element={<DashboardLayout><FinancialPage /></DashboardLayout>} />
            <Route path="/dashboard/profile" element={<DashboardLayout><UserProfilePage /></DashboardLayout>} />
            <Route path="/dashboard/users" element={<DashboardLayout><UsersManagementPage /></DashboardLayout>} />
            <Route path="/dashboard/company" element={<DashboardLayout><CompanySettingsPage /></DashboardLayout>} />
            
            {/* Public Marketplace Routes removed */}
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
