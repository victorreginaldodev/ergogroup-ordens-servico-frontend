import { useState, useEffect, useMemo } from 'react';
import { EV1UpdatesModal } from '@/components/common/EV1UpdatesModal';
import { useEV1Modal } from '@/hooks/useEV1Modal';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  Package,
  DollarSign,
  LogOut,
  User,
  Users,
  Building2,
  ClipboardList,
  Bell,
  AlertCircle,
  CheckCircle2,
  Clock,
  PanelLeft,
  BarChart2,
  Activity,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ThemeToggle';
import HeaderSearch from '@/components/layout/HeaderSearch';
import { authService, UserProfile as BackendUserProfile } from '@/services/auth';
import { TIPO_USUARIO_OPTIONS } from '@/features/usuarios/services';
import UnderDevelopmentOverlay from '@/components/UnderDevelopmentOverlay';
import { useUserRole } from '@/hooks/useUserRole';

const NOTIFICATIONS = [
  { icon: AlertCircle, iconClassName: 'text-destructive', title: 'Uma OS precisa de atenção', time: 'Há 3 min' },
  { icon: CheckCircle2, iconClassName: 'text-green-500', title: 'Pagamento confirmado', time: 'Há 20 min' },
  { icon: Clock, iconClassName: 'text-yellow-500', title: 'Serviço agendado para amanhã', time: 'Há 1 h' },
];

const baseMenuItems = [
  { title: 'Ordens de Serviço',  url: '/dashboard/orders',        icon: FileText },
  { title: 'OS Operacionais',     url: '/dashboard/quick-tasks',   icon: FileText },
  { title: 'Cobranças',         url: '/dashboard/financial',     icon: DollarSign },
];

const adminItems = [
  { title: 'Clientes',                    url: '/dashboard/clients',              icon: Building2 },
  { title: 'Catálogo',                    url: '/dashboard/catalog',              icon: Package },
  { title: 'Catálogo OS Operacionais',    url: '/dashboard/quick-tasks/catalog',  icon: Package },
  { title: 'Usuários',                    url: '/dashboard/users',                icon: Users },
];

const analyticsItems = [
  { title: 'Operacional',  url: '/dashboard/analise/operacional', icon: Activity,  requiresFinancial: false },
  { title: 'Financeiro',   url: '/dashboard/analise/financeiro',  icon: BarChart2, requiresFinancial: true },
];

const SIDEBAR_KEY = 'sidebar:collapsed';

interface NavItemProps {
  item: { title: string; url: string; icon: React.ElementType };
  isActive: boolean;
  collapsed: boolean;
}

const NavItem = ({ item, isActive, collapsed }: NavItemProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link
        to={item.url}
        className={cn(
          'relative flex items-center h-9 rounded-md text-sm font-medium',
          'transition-colors duration-150 overflow-hidden whitespace-nowrap',
          collapsed ? 'justify-center px-0 mx-1' : 'gap-3 pl-3 pr-2',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] w-[3px] rounded-full bg-primary" />
        )}
        <item.icon className="w-5 h-5 flex-shrink-0" />
        <span className={cn(
          'transition-[opacity,max-width] duration-200 overflow-hidden',
          collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px]',
        )}>
          {item.title}
        </span>
      </Link>
    </TooltipTrigger>
    {collapsed && (
      <TooltipContent side="right" className="font-medium text-xs">
        {item.title}
      </TooltipContent>
    )}
  </Tooltip>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { open: ev1Open, dismiss: dismissEV1 } = useEV1Modal();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === 'true'; }
    catch { return false; }
  });
  const [currentUser, setCurrentUser] = useState<BackendUserProfile | null>(null);
  const { canAccessFinancials } = useUserRole();

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch {}
      return next;
    });
  };

  const visibleMenuItems = useMemo(
    () => baseMenuItems.filter((item) => canAccessFinancials || item.url !== '/dashboard/financial'),
    [canAccessFinancials],
  );

  const visibleAnalyticsItems = useMemo(
    () => analyticsItems.filter((item) => !item.requiresFinancial || canAccessFinancials),
    [canAccessFinancials],
  );

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

  const initials = useMemo(() => {
    const name =
      `${currentUser?.user.first_name ?? ''} ${currentUser?.user.last_name ?? ''}`.trim() ||
      currentUser?.user.username ||
      'U';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  }, [currentUser]);

  const displayName = useMemo(() => {
    const name =
      `${currentUser?.user.first_name ?? ''} ${currentUser?.user.last_name ?? ''}`.trim();
    return name || currentUser?.user.username || 'Usuário';
  }, [currentUser]);

  const roleLabel = useMemo(
    () => TIPO_USUARIO_OPTIONS.find((o) => o.value === currentUser?.tipo_usuario)?.label ?? '',
    [currentUser],
  );

  const pageTitle = useMemo(() => {
    const allItems = [...baseMenuItems, ...analyticsItems, ...adminItems];
    return allItems.find((item) => location.pathname.startsWith(item.url))?.title ?? null;
  }, [location.pathname]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex w-full bg-background">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside
          className={cn(
            'h-screen sticky top-0 flex-shrink-0 flex flex-col z-30',
            'bg-sidebar border-r border-border',
            'transition-[width] duration-200 ease-in-out overflow-hidden',
            collapsed ? 'w-20' : 'w-64',
          )}
        >
          {/* Logo */}
          <div className={cn(
            'h-16 flex items-center border-b border-border flex-shrink-0',
            collapsed ? 'justify-center px-0' : 'px-2',
          )}>
            <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
              <img
                src="/images/logos/logo-ergo.png"
                alt="Ergo"
                className="w-8 h-8 flex-shrink-0 object-contain"
              />
              <div className={cn(
                'text-xl font-bold tracking-tight flex gap-0 whitespace-nowrap',
                'transition-[opacity,max-width] duration-200 overflow-hidden',
                collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[160px]',
              )}>
                <span className="text-foreground">ERGO</span>
                <span className="text-primary">GROUP</span>
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
            {!collapsed && (
              <p className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Sistema
              </p>
            )}

            <div className="space-y-1">
              {visibleMenuItems.map((item) => {
                const isActive =
                  location.pathname === item.url ||
                  location.pathname.startsWith(item.url + '/');
                return <NavItem key={item.url} item={item} isActive={isActive} collapsed={collapsed} />;
              })}
            </div>

            {!collapsed && (
              <p className="px-2 py-1 mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Análise
              </p>
            )}

            <div className="space-y-1 mt-0.5">
              {visibleAnalyticsItems.map((item) => {
                const isActive = location.pathname === item.url;
                return <NavItem key={item.url} item={item} isActive={isActive} collapsed={collapsed} />;
              })}
            </div>

            {!collapsed && (
              <p className="px-2 py-1 mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Administração
              </p>
            )}

            <div className="space-y-1 mt-0.5">
              {adminItems.map((item) => {
                const isActive = location.pathname === item.url;
                return <NavItem key={item.url} item={item} isActive={isActive} collapsed={collapsed} />;
              })}
            </div>
          </nav>

          {/* User card */}
          <div className="border-t border-border p-2 flex-shrink-0">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'w-full flex items-center gap-2 rounded-md p-1.5',
                        'hover:bg-sidebar-accent transition-colors duration-150',
                        collapsed && 'justify-center',
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-8 h-8">
                          {currentUser?.foto_perfil ? <AvatarImage src={currentUser.foto_perfil} /> : null}
                          <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-status-completed border-2 border-sidebar-background" />
                      </div>
                      <div className={cn(
                        'flex-1 flex items-center gap-1.5 min-w-0 text-left',
                        'transition-[opacity,max-width] duration-200 overflow-hidden',
                        collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[180px]',
                      )}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">{roleLabel}</p>
                        </div>
                        <ChevronsUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="font-medium text-xs">
                    {displayName}
                  </TooltipContent>
                )}
              </Tooltip>
              <DropdownMenuContent align="end" side="top" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile" className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Meu Perfil
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
        </aside>

        {/* ── Main area ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-auto" style={{ scrollbarGutter: 'stable' }}>

          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={toggle}>
                <PanelLeft className="w-4 h-4" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>

              <Breadcrumb className="hidden md:block">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {pageTitle && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="font-semibold">{pageTitle}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>

              <HeaderSearch />
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="relative h-9 w-9 p-0" aria-label="Notificações">
                    <Bell className="w-5 h-5" />
                    {NOTIFICATIONS.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium leading-4 text-center">
                        {NOTIFICATIONS.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="px-2 py-1.5 text-sm font-semibold">Notificações</div>
                  <DropdownMenuSeparator />
                  {NOTIFICATIONS.map((notification) => (
                    <DropdownMenuItem key={notification.title} className="flex items-start gap-2">
                      <notification.icon className={cn('w-4 h-4 mt-0.5', notification.iconClassName)} />
                      <div className="flex-1">
                        <div className="text-sm">{notification.title}</div>
                        <div className="text-xs text-muted-foreground">{notification.time}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-primary">Ver todas</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 h-auto py-1.5 px-2.5">
                    <Avatar className="w-8 h-8">
                      {currentUser?.foto_perfil ? <AvatarImage src={currentUser.foto_perfil} /> : null}
                      <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start leading-tight">
                      <span className="text-sm font-medium">{displayName}</span>
                      <span className="text-xs text-muted-foreground">{roleLabel}</span>
                    </div>
                    <ChevronDown className="hidden sm:block w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Meu Perfil
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

          {/* Main content */}
          <main className="flex-1 px-8 py-6">
            {(() => {
              const p = location.pathname;
              const isExcept =
                p.startsWith('/dashboard/orders') ||
                p.startsWith('/dashboard/users') ||
                p.startsWith('/dashboard/financial') ||
                p.startsWith('/dashboard/clients') ||
                p.startsWith('/dashboard/catalog') ||
                p.startsWith('/dashboard/quick-tasks') ||
                p.startsWith('/dashboard/profile') ||
                p.startsWith('/dashboard/analise');
              if (!isExcept && p !== '/dashboard') return <UnderDevelopmentOverlay />;
              return null;
            })()}
            {children}
          </main>

        </div>
      </div>

      <EV1UpdatesModal open={ev1Open} onDismiss={dismissEV1} />
    </TooltipProvider>
  );
};

export default DashboardLayout;
