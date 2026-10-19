import { useState, useEffect } from "react";
import { HelpCircle, ChevronRight, User as UserIcon, LogOut, Settings } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TopBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user?: User | null;
}

const TAB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  classes: "Turmas",
  calendar: "Calendário",
  materials: "Materiais",
  "ai-assistant": "IA Assistente",
  achievements: "Conquistas",
  profile: "Perfil",
  admin: "Admin",
};

export const TopBar = ({ activeTab, onTabChange, user }: TopBarProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user?.id]);

  const getInitials = () => {
    const profileName = profile?.username;
    if (profileName) {
      if (profileName.toLowerCase().includes("testealunovictor")) return "TV";
      const parts = profileName.trim().split(/[\s._-]+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return profileName.substring(0, 2).toUpperCase();
    }
    const fullName = user?.user_metadata?.full_name;
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return fullName.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      const namePart = user.email.split("@")[0];
      return namePart.substring(0, 2).toUpperCase();
    }
    return "TV";
  };

  const currentTabLabel = TAB_LABELS[activeTab] || "Dashboard";

  return (
    <>
      <header className="h-14 border-b border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-6 transition-colors">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
          <span className="font-normal text-muted-foreground/80">workspace</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="font-semibold text-foreground">{currentTabLabel}</span>
        </div>

        {/* Right: Help, User Avatar (No Search Bar) */}
        <div className="flex items-center gap-3">
          {/* Help Button */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Central de Ajuda"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center justify-center border border-border/60 hover:ring-2 hover:ring-primary/20 transition-all outline-none cursor-pointer">
                {getInitials()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground">
                    {profile?.username || user?.user_metadata?.full_name || "Usuário"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onTabChange("profile")} className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTabChange("profile")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/auth";
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Help Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="w-5 h-5 text-primary" />
              Central de Ajuda StudySync
            </DialogTitle>
            <DialogDescription>
              Guia rápido para otimizar sua rotina de estudos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs text-muted-foreground py-2">
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

export default TopBar;
