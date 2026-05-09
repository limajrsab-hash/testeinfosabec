import { Outlet, NavLink } from "react-router-dom";

export default function LegislacaoLayout() {
  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-border">
        <NavLink to="/admin/legislacao/triagem" className={({ isActive }) =>
          `px-4 py-2 text-sm font-medium ${isActive ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>Triagem</NavLink>
        <NavLink to="/admin/legislacao/entregas" className={({ isActive }) =>
          `px-4 py-2 text-sm font-medium ${isActive ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>Entregas</NavLink>
      </div>
      <Outlet />
    </div>
  );
}
