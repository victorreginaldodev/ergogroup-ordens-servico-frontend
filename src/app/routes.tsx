import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Auth
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import NotFound from '@/pages/NotFound';

// Analytics
import OperacionalPage from '@/features/analytics/pages/OperacionalPage';
import AnaliseFinanceiroPage from '@/features/analytics/pages/FinanceiroPage';

// Páginas existentes (migrar para features/ conforme forem tocadas)
import OrdersPage from '@/pages/dashboard/OrdersPage';
import NewOrderPage from '@/pages/dashboard/NewOrderPage';
import ServicesPage from '@/pages/dashboard/ServicesPage';
import ServiceManagementPage from '@/pages/dashboard/ServiceManagementPage';
import FinancialPage from '@/pages/dashboard/FinancialPage';
import UserProfilePage from '@/pages/dashboard/UserProfilePage';
import UsersManagementPage from '@/pages/dashboard/UsersManagementPage';
import CompanySettingsPage from '@/pages/dashboard/CompanySettingsPage';
import ClientsPage from '@/pages/dashboard/ClientsPage';
import ClientFormPage from '@/pages/dashboard/ClientFormPage';
import ContactsPage from '@/pages/dashboard/ContactsPage';
import ContactFormPage from '@/pages/dashboard/ContactFormPage';
import CatalogPage from '@/pages/dashboard/CatalogPage';
import CatalogFormPage from '@/pages/dashboard/CatalogFormPage';
import TasksPage from '@/pages/dashboard/TasksPage';
import QuickTasksPage from '@/pages/dashboard/QuickTasksPage';
import QuickTasksCatalogPage from '@/pages/dashboard/QuickTasksCatalogPage';
import QuickTasksCatalogFormPage from '@/pages/dashboard/QuickTasksCatalogFormPage';

const w = (element: React.ReactNode) => <DashboardLayout>{element}</DashboardLayout>;

const AppRoutes = () => (
  <Routes>
    {/* Auth */}
    <Route path="/" element={<LoginPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    {/* Analytics */}
    <Route path="/dashboard/analise/operacional" element={w(<OperacionalPage />)} />
    <Route path="/dashboard/analise/financeiro" element={w(<AnaliseFinanceiroPage />)} />

    {/* Ordens */}
    <Route path="/dashboard/orders" element={w(<OrdersPage />)} />
    <Route path="/dashboard/orders/new" element={w(<NewOrderPage />)} />
    <Route path="/dashboard/orders/:id/edit" element={w(<NewOrderPage />)} />

    {/* Serviços */}
    <Route path="/dashboard/services" element={w(<ServicesPage />)} />
    <Route path="/dashboard/services/manage/:orderId/:itemId" element={w(<ServiceManagementPage />)} />

    {/* Tarefas */}
    <Route path="/dashboard/tasks" element={w(<TasksPage />)} />
    <Route path="/dashboard/quick-tasks" element={w(<QuickTasksPage />)} />
    <Route path="/dashboard/quick-tasks/catalog" element={w(<QuickTasksCatalogPage />)} />
    <Route path="/dashboard/quick-tasks/catalog/new" element={w(<QuickTasksCatalogFormPage />)} />
    <Route path="/dashboard/quick-tasks/catalog/:id/edit" element={w(<QuickTasksCatalogFormPage />)} />

    {/* Clientes e Contatos */}
    <Route path="/dashboard/clients" element={w(<ClientsPage />)} />
    <Route path="/dashboard/clients/new" element={w(<ClientFormPage />)} />
    <Route path="/dashboard/clients/:id/edit" element={w(<ClientFormPage />)} />
    <Route path="/dashboard/contacts" element={w(<ContactsPage />)} />
    <Route path="/dashboard/contacts/new" element={w(<ContactFormPage />)} />
    <Route path="/dashboard/contacts/:id/edit" element={w(<ContactFormPage />)} />

    {/* Catálogo */}
    <Route path="/dashboard/catalog" element={w(<CatalogPage />)} />
    <Route path="/dashboard/catalog/new" element={w(<CatalogFormPage />)} />
    <Route path="/dashboard/catalog/:id/edit" element={w(<CatalogFormPage />)} />

    {/* Financeiro operacional */}
    <Route path="/dashboard/financial" element={w(<FinancialPage />)} />

    {/* Usuários e configurações */}
    <Route path="/dashboard/profile" element={w(<UserProfilePage />)} />
    <Route path="/dashboard/users" element={w(<UsersManagementPage />)} />
    <Route path="/dashboard/company" element={w(<CompanySettingsPage />)} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
