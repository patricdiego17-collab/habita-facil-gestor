
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface HistoryItem {
  id: string;
  status: string;
  message: string | null;
  updated_by: string; // user_id (auth uid)
  created_at: string;
}

interface ProfileInfo {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface RegistrationHistoryProps {
  socialRegistrationId: string;
}

const RegistrationHistory: React.FC<RegistrationHistoryProps> = ({ socialRegistrationId }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      console.log('[RegistrationHistory] Loading for', socialRegistrationId);

      const { data, error } = await supabase
        .from('registration_tracking')
        .select('*')
        .eq('social_registration_id', socialRegistrationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tracking:', error);
        setHistory([]);
        setProfiles({});
        setLoading(false);
        return;
      }

      const items: HistoryItem[] = (data || []).map((r: any) => ({
        id: r.id,
        status: r.status,
        message: r.message ?? null,
        updated_by: r.updated_by,
        created_at: r.created_at,
      }));
      setHistory(items);

      const ids = Array.from(new Set(items.map(i => i.updated_by).filter(Boolean)));
      if (ids.length > 0) {
        const { data: profs, error: pErr } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', ids);

        if (pErr) {
          console.error('Error loading updater profiles:', pErr);
          setProfiles({});
        } else {
          const map: Record<string, ProfileInfo> = {};
          (profs || []).forEach((p: any) => {
            map[p.user_id] = {
              user_id: p.user_id,
              full_name: p.full_name ?? null,
              email: p.email ?? null,
            };
          });
          setProfiles(map);
        }
      } else {
        setProfiles({});
      }

      setLoading(false);
    };

    loadHistory();
  }, [socialRegistrationId]);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      in_review: 'Em Análise',
      waiting_documents: 'Aguardando Documentos',
      cadastro_criado: 'Cadastro criado',
      dados_atualizados: 'Dados atualizados',
      documento_enviado: 'Documento enviado',
      documento_aprovado: 'Documento aprovado',
      documento_rejeitado: 'Documento rejeitado',
      documento_atualizado: 'Documento atualizado',
      documento_removido: 'Documento removido',
      em_analise: 'Em análise',
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando histórico...</div>;
  }

  if (history.length === 0) {
    return <div className="text-sm text-muted-foreground">Sem registros de histórico.</div>;
  }

  return (
    <div className="space-y-3">
      {history.map((h) => {
        const who = profiles[h.updated_by];
        return (
          <Card key={h.id} className="border">
            <CardContent className="py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <Badge variant="outline">{statusLabel(h.status)}</Badge>
                  {h.message && <div className="text-sm">{h.message}</div>}
                  <div className="text-xs text-muted-foreground">
                    por {who?.full_name || who?.email || h.updated_by} • {formatDateTime(h.created_at)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RegistrationHistory;
