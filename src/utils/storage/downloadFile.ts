
import { supabase } from "@/integrations/supabase/client";

/**
 * Gera uma URL assinada temporária e abre o download do arquivo privado no bucket 'documents'
 * @param filePath caminho do arquivo dentro do bucket (ex: "user-uuid/doc-uuid.pdf" ou "documents/user-uuid/doc.pdf")
 * @param filename nome sugerido para o download (opcional)
 */
function normalizeStoragePath(path: string) {
  let p = (path || "").trim().replace(/^\/+/, "");
  if (p.toLowerCase().startsWith("documents/")) {
    p = p.slice("documents/".length);
  }
  return p;
}

function ensureExtension(nameFromUser: string | undefined, storagePath: string) {
  const pathExt = storagePath.includes(".") ? storagePath.split(".").pop() : undefined;
  if (!nameFromUser) return storagePath.split("/").pop() || "documento";
  const hasDot = nameFromUser.includes(".");
  if (!hasDot && pathExt) {
    return `${nameFromUser}.${pathExt}`;
  }
  return nameFromUser;
}

export async function downloadDocument(filePath: string, filename?: string) {
  const normalizedPath = normalizeStoragePath(filePath);
  console.log("[downloadDocument] original path:", filePath, "normalized:", normalizedPath, "filename:", filename);

  const suggestedName = ensureExtension(filename, normalizedPath);

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(normalizedPath, 60, {
      download: suggestedName || undefined,
    });

  if (error || !data?.signedUrl) {
    console.error("[downloadDocument] error creating signed URL:", error);
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
    a.download = suggestedName || normalizedPath.split('/').pop() || 'documento';
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
