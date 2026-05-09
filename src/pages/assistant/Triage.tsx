import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import TriagemLegislacao from "@/pages/shared/TriagemLegislacao";

export default function AssistantTriagemRoute() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("assistant_teams").select("team_id, teams(is_legislacao)")
        .eq("assistant_id", user.id);
      // genérico (sem vínculo) ou vinculado a equipe legislação
      const isGenericOrLeg = !data || data.length === 0 || data.some((d: any) => d.teams?.is_legislacao);
      setAllowed(isGenericOrLeg);
    })();
  }, [user]);

  if (allowed === null) return null;
  if (!allowed) return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      Você não tem acesso à triagem desta equipe.
    </div>
  );
  return <TriagemLegislacao />;
}
