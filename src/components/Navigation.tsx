import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Users, Calendar, BookOpen, Trophy, User, Menu, X, Shield, Brain } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/useAdmin";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const baseNavItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, isRoute: false },
    { id: "classes", label: "Turmas", icon: Users, isRoute: false },
    { id: "calendar", label: "Calendário", icon: Calendar, isRoute: false },
    { id: "materials", label: "Materiais", icon: BookOpen, isRoute: false },
    { id: "ai-assistant", label: "IA Assistente", icon: Brain, isRoute: true, route: "/ai-assistant" },
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
      // For non-route items, navigate to Index with tab query param
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
    // Active if on Index with matching tab param
    if (location.pathname === '/') {
      const tab = new URLSearchParams(location.search).get('tab') || 'dashboard';
      return tab === item.id;
    }
    return false;
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-soft">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Study Sync
            </h1>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
          <Card className="absolute top-16 left-4 right-4 p-4 shadow-large">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={isItemActive(item) ? "default" : "ghost"}
                    className="w-full justify-start gap-3"
                    onClick={() => handleNavigation(item)}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-background/95 backdrop-blur-sm border-r shadow-soft z-30">
        <div className="flex flex-col w-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Study Sync
            </h1>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={isItemActive(item) ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-12",
                    isItemActive(item) && "shadow-medium"
                  )}
                  onClick={() => handleNavigation(item)}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="mt-8 p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-foreground">
                🎯 Mantenha o foco!
              </p>
              <p className="text-xs text-muted-foreground">
                Sua dedicação de hoje é o sucesso de amanhã
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t shadow-soft">
        <div className="flex justify-around p-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-col gap-1 h-12 px-2",
                  isItemActive(item) && "text-primary"
                )}
                onClick={() => handleNavigation(item)}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navigation;