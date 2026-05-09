import { Outlet } from "react-router-dom";
import { AppShell, NavItem } from "@/components/AppShell";
import {
  LayoutDashboard, Users, Scale, Inbox, Calendar, Package, DollarSign, Wrench, Bot, Bell,
} from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";

const items: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/cadastros", label: "Cadastros", icon: Users },
  { to: "/admin/legislacao/triagem", label: "Equipe Legislação", icon: Scale },
  { to: "/admin/solicitacoes", label: "Solicitações", icon: Inbox },
  { to: "/admin/cronogramas", label: "Cronogramas", icon: Calendar },
  { to: "/admin/entregas", label: "Entregas", icon: Package },
  { to: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
  { to: "/admin/jobs", label: "Jobs / Ferramentas", icon: Wrench },
  { to: "/admin/agentes", label: "Agentes de IA", icon: Bot },
  { to: "/admin/notificacoes", label: "Notificações", icon: Bell },
];

export default function AdminLayout() {
  return (
    <RoleGuard role="admin">
      <AppShell items={items}>
        <Outlet />
      </AppShell>
    </RoleGuard>
  );
}
