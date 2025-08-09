import { supabase } from "@/integrations/supabase/client";

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function escapeHtml(str?: string | null) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function generateRegistrationPrint(socialRegistrationId: string) {
  console.log("[generateRegistrationPrint] start for", socialRegistrationId);

  const [{ data: reg, error: regErr }] = await Promise.all([
    supabase
      .from("social_registrations")
      .select("*")
      .eq("id", socialRegistrationId)
      .maybeSingle(),
  ]);

  if (regErr || !reg) {
    console.error("[generateRegistrationPrint] error reg:", regErr);
    throw new Error("Não foi possível carregar o cadastro.");
  }

  const [
    { data: family, error: famErr },
    { data: docs, error: docErr },
    { data: history, error: histErr },
    { data: msgs, error: msgErr },
  ] = await Promise.all([
    supabase
      .from("family_compositions")
      .select("*")
      .eq("social_registration_id", socialRegistrationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("documents")
      .select("*")
      .eq("social_registration_id", socialRegistrationId)
      .order("upload_date", { ascending: true }),
    supabase
      .from("registration_tracking")
      .select("*")
      .eq("social_registration_id", socialRegistrationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("messages")
      .select("*")
      .eq("social_registration_id", socialRegistrationId)
      .order("created_at", { ascending: true }),
  ]);

  if (famErr) console.warn("[generateRegistrationPrint] family error:", famErr);
  if (docErr) console.warn("[generateRegistrationPrint] docs error:", docErr);
  if (histErr) console.warn("[generateRegistrationPrint] hist error:", histErr);
  if (msgErr) console.warn("[generateRegistrationPrint] msgs error:", msgErr);

  // Mapa de perfis para identificar quem fez alterações no histórico (updated_by)
  // Ajuste: incluir também o user_id do dono do cadastro para obter seu e-mail
  const updaterIds = Array.from(
    new Set(
      [
        ...((history || []).map((h: any) => h.updated_by).filter(Boolean) as string[]),
        reg.user_id,
      ].filter(Boolean)
    )
  );

  let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {};
  if (updaterIds.length > 0) {
    const { data: profs, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", updaterIds);

    if (!profErr && profs) {
      profs.forEach((p: any) => {
        profilesMap[p.user_id] = {
          full_name: p.full_name ?? null,
          email: p.email ?? null,
        };
      });
    } else {
      console.warn("[generateRegistrationPrint] profiles error:", profErr);
    }
  }

  // E-mail do cidadão (dono do cadastro) vindo de profiles
  const ownerProfile = reg.user_id ? profilesMap[reg.user_id] : undefined;
  const ownerEmailHtml = ownerProfile?.email ? escapeHtml(ownerProfile.email) : "-";

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
    in_review: "Em Análise",
    waiting_documents: "Aguardando Documentos",
    cadastro_criado: "Cadastro criado",
    dados_atualizados: "Dados atualizados",
    documento_enviado: "Documento enviado",
    documento_aprovado: "Documento aprovado",
    documento_rejeitado: "Documento rejeitado",
    documento_atualizado: "Documento atualizado",
    documento_removido: "Documento removido",
    em_analise: "Em análise",
  };

  function labelStatus(s?: string | null) {
    if (!s) return "-";
    return statusLabels[s] || s;
  }

  const html = `
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Cadastro - ${escapeHtml(reg.name)} (${escapeHtml(reg.cpf)})</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #111; margin: 24px; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    h2 { font-size: 16px; margin: 24px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; }
    .row { display: flex; gap: 8px; }
    .muted { color: #555; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; background: #eef2ff; color: #1e3a8a; font-size: 12px; }
    .section { margin-bottom: 16px; }
    @media print {
      .no-print { display: none; }
      body { margin: 0.5cm; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="display:flex; justify-content: flex-end; margin-bottom: 12px;">
    <button onclick="window.print()" style="padding:6px 10px; border:1px solid #ddd; border-radius:6px; background:#fff; cursor:pointer;">Imprimir</button>
  </div>

  <h1>Cadastro do Cidadão</h1>
  <div class="muted">Gerado em ${formatDate(new Date().toISOString())}</div>

  <div class="section">
    <h2>Dados Pessoais</h2>
    <div class="grid">
      <div><strong>Nome:</strong> ${escapeHtml(reg.name)}</div>
      <div><strong>CPF:</strong> ${escapeHtml(reg.cpf)}</div>
      <div><strong>RG:</strong> ${escapeHtml(reg.rg)}</div>
      <div><strong>Data de Nascimento:</strong> ${escapeHtml(reg.birth_date)}</div>
      <div><strong>Telefone:</strong> ${escapeHtml(reg.phone)}</div>
      <div><strong>E-mail:</strong> ${ownerEmailHtml}</div>
      <div><strong>Profissão:</strong> ${escapeHtml(reg.profession)}</div>
      <div><strong>Escolaridade:</strong> ${escapeHtml(reg.education)}</div>
      <div><strong>Estado Civil:</strong> ${escapeHtml(reg.marital_status)}</div>
      <div><strong>Recebe Benefícios:</strong> ${reg.receives_benefits ? "Sim" : "Não"}</div>
      <div><strong>Descrição de Benefícios:</strong> ${escapeHtml(reg.benefits_description)}</div>
      <div><strong>Renda:</strong> ${reg.income ?? "-"}</div>
      <div><strong>Possui Filhos:</strong> ${reg.has_children ? "Sim" : "Não"}</div>
      <div><strong>Situação Habitacional:</strong> ${escapeHtml(reg.housing_situation)}</div>
      <div style="grid-column: span 2;"><strong>Endereço:</strong> ${escapeHtml(reg.address)} - ${escapeHtml(reg.neighborhood)} - ${escapeHtml(reg.city)}, ${escapeHtml(reg.state)} - CEP ${escapeHtml(reg.zip_code)}</div>
      <div style="grid-column: span 2;"><strong>Contato de Emergência:</strong> ${escapeHtml(reg.emergency_contact_name)} — ${escapeHtml(reg.emergency_contact_phone)}</div>
      <div><strong>Status:</strong> <span class="badge">${labelStatus(reg.status)}</span></div>
      <div><strong>Criado em:</strong> ${formatDate(reg.created_at)}</div>
      <div><strong>Atualizado em:</strong> ${formatDate(reg.updated_at)}</div>
    </div>
  </div>

  <div class="section">
    <h2>Composição Familiar</h2>
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Relação</th>
          <th>CPF</th>
          <th>Idade</th>
          <th>Escolaridade</th>
          <th>Profissão</th>
          <th>Renda</th>
          <th>PCD</th>
        </tr>
      </thead>
      <tbody>
        ${(family || [])
          .map((m: any) => `
            <tr>
              <td>${escapeHtml(m.member_name)}</td>
              <td>${escapeHtml(m.relationship)}</td>
              <td>${escapeHtml(m.cpf)}</td>
              <td>${m.age ?? "-"}</td>
              <td>${escapeHtml(m.education)}</td>
              <td>${escapeHtml(m.profession)}</td>
              <td>${m.income ?? "-"}</td>
              <td>${m.has_disability ? "Sim" : "Não"}${m.has_disability && m.disability_description ? " — " + escapeHtml(m.disability_description) : ""}</td>
            </tr>
          `)
          .join("")}
        ${(!family || family.length === 0) ? `<tr><td colspan="8" class="muted">Sem membros cadastrados.</td></tr>` : ""}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Documentos</h2>
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Tipo</th>
          <th>Status</th>
          <th>Tamanho</th>
          <th>Enviado em</th>
        </tr>
      </thead>
      <tbody>
        ${(docs || [])
          .map((d: any) => `
            <tr>
              <td>${escapeHtml(d.document_name)}</td>
              <td>${escapeHtml(d.document_type)}</td>
              <td>${escapeHtml(d.status)}</td>
              <td>${d.file_size ?? "-"}</td>
              <td>${formatDate(d.upload_date)}</td>
            </tr>
          `)
          .join("")}
        ${(!docs || docs.length === 0) ? `<tr><td colspan="5" class="muted">Nenhum documento anexado.</td></tr>` : ""}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Histórico</h2>
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Mensagem</th>
          <th>Atualizado por</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        ${(history || [])
          .map((h: any) => {
            const who = profilesMap[h.updated_by];
            const whoText = who?.full_name || who?.email || h.updated_by;
            return `
              <tr>
                <td>${escapeHtml(statusLabels[h.status] || h.status)}</td>
                <td>${escapeHtml(h.message)}</td>
                <td>${escapeHtml(whoText as string)}</td>
                <td>${formatDate(h.created_at)}</td>
              </tr>
            `;
          })
          .join("")}
        ${(!history || history.length === 0) ? `<tr><td colspan="4" class="muted">Sem registros de histórico.</td></tr>` : ""}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Mensagens</h2>
    <table>
      <thead>
        <tr>
          <th>Mensagem</th>
          <th>Autor (user_id)</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        ${(msgs || [])
          .map((m: any) => `
            <tr>
              <td>${escapeHtml(m.message)}</td>
              <td>${escapeHtml(m.user_id)}</td>
              <td>${formatDate(m.created_at)}</td>
            </tr>
          `)
          .join("")}
        ${(!msgs || msgs.length === 0) ? `<tr><td colspan="3" class="muted">Nenhuma mensagem registrada.</td></tr>` : ""}
      </tbody>
    </table>
  </div>

</body>
</html>
  `;

  // Renderiza em um iframe oculto para evitar bloqueio de pop-up e telas em branco
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const onLoad = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('[generateRegistrationPrint] iframe print() falhou, usuário pode usar o botão na página.');
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }
  };

  iframe.onload = onLoad;
  (iframe as any).srcdoc = html;
}
