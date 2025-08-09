
import { supabase } from "@/integrations/supabase/client";

/**
 * Gera uma URL assinada temporária e abre o download do arquivo privado no bucket 'documents'
 * @param filePath caminho do arquivo dentro do bucket (ex: "user-uuid/doc-uuid.pdf")
 * @param filename nome sugerido para o download (opcional)
 */
export async function downloadDocument(filePath: string, filename?: string) {
  console.log("[downloadDocument] path:", filePath, "filename:", filename);
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 60, {
      download: filename || undefined,
    });

  if (error || !data?.signedUrl) {
    console.error("[downloadDocument] error:", error);
    throw new Error("Não foi possível gerar o link de download.");
  }

  // Abre em nova aba (navegador fará o download com o nome sugerido)
  window.open(data.signedUrl, "_blank");
}
