import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { generateRegistrationHtml } from "@/utils/print/generateRegistrationPrint";

function normalizeStoragePath(path: string) {
  let p = (path || "").trim().replace(/^\/+/, "");
  if (p.toLowerCase().startsWith("documents/")) {
    p = p.slice("documents/".length);
  }
  return p;
}

function getFileNameFromPath(p?: string | null) {
  if (!p) return "arquivo";
  const cleaned = p.split("?")[0];
  const parts = cleaned.split("/");
  const last = parts[parts.length - 1] || "arquivo";
  return last;
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
}

export async function downloadDossierZip(socialRegistrationId: string) {
  console.log("[downloadDossierZip] start for", socialRegistrationId);

  // Carrega cadastro e documentos para montar o ZIP e nome do arquivo
  const [{ data: reg, error: regErr }, { data: docs, error: docsErr }] = await Promise.all([
    supabase.from("social_registrations").select("id,name,cpf").eq("id", socialRegistrationId).maybeSingle(),
    supabase
      .from("documents")
      .select("id, document_name, file_path, file_type, file_size, upload_date")
      .eq("social_registration_id", socialRegistrationId)
      .order("upload_date", { ascending: true }),
  ]);

  if (regErr || !reg) {
    console.error("[downloadDossierZip] error loading registration:", regErr);
    throw new Error("Não foi possível carregar o cadastro.");
  }

  const documents = (docs || []).filter((d: any) => !!d.file_path);

  // Gera HTML do cadastro para incluir no ZIP
  const html = await generateRegistrationHtml(socialRegistrationId);

  const zip = new JSZip();
  // Pasta principal
  const rootFolder = `${sanitizeName(reg.name || "cadastro")}_${reg.cpf || reg.id}`;
  const folder = zip.folder(rootFolder) as JSZip;
  folder.file("cadastro.html", html);

  // Pasta de anexos
  const anexos = folder.folder("anexos") as JSZip;

  // Baixa anexos em paralelo
  const downloads = documents.map(async (d: any, index: number) => {
    const normalizedPath = normalizeStoragePath(d.file_path as string);
    const suggestedName = d.document_name
      ? sanitizeName(d.document_name + (getFileNameFromPath(normalizedPath).includes(".") ? "" : ""))
      : getFileNameFromPath(normalizedPath);

    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(normalizedPath, 120, {
        download: suggestedName || undefined,
      });

    if (error || !data?.signedUrl) {
      console.warn("[downloadDossierZip] signed URL error for", normalizedPath, error);
      return;
    }

    try {
      const res = await fetch(data.signedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const fileName = sanitizeName(getFileNameFromPath(d.file_path)) || `anexo_${index + 1}`;
      anexos.file(fileName, blob);
    } catch (e) {
      console.error("[downloadDossierZip] fetch error for", normalizedPath, e);
    }
  });

  await Promise.all(downloads);

  const out = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  const url = URL.createObjectURL(out);
  a.href = url;
  const zipName = `dossie_${sanitizeName(reg.name || "cadastro")}_${reg.cpf || reg.id}.zip`;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
