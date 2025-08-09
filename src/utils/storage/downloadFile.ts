
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

  // Faz download via Blob para evitar bloqueio de pop-up e garantir nome do arquivo
  try {
    const res = await fetch(data.signedUrl);
    if (!res.ok) {
      console.error("[downloadDocument] fetch failed status:", res.status);
      throw new Error("Falha ao baixar o arquivo");
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || filePath.split('/').pop() || 'documento';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error("[downloadDocument] blob download error, opening fallback:", err);
    // Fallback para abrir em nova aba caso o fetch falhe
    window.open(data.signedUrl, "_blank");
  }
}
