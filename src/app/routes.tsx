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

// Ordens
import OrdemServicoListPage from '@/features/ordens/pages/OrdemServicoListPage';
import OrdemServicoFormPage from '@/features/ordens/pages/OrdemServicoFormPage';
import OrdemDetalhePage from '@/features/ordens/pages/OrdemDetalhePage';

// Empresa
import CompanySettingsPage from '@/features/empresa/pages/CompanySettingsPage';

// Catálogo
import CatalogListPage from '@/features/catalogo/pages/CatalogListPage';
import CatalogFormPage from '@/features/catalogo/pages/CatalogFormPage';

// Clientes e Contatos
import ClientListPage from '@/features/clientes/pages/ClientListPage';
import ClientFormPage from '@/features/clientes/pages/ClientFormPage';
import ContactListPage from '@/features/clientes/pages/ContactListPage';
import ContactFormPage from '@/features/clientes/pages/ContactFormPage';

// Usuários
import UserProfilePage from '@/features/usuarios/pages/UserProfilePage';
import UsersManagementPage from '@/features/usuarios/pages/UsersManagementPage';

// Faturamento
import FaturamentoPage from '@/features/faturamento/pages/FaturamentoPage';

// Operational Orders
import OperationalOrderListPage from '@/features/operational-order/pages/OperationalOrderListPage';
import OperationalOrderCatalogListPage from '@/features/operational-order/pages/OperationalOrderCatalogListPage';
import OperationalOrderCatalogFormPage from '@/features/operational-order/pages/OperationalOrderCatalogFormPage';

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
    <Route path="/dashboard/orders" element={w(<OrdemServicoListPage />)} />
    <Route path="/dashboard/orders/new" element={w(<OrdemServicoFormPage />)} />
    <Route path="/dashboard/orders/:id" element={w(<OrdemDetalhePage />)} />
    <Route path="/dashboard/orders/:id/edit" element={w(<OrdemServicoFormPage />)} />

    {/* Operational Orders */}
    <Route path="/dashboard/quick-tasks" element={w(<OperationalOrderListPage />)} />
    <Route path="/dashboard/quick-tasks/catalog" element={w(<OperationalOrderCatalogListPage />)} />
    <Route path="/dashboard/quick-tasks/catalog/new" element={w(<OperationalOrderCatalogFormPage />)} />
    <Route path="/dashboard/quick-tasks/catalog/:id/edit" element={w(<OperationalOrderCatalogFormPage />)} />

    {/* Clientes e Contatos */}
    <Route path="/dashboard/clients" element={w(<ClientListPage />)} />
    <Route path="/dashboard/clients/new" element={w(<ClientFormPage />)} />
    <Route path="/dashboard/clients/:id/edit" element={w(<ClientFormPage />)} />
    <Route path="/dashboard/contacts" element={w(<ContactListPage />)} />
    <Route path="/dashboard/contacts/new" element={w(<ContactFormPage />)} />
    <Route path="/dashboard/contacts/:id/edit" element={w(<ContactFormPage />)} />

    {/* Catálogo */}
    <Route path="/dashboard/catalog" element={w(<CatalogListPage />)} />
    <Route path="/dashboard/catalog/new" element={w(<CatalogFormPage />)} />
    <Route path="/dashboard/catalog/:id/edit" element={w(<CatalogFormPage />)} />

    {/* Financeiro operacional */}
    <Route path="/dashboard/financial" element={w(<FaturamentoPage />)} />

    {/* Usuários e configurações */}
    <Route path="/dashboard/profile" element={w(<UserProfilePage />)} />
    <Route path="/dashboard/users" element={w(<UsersManagementPage />)} />
    <Route path="/dashboard/company" element={w(<CompanySettingsPage />)} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
