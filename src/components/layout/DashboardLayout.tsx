import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  FileText,
  Wrench,
  DollarSign,
  Settings,
  LogOut,
  User,
  Users,
  Phone,
  Bell,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ticket,
  Plus,
  List,
  Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import ThemeToggle from '@/components/ThemeToggle';
import { authService, UserProfile as BackendUserProfile } from '@/services/auth';
import UnderDevelopmentOverlay from '@/components/UnderDevelopmentOverlay';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Ordens de Serviço', url: '/dashboard/orders', icon: FileText },
  { title: 'Serviços', url: '/dashboard/services', icon: Wrench },
  { title: 'Financeiro', url: '/dashboard/financial', icon: DollarSign },
];

const adminItems = [
  { title: 'Clientes', url: '/dashboard/clients', icon: Users },
  { title: 'Contatos', url: '/dashboard/contacts', icon: Phone },
  { title: 'Catálogo', url: '/dashboard/catalog', icon: Wrench },
  { title: 'Usuários', url: '/dashboard/users', icon: Users },
  // { title: 'Empresa', url: '/dashboard/company', icon: Settings },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<BackendUserProfile | null>(null);

  const SidebarEventBridge = ({ onCollapsedChange }: { onCollapsedChange: (v: boolean) => void }) => {
    const { setOpen, setOpenMobile, isMobile } = useSidebar();
    useEffect(() => {
      const handleCollapse = () => {
        onCollapsedChange(true);
        if (isMobile) {
          setOpenMobile(false);
        } else {
          setOpen(false);
        }
      };
      const handleExpand = () => {
        onCollapsedChange(false);
        if (isMobile) {
          setOpenMobile(true);
        } else {
          setOpen(true);
        }
      };
      window.addEventListener('servix:collapse-sidebar', handleCollapse);
      window.addEventListener('servix:expand-sidebar', handleExpand);
      return () => {
        window.removeEventListener('servix:collapse-sidebar', handleCollapse);
        window.removeEventListener('servix:expand-sidebar', handleExpand);
      };
    }, [setOpen, setOpenMobile, isMobile, onCollapsedChange]);
    return null;
  };

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (u) setCurrentUser(u);
  }, []);

  useEffect(() => {
    const handleAuthUpdated = () => {
      const u = authService.getCurrentUser();
      if (u) setCurrentUser(u);
    };
    window.addEventListener('servix:auth-updated', handleAuthUpdated);
    return () => window.removeEventListener('servix:auth-updated', handleAuthUpdated);
  }, []);
  const initials = (() => {
    const name = `${currentUser?.user.first_name || ''} ${currentUser?.user.last_name || ''}`.trim() || currentUser?.user.username || 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  })();

  const displayName = (() => {
    const name = `${currentUser?.user.first_name || ''} ${currentUser?.user.last_name || ''}`.trim();
    return name || currentUser?.user.username || 'Usuário';
  })();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SidebarEventBridge onCollapsedChange={setCollapsed} />
        <Sidebar className={`border-r border-sidebar-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
          <SidebarHeader className="h-16 px-3 border-b border-sidebar-border flex flex-row items-center justify-start">
            <Link to="/dashboard" className="flex items-center  ml-0">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img
                  src="/images/logos/logo-ergo.png"
                  alt="Ergo"
                  className="w-full h-full object-contain"
                />
              </div>
              {!collapsed && 
                <div className="text-xl font-bold tracking-tight ml-2 flex gap-0">
                  <span className="text-[#256DB6]">ERGO</span>
                  <span className="text-[#000000] dark:text-white">GRO</span>
                  <span className="text-[#256DB6]">UP</span>
                </div>
              }
            </Link>
          </SidebarHeader>



          {!collapsed && (
            <p className="px-3 py-1 mt-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Sistema
            </p>
          )}

          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.url ||
                      (item.url !== '/dashboard' && location.pathname.startsWith(item.url));

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link
                            to={item.url}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                              }`}
                          >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                            {!collapsed && <span className="font-medium">{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {!collapsed && <Separator className="my-2" />}

            {!collapsed && (
              <p className="px-3 py-1 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Administração
              </p>
            )}

            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => {
                    const isActive = location.pathname === item.url;

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link
                            to={item.url}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                              }`}
                          >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                            {!collapsed && <span className="font-medium">{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Marketplace section removed */}
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 overflow-auto" style={{ scrollbarGutter: 'stable' }}>
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger onClick={() => setCollapsed(!collapsed)} />
              <h1 className="text-lg font-semibold hidden sm:block">
                {menuItems.find(item =>
                  location.pathname === item.url ||
                  (item.url !== '/dashboard' && location.pathname.startsWith(item.url))
                )?.title || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 p-0" aria-label="Notificações">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="px-2 py-1.5 text-sm font-semibold">Notificações</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 text-destructive" />
                    <div className="flex-1">
                      <div className="text-sm">Uma OS precisa de atenção</div>
                      <div className="text-xs text-muted-foreground">Há 3 min</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                    <div className="flex-1">
                      <div className="text-sm">Pagamento confirmado</div>
                      <div className="text-xs text-muted-foreground">Há 20 min</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-0.5 text-yellow-500" />
                    <div className="flex-1">
                      <div className="text-sm">Serviço agendado para amanhã</div>
                      <div className="text-xs text-muted-foreground">Há 1 h</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-primary">Ver todas</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 p-0" aria-label="Tickets de suporte">
                    <Headphones className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-2 py-1.5 text-sm font-semibold">Suporte</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/tickets/new" className="flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Abrir ticket
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/tickets" className="flex items-center">
                      <List className="w-4 h-4 mr-2" />
                      Meus tickets
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 h-auto p-2">
                    <Avatar className="w-8 h-8">
                      {currentUser?.foto_perfil ? <AvatarImage src={currentUser.foto_perfil} /> : null}
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/company" className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/" className="flex items-center text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 px-8 py-6">
            {(() => {
              const p = location.pathname;
              const isExcept = p.startsWith('/dashboard/orders') || p.startsWith('/dashboard/services');
              const isDashboardRoot = p === '/dashboard';
              if (!isExcept && !isDashboardRoot) {
                return <UnderDevelopmentOverlay />;
              }
              return null;
            })()}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
