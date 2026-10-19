import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  LayoutGrid, 
  Users, 
  Calendar, 
  BookOpen, 
  Trophy, 
  User, 
  Menu, 
  X, 
  Shield, 
  Sparkles,
  HelpCircle,
  Settings
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/useAdmin";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const baseNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid, isRoute: false },
    { id: "classes", label: "Turmas", icon: Users, isRoute: false },
    { id: "calendar", label: "Calendário", icon: Calendar, isRoute: false },
    { id: "materials", label: "Materiais", icon: BookOpen, isRoute: false },
    { id: "ai-assistant", label: "IA Assistente", icon: Sparkles, isRoute: false },
    { id: "achievements", label: "Conquistas", icon: Trophy, isRoute: false },
    { id: "profile", label: "Perfil", icon: User, isRoute: false },
  ];

  const adminNavItems = [
    { id: "admin", label: "Admin", icon: Shield, isRoute: false },
  ];

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  const handleNavigation = (item: any) => {
    if (item.isRoute && item.route) {
      navigate(item.route);
    } else {
      const target = `/?tab=${item.id}`;
      if (location.pathname !== '/' || new URLSearchParams(location.search).get('tab') !== item.id) {
        navigate(target);
      }
      onTabChange(item.id);
    }
    setIsMobileMenuOpen(false);
  };

  const isItemActive = (item: any) => {
    if (item.isRoute && item.route) {
      return location.pathname === item.route;
    }
    if (location.pathname === '/') {
      const tab = new URLSearchParams(location.search).get('tab') || 'dashboard';
      return tab === item.id;
    }
    return activeTab === item.id;
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shadow-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </div>
            <h1 className="text-base font-bold text-foreground tracking-tight">
              StudySync
            </h1>
          </div>
          
          <div className="flex items-center gap-1.5">
            <NotificationsPanel />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm pt-16 px-4">
          <Card className="p-3 shadow-lg border border-border/70 mt-2">
            <div className="text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase px-3 py-1.5">
              WORKSPACE
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);
                return (
                  <button
                    key={item.id}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left font-normal",
                      active
                        ? "bg-neutral-100 dark:bg-neutral-800 text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    )}
                    onClick={() => handleNavigation(item)}
                  >
                    <Icon className={cn("w-4 h-4", active ? "text-foreground" : "text-muted-foreground")} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-card border-r border-border/60 z-30 flex-col">
        <div className="flex flex-col h-full p-4">
          {/* Header: Logo + Notification Bell */}
          <div className="flex items-center justify-between px-2 pt-2 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
              </div>
              <span className="text-base font-bold text-foreground tracking-tight">
                StudySync
              </span>
            </div>
            <NotificationsPanel />
          </div>

          {/* Section: Workspace Navigation */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div className="text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase px-3 py-1.5 select-none">
              WORKSPACE
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);
                return (
                  <button
                    key={item.id}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                      active
                        ? "bg-neutral-100 dark:bg-neutral-800 text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-800/50 font-normal"
                    )}
                    onClick={() => handleNavigation(item)}
                  >
                    <Icon className={cn("w-4 h-4", active ? "text-foreground" : "text-muted-foreground/80")} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Section */}
          <div className="pt-4 mt-auto">
            {/* Focus Card */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-card mb-2 shadow-none">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
                <span className="text-xs font-semibold text-foreground">Mantenha o foco!</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Sua dedicação de hoje é o sucesso de amanhã.
              </p>
            </div>

            {/* Help & Settings Links */}
            <div className="space-y-0.5">
              <button
                onClick={() => setIsHelpOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-lg transition-colors text-left"
              >
                <HelpCircle className="w-4 h-4 text-muted-foreground/80" />
                <span>Central de ajuda</span>
              </button>
              <button
                onClick={() => onTabChange("profile")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-lg transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-muted-foreground/80" />
                <span>Configurações</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Help Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="w-5 h-5 text-primary" />
              Central de Ajuda StudySync
            </DialogTitle>
            <DialogDescription>
              Guia rápido e atalhos para otimizar sua rotina de estudos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs text-muted-foreground py-2">
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 border border-border/60 space-y-1.5">
              <p className="font-semibold text-foreground">💡 Navegação Rápida</p>
              <p>Pressione <kbd className="px-1.5 py-0.5 border rounded bg-white dark:bg-neutral-800 font-mono text-[10px]">⌘ K</kbd> ou <kbd className="px-1.5 py-0.5 border rounded bg-white dark:bg-neutral-800 font-mono text-[10px]">Ctrl K</kbd> para pesquisar e saltar entre turmas, materiais e ferramentas.</p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 border border-border/60 space-y-1.5">
              <p className="font-semibold text-foreground">🤖 IA Assistente</p>
              <p>Envie materiais em PDF ou DOCX nas suas turmas para gerar resumos, flashcards e tirar dúvidas inteligentes com contexto.</p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 border border-border/60 space-y-1.5">
              <p className="font-semibold text-foreground">🏆 Nível & Sequência</p>
              <p>Faça quizzes e estude diariamente para manter sua sequência e acumular XP para subir de nível.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navigation;