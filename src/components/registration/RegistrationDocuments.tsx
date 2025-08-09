import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DocumentCard } from '@/components/DocumentCard';

interface DocumentItem {
  id: string;
  document_name: string;
  document_type: string;
  file_path: string | null;
  file_type: string | null;
  file_size: number | null;
  status: string | null;
  upload_date: string;
  observations: string | null;
}

interface RegistrationDocumentsProps {
  socialRegistrationId: string;
}

const RegistrationDocuments: React.FC<RegistrationDocumentsProps> = ({ socialRegistrationId }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('social_registration_id', socialRegistrationId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('[RegistrationDocuments] error loading docs:', error);
      setDocuments([]);
    } else {
      setDocuments((data || []) as DocumentItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, [socialRegistrationId]);

  return (
    <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando documentos...</div>
      ) : documents.length === 0 ? (
        <div className="text-sm text-muted-foreground">Nenhum documento enviado.</div>
      ) : (
        documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} canDelete={false} onDelete={loadDocuments} />
        ))
      )}
    </div>
  );
};

export default RegistrationDocuments;
