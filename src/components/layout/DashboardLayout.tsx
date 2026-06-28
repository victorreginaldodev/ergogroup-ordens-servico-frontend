import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  Wrench,
  DollarSign,
  LogOut,
  User,
  Users,
  Bell,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  BookOpen,
  PanelLeft,
  BarChart2,
  Activity,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ThemeToggle';
import HeaderSearch from '@/components/layout/HeaderSearch';
import { authService, UserProfile as BackendUserProfile } from '@/services/auth';
import UnderDevelopmentOverlay from '@/components/UnderDevelopmentOverlay';
import { useUserRole } from '@/hooks/useUserRole';

const baseMenuItems = [
  { title: 'Ordens de Serviço',  url: '/dashboard/orders',        icon: FileText },
  { title: 'OS Operacionais',     url: '/dashboard/quick-tasks',   icon: Zap },
  { title: 'Financeiro',         url: '/dashboard/financial',     icon: DollarSign },
];

const adminItems = [
  { title: 'Clientes',                    url: '/dashboard/clients',              icon: Users },
  { title: 'Catálogo',                    url: '/dashboard/catalog',              icon: Wrench },
  { title: 'Catálogo OS Operacionais',    url: '/dashboard/quick-tasks/catalog',  icon: BookOpen },
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
          'flex items-center gap-3 h-9 rounded-md px-2 text-sm font-medium',
          'transition-colors duration-150 overflow-hidden whitespace-nowrap',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        )}
      >
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex w-full bg-background">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside
          className={cn(
            'h-screen sticky top-0 flex-shrink-0 flex flex-col z-30',
            'bg-sidebar border-r border-border',
            'transition-[width] duration-200 ease-in-out overflow-hidden',
            collapsed ? 'w-[52px]' : 'w-64',
          )}
        >
          {/* Logo */}
          <div className="h-16 flex items-center px-2 border-b border-border flex-shrink-0">
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
                <span className="text-[#256DB6]">ERGO</span>
                <span className="text-[#000000] dark:text-white">GRO</span>
                <span className="text-[#256DB6]">UP</span>
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

            <div className="space-y-0.5">
              {visibleMenuItems.map((item) => {
                const isActive =
                  location.pathname === item.url ||
                  location.pathname.startsWith(item.url + '/');
                return <NavItem key={item.url} item={item} isActive={isActive} collapsed={collapsed} />;
              })}
            </div>

            {!collapsed && <Separator className="my-2" />}

            {!collapsed && (
              <p className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Análise
              </p>
            )}

            <div className="space-y-0.5 mt-0.5">
              {visibleAnalyticsItems.map((item) => {
                const isActive = location.pathname === item.url;
                return <NavItem key={item.url} item={item} isActive={isActive} collapsed={collapsed} />;
              })}
            </div>

            {!collapsed && <Separator className="my-2" />}

            {!collapsed && (
              <p className="px-2 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Administração
              </p>
            )}

            <div className="space-y-0.5 mt-0.5">
              {adminItems.map((item) => {
                const isActive = location.pathname === item.url;
                return <NavItem key={item.url} item={item} isActive={isActive} collapsed={collapsed} />;
              })}
            </div>
          </nav>
        </aside>

        {/* ── Main area ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-auto" style={{ scrollbarGutter: 'stable' }}>

          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={toggle}>
                <PanelLeft className="w-4 h-4" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
              <HeaderSearch />
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 p-0" aria-label="Notificações">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" />
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
                  <Button variant="ghost" className="flex items-center gap-3 h-auto p-2">
                    <Avatar className="w-8 h-8">
                      {currentUser?.foto_perfil ? <AvatarImage src={currentUser.foto_perfil} /> : null}
                      <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
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
    </TooltipProvider>
  );
};

export default DashboardLayout;
