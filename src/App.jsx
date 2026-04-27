import { useState } from "react";
import CONFIG from "./config";

// ── Helpers ──
const formatarTel = (v) => {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
};
const formatarData = (v) => {
  const n = v.replace(/\D/g, "").slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
};
const formatarCPF = (v) => v.replace(/\D/g, "").slice(0, 11);
const formatadores = { text: (v) => v, cpf: formatarCPF, data: formatarData, email: (v) => v };

// ── Validadores de célula ──
const validarCelula = (valor, tipo) => {
  if (!valor || !valor.trim()) return "Campo obrigatório";
  const v = valor.trim();
  if (tipo === "cpf") {
    const nums = v.replace(/\D/g, "");
    if (nums.length !== 11) return "CPF deve ter 11 dígitos";
  }
  if (tipo === "data") {
    const nums = v.replace(/\D/g, "");
    if (nums.length < 8) return "Data incompleta";
  }
  if (tipo === "email") {
    if (!v.includes("@")) return "Email inválido";
  }
  return null;
};

// ── Colunas esperadas na importação ──
const gerarColunas = () => {
  const cols = [
    { key: "contato", label: "CONTATO", tipo: "text" },
    { key: "responsavel", label: "RESPONSÁVEL", tipo: "text" },
  ];
  CONFIG.camposTitular.forEach((c) => cols.push({ key: c.id, label: c.label.toUpperCase(), tipo: c.tipo }));
  CONFIG.programas.forEach((p) => {
    cols.push({ key: `email_${p.id}`, label: `EMAIL ${p.nome.toUpperCase()}`, tipo: "email" });
    cols.push({ key: `senha_${p.id}`, label: `SENHA ${p.nome.toUpperCase()}`, tipo: "text" });
  });
  return cols;
};

const COLUNAS = gerarColunas();

// ── Entrada vazia ──
const criarEntradaVazia = () => {
  const e = { id: Date.now() + Math.random() };
  CONFIG.camposTitular.forEach((c) => { e[c.id] = ""; });
  CONFIG.programas.forEach((p) => { e[`email_${p.id}`] = ""; e[`senha_${p.id}`] = ""; });
  return e;
};

// ── Input (fora do componente pra evitar bug de foco) ──
function Input({ label, value, onChange, placeholder, type = "text", senhaKey, senhasVisiveis, toggleSenha, cores, erro }) {
  const temErro = !!erro;
  return (
    <div style={st.field}>
      <label style={{ ...st.label, color: temErro ? cores.erroCor : cores.textoSuave }}>{label}</label>
      {senhaKey ? (
        <div style={st.senhaWrap}>
          <input
            style={{ ...st.input, paddingRight: 42, background: cores.inputFundo, borderColor: temErro ? cores.erroCor : cores.inputBorda, color: cores.texto }}
            type={senhasVisiveis[senhaKey] ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder}
          />
          <button style={st.eyeBtn} onClick={() => toggleSenha(senhaKey)} type="button">{senhasVisiveis[senhaKey] ? "🙈" : "👁"}</button>
        </div>
      ) : (
        <input style={{ ...st.input, background: cores.inputFundo, borderColor: temErro ? cores.erroCor : cores.inputBorda, color: cores.texto }} type={type} value={value} onChange={onChange} placeholder={placeholder} />
      )}
      {temErro && <span style={{ fontSize: 11, color: cores.erroCor, marginTop: 2 }}>{erro}</span>}
    </div>
  );
}

// ══════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════
export default function App() {
  const [etapa, setEtapa] = useState("form"); // form | revisao | enviando | sucesso | erro | consulta
  const [modo, setModo] = useState("manual");
  const [contato, setContato] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [entradas, setEntradas] = useState([criarEntradaVazia()]);
  const [erroMsg, setErroMsg] = useState("");
  const [senhasVisiveis, setSenhasVisiveis] = useState({});
  const [expandido, setExpandido] = useState({});
  const [textoImport, setTextoImport] = useState("");
  const [previewRows, setPreviewRows] = useState([]);
  const [previewErros, setPreviewErros] = useState([]);
  const [qtdEnviada, setQtdEnviada] = useState(0);
  const [rowsParaEnviar, setRowsParaEnviar] = useState([]);

  // Consulta
  const [consultaCpf, setConsultaCpf] = useState("");
  const [consultaResultado, setConsultaResultado] = useState(null);
  const [consultaCarregando, setConsultaCarregando] = useState(false);
  const [consultaErro, setConsultaErro] = useState("");

  const c = CONFIG.cores;

  // ── Funções do formulário manual ──
  const atualizarEntrada = (id, campo, valor) => setEntradas(entradas.map((e) => (e.id === id ? { ...e, [campo]: valor } : e)));
  const adicionarEntrada = () => { const n = criarEntradaVazia(); setEntradas([...entradas, n]); setExpandido((p) => ({ ...p, [n.id]: true })); };
  const removerEntrada = (id) => { if (entradas.length > 1) setEntradas(entradas.filter((e) => e.id !== id)); };
  const toggleSenha = (key) => setSenhasVisiveis((p) => ({ ...p, [key]: !p[key] }));
  const toggleExpand = (id) => setExpandido((p) => ({ ...p, [id]: !p[id] }));

  // ── Validação manual ──
  const validar = () => {
    if (!contato.trim() || contato.replace(/\D/g, "").length < 10) return "Preencha um contato válido.";
    if (!responsavel.trim()) return "Preencha o nome do responsável.";
    for (let i = 0; i < entradas.length; i++) {
      const e = entradas[i];
      for (const campo of CONFIG.camposTitular) {
        const err = validarCelula(e[campo.id], campo.tipo);
        if (err) return `Conta ${i + 1}: ${campo.label} — ${err.toLowerCase()}.`;
      }
      for (const prog of CONFIG.programas) {
        const errE = validarCelula(e[`email_${prog.id}`], "email");
        if (errE) return `Conta ${i + 1}: Email ${prog.nome} — ${errE.toLowerCase()}.`;
        const errS = validarCelula(e[`senha_${prog.id}`], "text");
        if (errS) return `Conta ${i + 1}: Senha ${prog.nome} — ${errS.toLowerCase()}.`;
      }
    }
    return null;
  };

  // ── Montar rows do manual ──
  const montarRowsManual = () => entradas.map((e) => {
    const row = { contato, responsavel: responsavel.trim() };
    CONFIG.camposTitular.forEach((campo) => { row[campo.id] = campo.tipo === "cpf" ? e[campo.id].replace(/\D/g, "") : e[campo.id]; });
    CONFIG.programas.forEach((prog) => { row[`email_${prog.id}`] = e[`email_${prog.id}`].trim(); row[`senha_${prog.id}`] = e[`senha_${prog.id}`]; });
    return row;
  });

  // ── Parser de importação com validação ──
  const parsearImport = (texto) => {
    const linhas = texto.trim().split("\n");
    const rows = [];
    const erros = [];
    let buffer = "";

    for (const linha of linhas) {
      const merged = buffer ? buffer + "\t" + linha.trim() : linha;
      const celulas = merged.split("\t");

      if (celulas.length < COLUNAS.length) {
        buffer = merged;
        continue;
      }

      buffer = "";
      const row = {};
      const rowErros = {};
      COLUNAS.forEach((col, i) => {
        let val = (celulas[i] || "").trim();
        if (col.tipo === "cpf") val = val.replace(/\D/g, "");
        row[col.key] = val;
        const err = validarCelula(val, col.tipo);
        if (err) rowErros[col.key] = err;
      });
      rows.push(row);
      erros.push(rowErros);
    }
    return { rows, erros };
  };

  const handleTextoImport = (texto) => {
    setTextoImport(texto);
    setErroMsg("");
    const { rows, erros } = parsearImport(texto);
    setPreviewRows(rows);
    setPreviewErros(erros);
  };

  const temErrosImport = () => previewErros.some((e) => Object.keys(e).length > 0);

  // ── Ir pra revisão ──
  const irParaRevisao = (rows) => {
    setRowsParaEnviar(rows);
    setQtdEnviada(rows.length);
    setEtapa("revisao");
  };

  const handleEnviarManual = () => {
    const erro = validar();
    if (erro) { setErroMsg(erro); return; }
    setErroMsg("");
    irParaRevisao(montarRowsManual());
  };

  const handleEnviarImport = () => {
    if (previewRows.length === 0) { setErroMsg("Nenhuma linha válida."); return; }
    if (temErrosImport()) { setErroMsg("Corrija os erros destacados antes de enviar."); return; }
    setErroMsg("");
    irParaRevisao(previewRows);
  };

  // ── Envio final ──
  const confirmarEnvio = async () => {
    setEtapa("enviando");
    const payload = { aba: CONFIG.abaPlanilha, rows: rowsParaEnviar };

    if (!CONFIG.appsScriptUrl) {
      console.log("Payload (demo):", JSON.stringify(payload, null, 2));
      await new Promise((r) => setTimeout(r, 1500));
      setEtapa("sucesso");
      return;
    }
    try {
      await fetch(CONFIG.appsScriptUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setEtapa("sucesso");
    } catch { setEtapa("erro"); }
  };

  // ── Consulta por CPF ──
  const consultarCpf = async () => {
    const cpf = consultaCpf.replace(/\D/g, "");
    if (cpf.length !== 11) { setConsultaErro("Digite um CPF válido com 11 dígitos."); return; }
    setConsultaErro("");
    setConsultaCarregando(true);
    setConsultaResultado(null);
    try {
      const url = `${CONFIG.appsScriptUrl}?action=consultar&cpf=${cpf}&aba=${encodeURIComponent(CONFIG.abaPlanilha)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.rows && data.rows.length > 0) {
        setConsultaResultado(data.rows);
      } else {
        setConsultaErro("Nenhum cadastro encontrado com esse CPF nesta promoção.");
      }
    } catch {
      setConsultaErro("Erro ao consultar. Tente novamente.");
    }
    setConsultaCarregando(false);
  };

  const reenviarCorrecao = async (rowCorrigido) => {
    setConsultaCarregando(true);
    const payload = { aba: CONFIG.abaPlanilha, rows: [rowCorrigido], action: "atualizar" };
    try {
      await fetch(CONFIG.appsScriptUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setConsultaErro("");
      setConsultaResultado(null);
      setConsultaCpf("");
      alert("Dados atualizados com sucesso!");
    } catch {
      setConsultaErro("Erro ao atualizar.");
    }
    setConsultaCarregando(false);
  };

  const resetar = () => {
    setContato(""); setResponsavel(""); setEntradas([criarEntradaVazia()]);
    setSenhasVisiveis({}); setExpandido({}); setTextoImport(""); setPreviewRows([]);
    setPreviewErros([]); setErroMsg(""); setRowsParaEnviar([]); setEtapa("form");
  };

  const getPreview = (ent) => CONFIG.programas.map((p) => ent[`email_${p.id}`] ? `${p.nome}: ${ent[`email_${p.id}`]}` : "").filter(Boolean).join(" · ");
  const getNomeConta = (ent, idx) => { const t = CONFIG.camposTitular.find((ct) => ct.id === "titularNome"); return (t && ent[t.id]) || `Conta ${idx + 1}`; };

  const mostrarAbas = CONFIG.permitirImportacao;

  // ══════════════════════════════════
  // RENDER
  // ══════════════════════════════════
  return (
    <div style={{ ...st.page, background: c.fundo, color: c.texto }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ ...st.topBand, background: `linear-gradient(90deg, ${c.primaria}, ${c.destaque}, ${c.primaria})` }}><div style={st.bandPattern} /></div>

      {/* ── HERO ── */}
      {(etapa === "form" || etapa === "revisao") && (
        <section style={st.hero}>
          <div style={{ ...st.promoTag, background: c.primaria, color: c.destaque }}>Promoção Exclusiva</div>
          <h1 style={{ ...st.title, color: c.primaria }}>{CONFIG.titulo}<br /><span style={{ ...st.titleAccent, color: c.destaque }}>{CONFIG.tituloDestaque}</span></h1>
          <p style={{ ...st.subtitle, color: c.textoSuave }}>{CONFIG.subtitulo}</p>
          <div style={st.chips}>
            {CONFIG.programas.map((p) => (<span key={p.id} style={{ ...st.chip, background: p.cor + "12", color: p.cor, borderColor: p.cor + "30" }}>{p.emoji} {p.nome}</span>))}
          </div>
        </section>
      )}

      {/* ══════ FORMULÁRIO ══════ */}
      {etapa === "form" && (
        <section style={st.formWrap}>
          {mostrarAbas && (
            <div style={st.tabBar}>
              <button style={{ ...st.tab, ...(modo === "manual" ? { background: c.primaria, color: c.destaque } : { background: "transparent", color: c.textoSuave }) }} onClick={() => { setModo("manual"); setErroMsg(""); }}>✍️ Preencher manual</button>
              <button style={{ ...st.tab, ...(modo === "importar" ? { background: c.primaria, color: c.destaque } : { background: "transparent", color: c.textoSuave }) }} onClick={() => { setModo("importar"); setErroMsg(""); }}>📋 Importar planilha</button>
            </div>
          )}

          {/* MANUAL */}
          {modo === "manual" && (<>
            <div style={{ ...st.card, background: c.cardFundo }}>
              <div style={st.cardIcon}>👤</div>
              <h2 style={{ ...st.cardTitle, color: c.texto }}>Responsável</h2>
              <div style={st.cardGrid2}>
                <Input label="Nome do responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Seu nome" cores={c} />
                <Input label="Contato (WhatsApp)" value={contato} onChange={(e) => setContato(formatarTel(e.target.value))} placeholder="(21) 99999-9999" cores={c} />
              </div>
            </div>
            {entradas.map((ent, idx) => {
              const isOpen = expandido[ent.id] !== false;
              return (
                <div key={ent.id} style={{ ...st.card, background: c.cardFundo }}>
                  <div style={st.contaHeaderRow} onClick={() => toggleExpand(ent.id)}>
                    <div style={st.contaHeaderLeft}>
                      <div style={{ ...st.contaNum, background: c.destaque, color: c.primaria }}>{idx + 1}</div>
                      <div>
                        <h2 style={{ ...st.cardTitle2, color: c.texto }}>{getNomeConta(ent, idx)}</h2>
                        {!isOpen && <span style={st.contaPreview}>{getPreview(ent)}</span>}
                      </div>
                    </div>
                    <div style={st.contaActions}>
                      {entradas.length > 1 && <button style={st.removeBtn} onClick={(ev) => { ev.stopPropagation(); removerEntrada(ent.id); }}>✕</button>}
                      <span style={{ ...st.chevron, transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={st.contaBody}>
                      <div style={st.sectionLabel}><span style={{ ...st.sectionDot, background: c.primaria }} />Dados do titular</div>
                      <div style={st.cardGrid3}>
                        {CONFIG.camposTitular.map((campo) => (
                          <Input key={campo.id} label={campo.label} value={ent[campo.id]}
                            onChange={(e) => atualizarEntrada(ent.id, campo.id, (formatadores[campo.tipo] || formatadores.text)(e.target.value))}
                            placeholder={campo.placeholder} cores={c} />
                        ))}
                      </div>
                      {CONFIG.programas.map((prog) => (
                        <div key={prog.id}>
                          <div style={st.sectionLabel}><span style={{ ...st.sectionDot, background: prog.cor }} />{prog.nome}</div>
                          <div style={st.cardGrid2}>
                            <Input label="Email da conta" value={ent[`email_${prog.id}`]} onChange={(e) => atualizarEntrada(ent.id, `email_${prog.id}`, e.target.value)} placeholder={`email@${prog.id}.com`} cores={c} />
                            <Input label="Senha" value={ent[`senha_${prog.id}`]} onChange={(e) => atualizarEntrada(ent.id, `senha_${prog.id}`, e.target.value)} placeholder="••••••••" senhaKey={`${prog.id}-${ent.id}`} senhasVisiveis={senhasVisiveis} toggleSenha={toggleSenha} cores={c} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <button style={{ ...st.addBtn, background: c.cardFundo }} onClick={adicionarEntrada}><span style={{ ...st.addPlus, background: c.destaque, color: c.primaria }}>+</span>Adicionar outra conta</button>
            {erroMsg && <div style={{ ...st.erroBox, color: c.erroCor }}>⚠ {erroMsg}</div>}
            <button style={{ ...st.submitBtn, background: c.primaria, color: c.destaque }} onClick={handleEnviarManual}>Revisar e enviar<span style={st.arrow}>→</span></button>
          </>)}

          {/* IMPORTAR */}
          {modo === "importar" && (<>
            <div style={{ ...st.card, background: c.cardFundo }}>
              <div style={st.cardIcon}>📋</div>
              <h2 style={{ ...st.cardTitle, color: c.texto }}>Importar da planilha</h2>
              <p style={{ ...st.importDesc, color: c.textoSuave }}>Copie as linhas da sua planilha e cole no campo abaixo. As colunas devem estar nesta ordem:</p>
              <div style={st.formatBox}>
                <div style={st.formatHeader}>Formato esperado ({COLUNAS.length} colunas):</div>
                <div style={st.formatCols}>
                  {COLUNAS.map((col, i) => (<span key={i} style={{ ...st.formatTag, background: c.primaria + "12", color: c.primaria, borderColor: c.primaria + "25" }}>{i + 1}. {col.label}</span>))}
                </div>
              </div>
              <textarea style={{ ...st.textarea, background: c.inputFundo, borderColor: c.inputBorda, color: c.texto }}
                placeholder="Cole aqui as linhas copiadas da planilha...\nCada linha = uma conta\nAs colunas são separadas por TAB (copiar do Excel/Sheets faz isso automaticamente)"
                value={textoImport} onChange={(e) => handleTextoImport(e.target.value)} rows={8} />

              {/* Preview com validação */}
              {previewRows.length > 0 && (
                <div style={st.previewBox}>
                  <div style={{ ...st.previewHeader, color: c.primaria }}>
                    {temErrosImport()
                      ? `⚠ ${previewRows.length} linha(s) — corrija os campos em vermelho`
                      : `✓ ${previewRows.length} linha(s) válida(s)`}
                  </div>
                  <div style={st.previewScroll}>
                    <table style={st.previewTable}>
                      <thead><tr>{COLUNAS.map((col, i) => (<th key={i} style={{ ...st.previewTh, background: c.primaria, color: c.destaque }}>{col.label}</th>))}</tr></thead>
                      <tbody>
                        {previewRows.slice(0, 10).map((row, ri) => (
                          <tr key={ri}>
                            {COLUNAS.map((col, ci) => {
                              const err = previewErros[ri]?.[col.key];
                              return (
                                <td key={ci} style={{ ...st.previewTd, ...(err ? { background: "#fef2f2", color: c.erroCor } : {}) }} title={err || ""}>
                                  {row[col.key] || "—"}
                                  {err && <span style={{ display: "block", fontSize: 9, opacity: 0.8 }}>{err}</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewRows.length > 10 && <p style={{ ...st.previewMore, color: c.textoSuave }}>... e mais {previewRows.length - 10}</p>}
                </div>
              )}
              {textoImport && previewRows.length === 0 && (
                <div style={{ ...st.erroBox, color: c.erroCor }}>⚠ Nenhuma linha válida. Verifique se há {COLUNAS.length} colunas separadas por TAB.</div>
              )}
            </div>
            {erroMsg && <div style={{ ...st.erroBox, color: c.erroCor }}>⚠ {erroMsg}</div>}
            <button style={{ ...st.submitBtn, background: c.primaria, color: c.destaque, opacity: previewRows.length === 0 || temErrosImport() ? 0.5 : 1 }}
              onClick={handleEnviarImport} disabled={previewRows.length === 0 || temErrosImport()}>
              Revisar e enviar {previewRows.length} linha{previewRows.length !== 1 ? "s" : ""}<span style={st.arrow}>→</span>
            </button>
          </>)}

          <p style={st.disclaimer}>🔒 Dados enviados com segurança direto para a equipe {CONFIG.empresa}.</p>

          {/* Link pra consulta */}
          {CONFIG.permitirConsulta && (
            <p style={{ ...st.disclaimer, marginTop: 20 }}>
              Já enviou e precisa corrigir?{" "}
              <button style={st.linkBtn} onClick={() => setEtapa("consulta")}>Consulte aqui pelo CPF</button>
            </p>
          )}
        </section>
      )}

      {/* ══════ TELA DE REVISÃO ══════ */}
      {etapa === "revisao" && (
        <section style={st.formWrap}>
          <div style={{ ...st.card, background: c.cardFundo }}>
            <h2 style={{ ...st.cardTitle, color: c.texto }}>📝 Confira seus dados antes de enviar</h2>
            <p style={{ ...st.importDesc, color: c.textoSuave }}>Revise as informações abaixo. Se algo estiver errado, volte e corrija.</p>
            <div style={st.previewScroll}>
              <table style={st.previewTable}>
                <thead><tr>{COLUNAS.map((col, i) => (<th key={i} style={{ ...st.previewTh, background: c.primaria, color: c.destaque }}>{col.label}</th>))}</tr></thead>
                <tbody>
                  {rowsParaEnviar.map((row, ri) => (
                    <tr key={ri}>
                      {COLUNAS.map((col, ci) => (<td key={ci} style={st.previewTd}>{row[col.key] || "—"}</td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...st.submitBtn, flex: 1, background: "#e8e5dd", color: c.texto, boxShadow: "none" }} onClick={() => setEtapa("form")}>← Voltar e editar</button>
            <button style={{ ...st.submitBtn, flex: 2, background: c.primaria, color: c.destaque }} onClick={confirmarEnvio}>Confirmar envio ({qtdEnviada})<span style={st.arrow}>→</span></button>
          </div>
        </section>
      )}

      {/* ══════ CONSULTA POR CPF ══════ */}
      {etapa === "consulta" && (
        <section style={st.formWrap}>
          <div style={{ ...st.card, background: c.cardFundo }}>
            <h2 style={{ ...st.cardTitle, color: c.texto }}>🔍 Consultar cadastro</h2>
            <p style={{ ...st.importDesc, color: c.textoSuave }}>Digite o CPF para buscar e corrigir dados enviados nesta promoção.</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <input style={{ ...st.input, flex: 1, background: c.inputFundo, borderColor: c.inputBorda, color: c.texto }}
                placeholder="Digite o CPF (só números)" value={consultaCpf}
                onChange={(e) => setConsultaCpf(formatarCPF(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && consultarCpf()} />
              <button style={{ ...st.submitBtn, width: "auto", padding: "11px 24px", background: c.primaria, color: c.destaque }}
                onClick={consultarCpf} disabled={consultaCarregando}>
                {consultaCarregando ? "..." : "Buscar"}
              </button>
            </div>

            {consultaErro && <div style={{ ...st.erroBox, color: c.erroCor }}>⚠ {consultaErro}</div>}

            {/* Resultado da consulta */}
            {consultaResultado && consultaResultado.map((row, ri) => (
              <ConsultaRow key={ri} row={row} cores={c} onReenviar={reenviarCorrecao} carregando={consultaCarregando} />
            ))}
          </div>

          <button style={{ ...st.submitBtn, background: "#e8e5dd", color: c.texto, boxShadow: "none" }} onClick={() => { setEtapa("form"); setConsultaResultado(null); setConsultaCpf(""); setConsultaErro(""); }}>
            ← Voltar ao formulário
          </button>
        </section>
      )}

      {/* ══════ STATUS ══════ */}
      {etapa === "enviando" && (
        <div style={st.statusBox}>
          <div style={{ ...st.spinner, borderTopColor: c.primaria }} />
          <h2 style={{ ...st.statusTitle, color: c.texto }}>Enviando...</h2>
          <p style={{ ...st.statusSub, color: c.textoSuave }}>Aguarde um instante</p>
        </div>
      )}
      {etapa === "sucesso" && (
        <div style={st.statusBox}>
          <div style={{ ...st.successIcon, background: c.destaque + "30", color: c.primaria }}>✓</div>
          <h2 style={{ ...st.statusTitle, color: c.texto }}>Cadastro enviado!</h2>
          <p style={{ ...st.statusSub, color: c.textoSuave }}>{qtdEnviada} conta{qtdEnviada > 1 ? "s" : ""} registrada{qtdEnviada > 1 ? "s" : ""}. {CONFIG.mensagemSucesso}</p>
          <button style={{ ...st.resetBtn, background: c.destaque, color: c.primaria }} onClick={resetar}>Novo cadastro</button>
        </div>
      )}
      {etapa === "erro" && (
        <div style={st.statusBox}>
          <div style={{ ...st.successIcon, background: "#fee", color: "#c00" }}>!</div>
          <h2 style={{ ...st.statusTitle, color: c.texto }}>Erro no envio</h2>
          <p style={{ ...st.statusSub, color: c.textoSuave }}>Tente novamente ou entre em contato.</p>
          <button style={{ ...st.resetBtn, background: c.destaque, color: c.primaria }} onClick={() => setEtapa("form")}>Tentar novamente</button>
        </div>
      )}

      <footer style={st.footer}>{CONFIG.rodape}</footer>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder, textarea::placeholder { color: #a0a0a0; }
        input:focus, textarea:focus { outline: none; border-color: ${c.primaria} !important; box-shadow: 0 0 0 3px ${c.primaria}12; }
        button { cursor: pointer; transition: all .15s; }
        button:active { transform: scale(0.97); }
        button:disabled { cursor: not-allowed; }
      `}</style>
    </div>
  );
}

// ── Componente de resultado da consulta (editável) ──
function ConsultaRow({ row, cores, onReenviar, carregando }) {
  const [editando, setEditando] = useState(false);
  const [dados, setDados] = useState({ ...row });
  const c = cores;

  const update = (key, val) => setDados((p) => ({ ...p, [key]: val }));

  if (!editando) {
    return (
      <div style={{ ...st.contaBody, marginTop: 0, paddingTop: 14, borderTop: "1px solid #f0ede6", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <strong style={{ color: c.texto }}>{dados.responsavel || "—"}</strong>
          <button style={{ ...st.formatTag, background: c.destaque, color: c.primaria, border: "none", cursor: "pointer", fontWeight: 700 }} onClick={() => setEditando(true)}>Editar</button>
        </div>
        {COLUNAS.map((col) => (
          <div key={col.key} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, borderBottom: "1px solid #f5f3ee" }}>
            <span style={{ color: c.textoSuave, fontSize: 11, textTransform: "uppercase" }}>{col.label}</span>
            <span style={{ color: c.texto }}>{dados[col.key] || "—"}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ ...st.contaBody, marginTop: 0, paddingTop: 14, borderTop: "1px solid #f0ede6", marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: c.primaria, marginBottom: 12 }}>Editando cadastro:</div>
      {COLUNAS.map((col) => (
        <div key={col.key} style={{ marginBottom: 8 }}>
          <label style={{ ...st.label, color: c.textoSuave, marginBottom: 4, display: "block" }}>{col.label}</label>
          <input style={{ ...st.input, background: c.inputFundo, borderColor: c.inputBorda, color: c.texto }}
            value={dados[col.key] || ""} onChange={(e) => update(col.key, e.target.value)} />
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button style={{ ...st.formatTag, background: "#e8e5dd", color: c.texto, border: "none", cursor: "pointer", padding: "8px 16px" }} onClick={() => setEditando(false)}>Cancelar</button>
        <button style={{ ...st.formatTag, background: c.primaria, color: c.destaque, border: "none", cursor: "pointer", padding: "8px 16px", fontWeight: 700 }}
          onClick={() => onReenviar(dados)} disabled={carregando}>{carregando ? "Salvando..." : "Salvar correção"}</button>
      </div>
    </div>
  );
}

// ── Estilos ──
const st = {
  page: { minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative" },
  topBand: { height: 6, position: "relative", overflow: "hidden" },
  bandPattern: { position: "absolute", inset: 0, background: "repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff20 40px, #ffffff20 42px)" },
  hero: { textAlign: "center", padding: "40px 24px 28px", animation: "fadeUp .5s ease-out" },
  promoTag: { display: "inline-block", fontSize: 11, fontWeight: 700, padding: "5px 16px", borderRadius: 20, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 },
  title: { fontFamily: "'Sora', sans-serif", fontSize: 38, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 12 },
  titleAccent: { textShadow: "1px 1px 0 #1A3C3425", fontSize: 48 },
  subtitle: { fontSize: 15, maxWidth: 380, margin: "0 auto 18px", lineHeight: 1.6, fontWeight: 400 },
  chips: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 },
  chip: { fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 20, border: "1px solid" },
  formWrap: { maxWidth: 580, margin: "0 auto", padding: "0 16px 40px", animation: "fadeUp .5s ease-out .15s both" },
  tabBar: { display: "flex", gap: 4, marginBottom: 14, background: "#e8e5dd", borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: "10px 12px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all .2s" },
  card: { borderRadius: 14, padding: "22px 22px 18px", marginBottom: 14, border: "1px solid #e8e5dd", boxShadow: "0 1px 3px #0000000a" },
  cardIcon: { fontSize: 20, marginBottom: 6 },
  cardTitle: { fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16 },
  cardTitle2: { fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, margin: 0 },
  contaHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" },
  contaHeaderLeft: { display: "flex", alignItems: "center", gap: 12 },
  contaNum: { width: 32, height: 32, borderRadius: 8, fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  contaPreview: { fontSize: 12, color: "#8a9a94", marginTop: 2, display: "block" },
  contaActions: { display: "flex", alignItems: "center", gap: 8 },
  chevron: { fontSize: 16, color: "#8a9a94", transition: "transform .2s" },
  removeBtn: { width: 26, height: 26, borderRadius: 6, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  contaBody: { marginTop: 18, paddingTop: 16, borderTop: "1px solid #f0ede6" },
  sectionLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#6a8a80", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, marginTop: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, display: "inline-block" },
  cardGrid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 },
  cardGrid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 8 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", padding: "11px 12px", border: "1.5px solid", borderRadius: 8, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all .2s" },
  senhaWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 14, padding: 4 },
  addBtn: { width: "100%", padding: 14, border: "2px dashed #d4d0c8", borderRadius: 12, color: "#6a8a80", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 },
  addPlus: { width: 24, height: 24, borderRadius: 6, fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  erroBox: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "11px 16px", marginBottom: 14, fontSize: 13, fontWeight: 500 },
  submitBtn: { width: "100%", padding: "16px 24px", border: "none", borderRadius: 12, fontSize: 16, fontFamily: "'Sora', sans-serif", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, letterSpacing: "0.01em", boxShadow: "0 4px 16px #1A3C3440" },
  arrow: { fontSize: 20, fontWeight: 400 },
  disclaimer: { textAlign: "center", fontSize: 12, color: "#a0a09a", marginTop: 14, lineHeight: 1.5 },
  linkBtn: { background: "none", border: "none", color: "#1A3C34", textDecoration: "underline", fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, padding: 0 },
  importDesc: { fontSize: 13, lineHeight: 1.6, marginBottom: 14 },
  formatBox: { background: "#f5f3ee", borderRadius: 10, padding: "14px 16px", marginBottom: 14 },
  formatHeader: { fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" },
  formatCols: { display: "flex", flexWrap: "wrap", gap: 6 },
  formatTag: { fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "1px solid", whiteSpace: "nowrap" },
  textarea: { width: "100%", padding: "12px 14px", border: "1.5px solid", borderRadius: 10, fontSize: 13, fontFamily: "'Plus Jakarta Sans', monospace", resize: "vertical", minHeight: 120, lineHeight: 1.6, transition: "all .2s" },
  previewBox: { marginTop: 14, borderRadius: 10, overflow: "hidden", border: "1px solid #e8e5dd" },
  previewHeader: { padding: "10px 14px", fontSize: 13, fontWeight: 700 },
  previewScroll: { overflowX: "auto" },
  previewTable: { width: "100%", borderCollapse: "collapse", fontSize: 11 },
  previewTh: { padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.04em" },
  previewTd: { padding: "7px 10px", borderTop: "1px solid #e8e5dd", whiteSpace: "nowrap", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" },
  previewMore: { padding: "8px 14px", fontSize: 12, fontStyle: "italic" },
  statusBox: { maxWidth: 400, margin: "60px auto", padding: "48px 28px", textAlign: "center", animation: "fadeUp .4s ease-out" },
  spinner: { width: 44, height: 44, border: "3px solid #e0ddd5", borderRadius: "50%", margin: "0 auto 20px", animation: "spin .7s linear infinite" },
  successIcon: { width: 60, height: 60, borderRadius: "50%", fontSize: 26, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" },
  statusTitle: { fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 6 },
  statusSub: { fontSize: 14, lineHeight: 1.6 },
  resetBtn: { marginTop: 22, padding: "11px 28px", border: "none", borderRadius: 10, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 },
  footer: { textAlign: "center", padding: "28px 20px", fontSize: 12, color: "#b0b0aa" },
};
