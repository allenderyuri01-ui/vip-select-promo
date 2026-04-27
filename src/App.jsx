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

const formatadores = {
  text: (v) => v,
  cpf: formatarCPF,
  data: formatarData,
  email: (v) => v,
};

// ── Gera a ordem das colunas esperadas pra importação ──
const gerarColunas = () => {
  const cols = ["CONTATO", "RESPONSÁVEL"];
  CONFIG.camposTitular.forEach((c) => cols.push(c.label.toUpperCase()));
  CONFIG.programas.forEach((p) => {
    cols.push(`EMAIL ${p.nome.toUpperCase()}`);
    cols.push(`SENHA ${p.nome.toUpperCase()}`);
  });
  return cols;
};

// ── Entrada vazia dinâmica baseada no config ──
const criarEntradaVazia = () => {
  const entrada = { id: Date.now() + Math.random() };
  CONFIG.camposTitular.forEach((c) => { entrada[c.id] = ""; });
  CONFIG.programas.forEach((p) => {
    entrada[`email_${p.id}`] = "";
    entrada[`senha_${p.id}`] = "";
  });
  return entrada;
};

// ── Input component (fora do componente principal pra evitar bug de foco) ──
function Input({ label, value, onChange, placeholder, type = "text", senhaKey, senhasVisiveis, toggleSenha, cores }) {
  return (
    <div style={st.field}>
      <label style={{ ...st.label, color: cores.textoSuave }}>{label}</label>
      {senhaKey ? (
        <div style={st.senhaWrap}>
          <input
            style={{ ...st.input, paddingRight: 42, background: cores.inputFundo, borderColor: cores.inputBorda, color: cores.texto }}
            type={senhasVisiveis[senhaKey] ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
          />
          <button style={st.eyeBtn} onClick={() => toggleSenha(senhaKey)} type="button">
            {senhasVisiveis[senhaKey] ? "🙈" : "👁"}
          </button>
        </div>
      ) : (
        <input style={{ ...st.input, background: cores.inputFundo, borderColor: cores.inputBorda, color: cores.texto }} type={type} value={value} onChange={onChange} placeholder={placeholder} />
      )}
    </div>
  );
}

// ── Componente principal ──
export default function App() {
  const [etapa, setEtapa] = useState("form");
  const [modo, setModo] = useState("manual"); // manual | importar
  const [contato, setContato] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [entradas, setEntradas] = useState([criarEntradaVazia()]);
  const [erroMsg, setErroMsg] = useState("");
  const [senhasVisiveis, setSenhasVisiveis] = useState({});
  const [expandido, setExpandido] = useState({});
  const [textoImport, setTextoImport] = useState("");
  const [previewRows, setPreviewRows] = useState([]);
  const [qtdEnviada, setQtdEnviada] = useState(0);

  const c = CONFIG.cores;
  const colunas = gerarColunas();
  const totalColunas = colunas.length;

  const atualizarEntrada = (id, campo, valor) => {
    setEntradas(entradas.map((e) => (e.id === id ? { ...e, [campo]: valor } : e)));
  };

  const adicionarEntrada = () => {
    const nova = criarEntradaVazia();
    setEntradas([...entradas, nova]);
    setExpandido((p) => ({ ...p, [nova.id]: true }));
  };

  const removerEntrada = (id) => {
    if (entradas.length > 1) setEntradas(entradas.filter((e) => e.id !== id));
  };

  const toggleSenha = (key) => setSenhasVisiveis((p) => ({ ...p, [key]: !p[key] }));
  const toggleExpand = (id) => setExpandido((p) => ({ ...p, [id]: !p[id] }));

  // ── Validação do formulário manual ──
  const validar = () => {
    if (!contato.trim() || contato.replace(/\D/g, "").length < 10) return "Preencha um contato válido.";
    if (!responsavel.trim()) return "Preencha o nome do responsável.";
    for (let i = 0; i < entradas.length; i++) {
      const e = entradas[i];
      for (const campo of CONFIG.camposTitular) {
        if (!e[campo.id] || !e[campo.id].trim()) return `Conta ${i + 1}: preencha ${campo.label.toLowerCase()}.`;
        if (campo.tipo === "cpf" && e[campo.id].replace(/\D/g, "").length !== 11) return `Conta ${i + 1}: CPF inválido.`;
        if (campo.tipo === "data" && e[campo.id].replace(/\D/g, "").length < 8) return `Conta ${i + 1}: data inválida.`;
      }
      for (const prog of CONFIG.programas) {
        if (!e[`email_${prog.id}`] || !e[`email_${prog.id}`].trim()) return `Conta ${i + 1}: preencha o email ${prog.nome}.`;
        if (!e[`senha_${prog.id}`] || !e[`senha_${prog.id}`].trim()) return `Conta ${i + 1}: preencha a senha ${prog.nome}.`;
      }
    }
    return null;
  };

  // ── Parsear texto colado (tab-separated) ──
  const parsearImport = (texto) => {
    const linhas = texto.trim().split("\n").filter((l) => l.trim());
    const rows = [];
    for (const linha of linhas) {
      const celulas = linha.split("\t");
      if (celulas.length < totalColunas) continue;
      const row = {
        contato: celulas[0]?.trim() || "",
        responsavel: celulas[1]?.trim() || "",
      };
      let idx = 2;
      CONFIG.camposTitular.forEach((campo) => {
        row[campo.id] = celulas[idx]?.trim() || "";
        idx++;
      });
      CONFIG.programas.forEach((prog) => {
        row[`email_${prog.id}`] = celulas[idx]?.trim() || "";
        idx++;
        row[`senha_${prog.id}`] = celulas[idx]?.trim() || "";
        idx++;
      });
      rows.push(row);
    }
    return rows;
  };

  const handleTextoImport = (texto) => {
    setTextoImport(texto);
    setErroMsg("");
    const rows = parsearImport(texto);
    setPreviewRows(rows);
  };

  // ── Enviar (manual) ──
  const enviar = async () => {
    const erro = validar();
    if (erro) { setErroMsg(erro); return; }
    setErroMsg("");
    setEtapa("enviando");

    const rows = entradas.map((e) => {
      const row = { contato, responsavel: responsavel.trim() };
      CONFIG.camposTitular.forEach((campo) => {
        row[campo.id] = campo.tipo === "cpf" ? e[campo.id].replace(/\D/g, "") : e[campo.id];
      });
      CONFIG.programas.forEach((prog) => {
        row[`email_${prog.id}`] = e[`email_${prog.id}`].trim();
        row[`senha_${prog.id}`] = e[`senha_${prog.id}`];
      });
      return row;
    });

    await enviarPayload(rows);
  };

  // ── Enviar (importação) ──
  const enviarImport = async () => {
    if (previewRows.length === 0) {
      setErroMsg("Nenhuma linha válida encontrada. Verifique o formato.");
      return;
    }
    setErroMsg("");
    setEtapa("enviando");
    await enviarPayload(previewRows);
  };

  // ── Envio compartilhado ──
  const enviarPayload = async (rows) => {
    const payload = { aba: CONFIG.abaPlanilha, rows };
    setQtdEnviada(rows.length);

    if (!CONFIG.appsScriptUrl) {
      console.log("Payload (demo):", JSON.stringify(payload, null, 2));
      await new Promise((r) => setTimeout(r, 1500));
      setEtapa("sucesso");
      return;
    }

    try {
      await fetch(CONFIG.appsScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEtapa("sucesso");
    } catch {
      setEtapa("erro");
    }
  };

  const resetar = () => {
    setContato("");
    setResponsavel("");
    setEntradas([criarEntradaVazia()]);
    setSenhasVisiveis({});
    setExpandido({});
    setTextoImport("");
    setPreviewRows([]);
    setErroMsg("");
    setEtapa("form");
  };

  const getPreview = (ent) => {
    return CONFIG.programas
      .map((p) => ent[`email_${p.id}`] ? `${p.nome}: ${ent[`email_${p.id}`]}` : "")
      .filter(Boolean)
      .join(" · ");
  };

  const getNomeConta = (ent, idx) => {
    const titular = CONFIG.camposTitular.find((ct) => ct.id === "titularNome");
    if (titular && ent[titular.id]) return ent[titular.id];
    return `Conta ${idx + 1}`;
  };

  const mostrarAbas = CONFIG.permitirImportacao;

  return (
    <div style={{ ...st.page, background: c.fundo, color: c.texto }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ ...st.topBand, background: `linear-gradient(90deg, ${c.primaria}, ${c.destaque}, ${c.primaria})` }}>
        <div style={st.bandPattern} />
      </div>

      {/* Hero */}
      <section style={st.hero}>
        <div style={{ ...st.promoTag, background: c.primaria, color: c.destaque }}>Promoção Exclusiva</div>
        <h1 style={{ ...st.title, color: c.primaria }}>
          {CONFIG.titulo}<br />
          <span style={{ ...st.titleAccent, color: c.destaque }}>{CONFIG.tituloDestaque}</span>
        </h1>
        <p style={{ ...st.subtitle, color: c.textoSuave }}>{CONFIG.subtitulo}</p>
        <div style={st.chips}>
          {CONFIG.programas.map((p) => (
            <span key={p.id} style={{ ...st.chip, background: p.cor + "12", color: p.cor, borderColor: p.cor + "30" }}>
              {p.emoji} {p.nome}
            </span>
          ))}
        </div>
      </section>

      {etapa === "form" && (
        <section style={st.formWrap}>

          {/* Abas: Manual / Importar */}
          {mostrarAbas && (
            <div style={st.tabBar}>
              <button
                style={{ ...st.tab, ...(modo === "manual" ? { background: c.primaria, color: c.destaque } : { background: "transparent", color: c.textoSuave }) }}
                onClick={() => { setModo("manual"); setErroMsg(""); }}
              >
                ✍️ Preencher manual
              </button>
              <button
                style={{ ...st.tab, ...(modo === "importar" ? { background: c.primaria, color: c.destaque } : { background: "transparent", color: c.textoSuave }) }}
                onClick={() => { setModo("importar"); setErroMsg(""); }}
              >
                📋 Importar planilha
              </button>
            </div>
          )}

          {/* ══════ MODO MANUAL ══════ */}
          {modo === "manual" && (
            <>
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
                        {entradas.length > 1 && (
                          <button style={st.removeBtn} onClick={(ev) => { ev.stopPropagation(); removerEntrada(ent.id); }}>✕</button>
                        )}
                        <span style={{ ...st.chevron, transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={st.contaBody}>
                        <div style={st.sectionLabel}>
                          <span style={{ ...st.sectionDot, background: c.primaria }} />
                          Dados do titular
                        </div>
                        <div style={st.cardGrid3}>
                          {CONFIG.camposTitular.map((campo) => (
                            <Input key={campo.id} label={campo.label} value={ent[campo.id]}
                              onChange={(e) => atualizarEntrada(ent.id, campo.id, (formatadores[campo.tipo] || formatadores.text)(e.target.value))}
                              placeholder={campo.placeholder} cores={c} />
                          ))}
                        </div>
                        {CONFIG.programas.map((prog) => (
                          <div key={prog.id}>
                            <div style={st.sectionLabel}>
                              <span style={{ ...st.sectionDot, background: prog.cor }} />
                              {prog.nome}
                            </div>
                            <div style={st.cardGrid2}>
                              <Input label="Email da conta" value={ent[`email_${prog.id}`]}
                                onChange={(e) => atualizarEntrada(ent.id, `email_${prog.id}`, e.target.value)}
                                placeholder={`email@${prog.id}.com`} cores={c} />
                              <Input label="Senha" value={ent[`senha_${prog.id}`]}
                                onChange={(e) => atualizarEntrada(ent.id, `senha_${prog.id}`, e.target.value)}
                                placeholder="••••••••" senhaKey={`${prog.id}-${ent.id}`}
                                senhasVisiveis={senhasVisiveis} toggleSenha={toggleSenha} cores={c} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <button style={{ ...st.addBtn, background: c.cardFundo }} onClick={adicionarEntrada}>
                <span style={{ ...st.addPlus, background: c.destaque, color: c.primaria }}>+</span>
                Adicionar outra conta
              </button>

              {erroMsg && <div style={{ ...st.erroBox, color: c.erroCor }}>⚠ {erroMsg}</div>}

              <button style={{ ...st.submitBtn, background: c.primaria, color: c.destaque }} onClick={enviar}>
                Enviar cadastro
                <span style={st.arrow}>→</span>
              </button>
            </>
          )}

          {/* ══════ MODO IMPORTAR ══════ */}
          {modo === "importar" && (
            <>
              <div style={{ ...st.card, background: c.cardFundo }}>
                <div style={st.cardIcon}>📋</div>
                <h2 style={{ ...st.cardTitle, color: c.texto }}>Importar da planilha</h2>
                <p style={{ ...st.importDesc, color: c.textoSuave }}>
                  Copie as linhas da sua planilha e cole no campo abaixo. As colunas devem estar nesta ordem:
                </p>

                {/* Formato esperado */}
                <div style={st.formatBox}>
                  <div style={st.formatHeader}>Formato esperado ({totalColunas} colunas):</div>
                  <div style={st.formatCols}>
                    {colunas.map((col, i) => (
                      <span key={i} style={{ ...st.formatTag, background: c.primaria + "12", color: c.primaria, borderColor: c.primaria + "25" }}>
                        {i + 1}. {col}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  style={{ ...st.textarea, background: c.inputFundo, borderColor: c.inputBorda, color: c.texto }}
                  placeholder={"Cole aqui as linhas copiadas da planilha...\nCada linha = uma conta\nAs colunas devem ser separadas por TAB (copiar do Excel/Sheets faz isso automaticamente)"}
                  value={textoImport}
                  onChange={(e) => handleTextoImport(e.target.value)}
                  rows={8}
                />

                {/* Preview */}
                {previewRows.length > 0 && (
                  <div style={st.previewBox}>
                    <div style={{ ...st.previewHeader, color: c.primaria }}>
                      ✓ {previewRows.length} linha{previewRows.length > 1 ? "s" : ""} reconhecida{previewRows.length > 1 ? "s" : ""}
                    </div>
                    <div style={st.previewScroll}>
                      <table style={st.previewTable}>
                        <thead>
                          <tr>
                            {colunas.map((col, i) => (
                              <th key={i} style={{ ...st.previewTh, background: c.primaria, color: c.destaque }}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.slice(0, 5).map((row, ri) => {
                            const valores = [row.contato, row.responsavel];
                            CONFIG.camposTitular.forEach((ct) => valores.push(row[ct.id] || ""));
                            CONFIG.programas.forEach((p) => {
                              valores.push(row[`email_${p.id}`] || "");
                              valores.push(row[`senha_${p.id}`] || "");
                            });
                            return (
                              <tr key={ri}>
                                {valores.map((v, vi) => (
                                  <td key={vi} style={st.previewTd}>{v || "—"}</td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {previewRows.length > 5 && (
                      <p style={{ ...st.previewMore, color: c.textoSuave }}>... e mais {previewRows.length - 5} linha{previewRows.length - 5 > 1 ? "s" : ""}</p>
                    )}
                  </div>
                )}

                {textoImport && previewRows.length === 0 && (
                  <div style={{ ...st.erroBox, color: c.erroCor }}>
                    ⚠ Nenhuma linha válida. Verifique se há {totalColunas} colunas separadas por TAB.
                  </div>
                )}
              </div>

              {erroMsg && <div style={{ ...st.erroBox, color: c.erroCor }}>⚠ {erroMsg}</div>}

              <button
                style={{ ...st.submitBtn, background: c.primaria, color: c.destaque, opacity: previewRows.length === 0 ? 0.5 : 1 }}
                onClick={enviarImport}
                disabled={previewRows.length === 0}
              >
                Enviar {previewRows.length} linha{previewRows.length !== 1 ? "s" : ""}
                <span style={st.arrow}>→</span>
              </button>
            </>
          )}

          <p style={st.disclaimer}>🔒 Dados enviados com segurança direto para a equipe {CONFIG.empresa}.</p>
        </section>
      )}

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
          <p style={{ ...st.statusSub, color: c.textoSuave }}>
            {qtdEnviada} conta{qtdEnviada > 1 ? "s" : ""} registrada{qtdEnviada > 1 ? "s" : ""}. {CONFIG.mensagemSucesso}
          </p>
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

  // Abas
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

  // Import
  importDesc: { fontSize: 13, lineHeight: 1.6, marginBottom: 14 },
  formatBox: { background: "#f5f3ee", borderRadius: 10, padding: "14px 16px", marginBottom: 14 },
  formatHeader: { fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" },
  formatCols: { display: "flex", flexWrap: "wrap", gap: 6 },
  formatTag: { fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "1px solid", whiteSpace: "nowrap" },
  textarea: { width: "100%", padding: "12px 14px", border: "1.5px solid", borderRadius: 10, fontSize: 13, fontFamily: "'Plus Jakarta Sans', monospace", resize: "vertical", minHeight: 120, lineHeight: 1.6, transition: "all .2s" },

  // Preview
  previewBox: { marginTop: 14, borderRadius: 10, overflow: "hidden", border: "1px solid #e8e5dd" },
  previewHeader: { padding: "10px 14px", fontSize: 13, fontWeight: 700 },
  previewScroll: { overflowX: "auto" },
  previewTable: { width: "100%", borderCollapse: "collapse", fontSize: 11 },
  previewTh: { padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.04em" },
  previewTd: { padding: "7px 10px", borderTop: "1px solid #e8e5dd", whiteSpace: "nowrap", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" },
  previewMore: { padding: "8px 14px", fontSize: 12, fontStyle: "italic" },

  // Status
  statusBox: { maxWidth: 400, margin: "60px auto", padding: "48px 28px", textAlign: "center", animation: "fadeUp .4s ease-out" },
  spinner: { width: 44, height: 44, border: "3px solid #e0ddd5", borderRadius: "50%", margin: "0 auto 20px", animation: "spin .7s linear infinite" },
  successIcon: { width: 60, height: 60, borderRadius: "50%", fontSize: 26, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" },
  statusTitle: { fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 6 },
  statusSub: { fontSize: 14, lineHeight: 1.6 },
  resetBtn: { marginTop: 22, padding: "11px 28px", border: "none", borderRadius: 10, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 },
  footer: { textAlign: "center", padding: "28px 20px", fontSize: 12, color: "#b0b0aa" },
};
