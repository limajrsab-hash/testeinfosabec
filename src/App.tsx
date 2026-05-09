import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ProfessorLayout from "./pages/professor/ProfessorLayout";
import ProfessorDashboard from "./pages/professor/Dashboard";
import ProfessorRequests from "./pages/professor/Requests";
import ProfessorDeliveries from "./pages/professor/Deliveries";
import ProfessorSchedule from "./pages/professor/Schedule";
import ProfessorTools from "./pages/professor/Tools";
import ProfessorNotifications from "./pages/professor/Notifications";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCadastros from "./pages/admin/Cadastros";
import AdminRequests from "./pages/admin/Requests";
import AdminSchedules from "./pages/admin/Schedules";
import AdminDeliveries from "./pages/admin/Deliveries";
import AdminJobs from "./pages/admin/Jobs";
import AdminAgents from "./pages/admin/Agents";
import AdminNotifications from "./pages/admin/Notifications";
import AdminFinancial from "./pages/admin/Financial";
import LegislacaoLayout from "./pages/admin/legislacao/LegislacaoLayout";
import LegislacaoTriagem from "./pages/admin/legislacao/Triagem";
import LegislacaoEntregas from "./pages/admin/legislacao/Entregas";
import AssistantLayout from "./pages/assistant/AssistantLayout";
import AssistantDashboard from "./pages/assistant/Dashboard";
import AssistantTriage from "./pages/assistant/Triage";
import AssistantDemandas from "./pages/assistant/Demandas";
import AssistantCronograma from "./pages/assistant/Cronograma";
import AssistantNotifications from "./pages/assistant/Notifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            <Route path="/professor" element={<ProfessorLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ProfessorDashboard />} />
              <Route path="solicitacoes" element={<ProfessorRequests />} />
              <Route path="entregas" element={<ProfessorDeliveries />} />
              <Route path="cronograma" element={<ProfessorSchedule />} />
              <Route path="ferramentas" element={<ProfessorTools />} />
              <Route path="notificacoes" element={<ProfessorNotifications />} />
            </Route>

            <Route path="/assistant" element={<AssistantLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AssistantDashboard />} />
              <Route path="demandas" element={<AssistantDemandas />} />
              <Route path="cronograma" element={<AssistantCronograma />} />
              <Route path="triagem" element={<AssistantTriage />} />
              <Route path="notificacoes" element={<AssistantNotifications />} />
            </Route>

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="cadastros" element={<AdminCadastros />} />
              <Route path="legislacao" element={<LegislacaoLayout />}>
                <Route index element={<Navigate to="triagem" replace />} />
                <Route path="triagem" element={<LegislacaoTriagem />} />
                <Route path="entregas" element={<LegislacaoEntregas />} />
              </Route>
              <Route path="solicitacoes" element={<AdminRequests />} />
              <Route path="cronogramas" element={<AdminSchedules />} />
              <Route path="entregas" element={<AdminDeliveries />} />
              <Route path="financeiro" element={<AdminFinancial />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="agentes" element={<AdminAgents />} />
              <Route path="notificacoes" element={<AdminNotifications />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
