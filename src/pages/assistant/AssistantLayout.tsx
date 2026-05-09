import { Outlet } from "react-router-dom";
import { AppShell, NavItem } from "@/components/AppShell";
import { LayoutDashboard, Inbox, Calendar, ListTodo, Bell } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";

const items: NavItem[] = [
  { to: "/assistant/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant/demandas", label: "Demandas", icon: Inbox },
  { to: "/assistant/cronograma", label: "Cronograma", icon: Calendar },
  { to: "/assistant/triagem", label: "Triagem Legislação", icon: ListTodo },
  { to: "/assistant/notificacoes", label: "Notificações", icon: Bell },
];

export default function AssistantLayout() {
  return (
    <RoleGuard role="assistant">
      <AppShell items={items}>
        <Outlet />
      </AppShell>
    </RoleGuard>
  );
}
