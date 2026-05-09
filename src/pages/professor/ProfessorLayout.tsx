import { Outlet } from "react-router-dom";
import { AppShell, NavItem } from "@/components/AppShell";
import { Home, Inbox, Package, Calendar, Wrench, Bell } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";

const items: NavItem[] = [
  { to: "/professor/dashboard", label: "Início", icon: Home },
  { to: "/professor/solicitacoes", label: "Minhas Solicitações", icon: Inbox },
  { to: "/professor/entregas", label: "Minhas Entregas", icon: Package },
  { to: "/professor/cronograma", label: "Meu Cronograma", icon: Calendar },
  { to: "/professor/ferramentas", label: "Ferramentas", icon: Wrench },
  { to: "/professor/notificacoes", label: "Notificações", icon: Bell },
];

export default function ProfessorLayout() {
  return (
    <RoleGuard role="professor_any">
      <AppShell items={items}>
        <Outlet />
      </AppShell>
    </RoleGuard>
  );
}
