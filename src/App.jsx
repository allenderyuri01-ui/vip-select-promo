import { useState, useEffect } from "react";
import CONFIG from "./config";

// ── Helpers ──
const formatarTel = (v) => { const n = v.replace(/\D/g, "").slice(0, 11); if (n.length <= 2) return n.length ? `(${n}` : ""; if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`; return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`; };
const formatarData = (v) => { const n = v.replace(/\D/g, "").slice(0, 8); if (n.length <= 2) return n; if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`; return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`; };

const formatador = (tipo, v) => {
  if (tipo === "tel") return formatarTel(v);
  if (tipo === "data") return formatarData(v);
  return v;
};

const normalizarBool = (v) => {
  const u = v.toString().trim().toUpperCase();
  if (["TRUE","VERDADEIRO","SIM","S","1","YES"].includes(u)) return "Sim";
  if (["FALSE","FALSO","NÃO","NAO","N","0","NO"].includes(u)) return "Não";
  return v;
};

const EXEMPLO = {
  parceiroResp: "Maria Silva", telResp: "(21) 98765-4321",
  nomeTitular: "João da Silva", dataNasc: "15/06/1990",
  telTitular: "(21) 91234-5678", emailConta: "joao@gmail.com",
  loginSmiles: "joao@gmail.com", senhaSmiles: "Senha@123",
  loginLivelo: "joao@gmail.com", senhaLivelo: "Livelo@456",
  prazo: "30 dias", contaCheia: "Sim", cartaoClube: "Não",
  cartaoMP: "1234", dataClube: "01/03/2025", pixResp: "maria@email.com",
};

const validarCelula = (valor, tipo, opcoes) => {
  const v = (valor || "").toString().trim();
  if (!v) return "Obrigatório";
  if (tipo === "data") {
    const nums = v.replace(/\D/g, "");
    if (nums.length < 8) return "Data incompleta (use DD/MM/AAAA)";
    const partes = v.split("/");
    if (partes.length !== 3) return "Formato inválido (use DD/MM/AAAA)";
    const dia = parseInt(partes[0]), mes = parseInt(partes[1]), ano = parseInt(partes[2]);
    if (dia < 1 || dia > 31) return "Dia inválido";
    if (mes < 1 || mes > 12) return "Mês inválido";
    if (ano < 1900 || ano > 2100) return "Ano inválido";
  }
  if (tipo === "email") {
    if (!v.includes("@") || !v.includes(".")) return "Email inválido";
  }
  if (tipo === "tel") {
    const nums = v.replace(/\D/g, "");
    if (nums.length < 10) return "Telefone inválido (mínimo 10 dígitos)";
  }
  if (tipo === "select" && opcoes) {
    if (!opcoes.includes(v)) return `Deve ser: ${opcoes.join(" ou ")}`;
  }
  return null;
};

// ── Normaliza cabeçalho pra matching ──
const normalizarHeader = (h) =>
  h.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

// ── Tenta mapear colunas coladas pelo cabeçalho ──
const mapearColunasPorHeader = (headerCelulas) => {
  const mapa = {}; // índice colado → índice em COLUNAS
  const colunasNorm = COLUNAS.map((col) => normalizarHeader(col.label));
  headerCelulas.forEach((h, i) => {
    const hNorm = normalizarHeader(h);
    const match = colunasNorm.findIndex((cn) => {
      // Match exato ou contém as palavras principais
      if (cn === hNorm) return true;
      const palavras = hNorm.split(" ").filter((p) => p.length > 3);
      return palavras.length > 0 && palavras.every((p) => cn.includes(p));
    });
    if (match >= 0) mapa[i] = match;
  });
  return mapa;
};

// ── Gera colunas na ordem da planilha (B-P) ──
const gerarColunas = () => {
  const todos = [
    ...CONFIG.camposResponsavel.map((c) => ({ ...c, grupo: "resp" })),
    ...CONFIG.camposConta.map((c) => ({ ...c, grupo: "conta" })),
  ];
  todos.sort((a, b) => a.coluna.localeCompare(b.coluna));
  return todos;
};
const COLUNAS = gerarColunas();
const COLUNAS_LABELS = COLUNAS.map((c) => c.label.toUpperCase());

// ── Conta vazia ──
const criarContaVazia = () => {
  const e = { id: Date.now() + Math.random() };
  CONFIG.camposConta.forEach((c) => { e[c.id] = ""; });
  return e;
};

// ── Row pra array na ordem das colunas (B-P) ──
const rowParaArray = (respDados, contaDados) => {
  return COLUNAS.map((col) => {
    if (col.grupo === "resp") return respDados[col.id] || "";
    return contaDados[col.id] || "";
  });
};

// ── Timestamp BR ──
const agora = () => {
  const d = new Date();
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
};

const gerarToken = () => { const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; let t = ""; for (let i = 0; i < 8; i++) t += c[Math.floor(Math.random() * c.length)]; return t; };

const API = CONFIG.appsScriptUrl;
const apiGet = async (params) => { const r = await fetch(`${API}?${new URLSearchParams(params)}`); return r.json(); };
const apiPostNoReply = async (body) => { await fetch(API, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); };

// ── Input ──
function Input({ label, value, onChange, placeholder, tipo = "text", senhaKey, senhasVisiveis, toggleSenha, opcoes, cores, erro }) {
  const c = cores;
  const temErro = !!erro;
  const borderColor = temErro ? c.erroCor : c.inputBorda;

  if (tipo === "select") {
    return (
      <div style={st.field}>
        <label style={{ ...st.label, color: temErro ? c.erroCor : c.textoSuave }}>{label}</label>
        <select style={{ ...st.input, background: c.inputFundo, borderColor, color: value ? c.texto : "#a0a0a0", appearance: "auto" }}
          value={value} onChange={onChange}>
          <option value="">Selecione...</option>
          {(opcoes || []).map((op) => (<option key={op} value={op}>{op}</option>))}
        </select>
        {temErro && <span style={{ fontSize: 11, color: c.erroCor, marginTop: 2 }}>{erro}</span>}
      </div>
    );
  }

  if (tipo === "senha") {
    return (
      <div style={st.field}>
        <label style={{ ...st.label, color: temErro ? c.erroCor : c.textoSuave }}>{label}</label>
        <div style={st.senhaWrap}>
          <input style={{ ...st.input, paddingRight: 42, background: c.inputFundo, borderColor, color: c.texto }}
            type={senhasVisiveis?.[senhaKey] ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} />
          <button style={st.eyeBtn} onClick={() => toggleSenha(senhaKey)} type="button">{senhasVisiveis?.[senhaKey] ? "🙈" : "👁"}</button>
        </div>
        {temErro && <span style={{ fontSize: 11, color: c.erroCor, marginTop: 2 }}>{erro}</span>}
      </div>
    );
  }

  return (
    <div style={st.field}>
      <label style={{ ...st.label, color: temErro ? c.erroCor : c.textoSuave }}>{label}</label>
      <input style={{ ...st.input, background: c.inputFundo, borderColor, color: c.texto }}
        type={tipo === "email" ? "email" : "text"} value={value} onChange={onChange} placeholder={placeholder} />
      {temErro && <span style={{ fontSize: 11, color: c.erroCor, marginTop: 2 }}>{erro}</span>}
    </div>
  );
}

// ══════════════════════════
// APP PRINCIPAL
// ══════════════════════════
export default function App() {
  const [tela, setTela] = useState("loading");
  const [modo, setModo] = useState("manual");
  const [promoAtual, setPromoAtual] = useState(null);
  const [tokenAtual, setTokenAtual] = useState("");

  // Responsável
  const [resp, setResp] = useState({});
  // Contas
  const [contas, setContas] = useState([criarContaVazia()]);
  const [erroMsg, setErroMsg] = useState("");
  const [senhasVisiveis, setSenhasVisiveis] = useState({});
  const [expandido, setExpandido] = useState({});

  // Import
  const [textoImport, setTextoImport] = useState("");
  const [previewRows, setPreviewRows] = useState([]);
  const [previewErros, setPreviewErros] = useState([]);

  // Revisão / envio
  const [rowsParaEnviar, setRowsParaEnviar] = useState([]);
  const [qtdEnviada, setQtdEnviada] = useState(0);

  // Consulta
  const [consultaBusca, setConsultaBusca] = useState("");
  const [consultaResultado, setConsultaResultado] = useState(null);
  const [consultaCarregando, setConsultaCarregando] = useState(false);
  const [consultaErro, setConsultaErro] = useState("");
  const [consultaSucesso, setConsultaSucesso] = useState("");

  // Admin
  const [adminSenha, setAdminSenha] = useState("");
  const [adminLogado, setAdminLogado] = useState(false);
  const [adminErro, setAdminErro] = useState("");
  const [promos, setPromos] = useState([]);
  const [novaPromoNome, setNovaPromoNome] = useState("");
  const [adminCarregando, setAdminCarregando] = useState(false);
  const [copiado, setCopiado] = useState("");

  const c = CONFIG.cores;

  // ── Init ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("t");
    const admin = params.get("admin");
    if (token) { setTokenAtual(token); validarToken(token); }
    else if (admin !== null) setTela("admin-login");
    else setTela("fechado");
  }, []);

  const validarToken = async (token) => {
    try {
      const data = await apiGet({ action: "validar_token", token });
      if (data.valido) { setPromoAtual(data.promo); setTela("form"); }
      else setTela("fechado");
    } catch { setTela("fechado"); }
  };

  // ══════ ADMIN ══════
  const adminLogin = async () => {
    setAdminErro(""); setAdminCarregando(true);
    try {
      const data = await apiGet({ action: "admin_login", senha: adminSenha });
      if (data.ok) { setAdminLogado(true); setTela("admin"); listarPromos(); }
      else setAdminErro("Senha incorreta.");
    } catch { setAdminErro("Erro de conexão."); }
    setAdminCarregando(false);
  };
  const listarPromos = async () => {
    setAdminCarregando(true);
    try { const data = await apiGet({ action: "listar_promos", senha: adminSenha }); setPromos(data.promos || []); } catch { }
    setAdminCarregando(false);
  };
  const criarPromo = async () => {
    if (!novaPromoNome.trim()) return;
    setAdminCarregando(true);
    try { await apiPostNoReply({ action: "criar_promo", senha: adminSenha, nome: novaPromoNome.trim(), token: gerarToken() }); setNovaPromoNome(""); setTimeout(listarPromos, 1500); } catch { }
    setAdminCarregando(false);
  };
  const togglePromo = async (token, statusAtual) => {
    setAdminCarregando(true);
    try { await apiPostNoReply({ action: "toggle_promo", senha: adminSenha, token, status: statusAtual === "ativa" ? "inativa" : "ativa" }); setTimeout(listarPromos, 1500); } catch { }
    setAdminCarregando(false);
  };
  const copiarLink = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?t=${token}`);
    setCopiado(token); setTimeout(() => setCopiado(""), 2000);
  };

  // ══════ FORM ══════
  const updateResp = (id, val) => setResp((p) => ({ ...p, [id]: val }));
  const updateConta = (contaId, campoId, val) => setContas(contas.map((ct) => ct.id === contaId ? { ...ct, [campoId]: val } : ct));
  const addConta = () => { const n = criarContaVazia(); setContas([...contas, n]); setExpandido((p) => ({ ...p, [n.id]: true })); };
  const removeConta = (id) => { if (contas.length > 1) setContas(contas.filter((ct) => ct.id !== id)); };
  const toggleSenha = (key) => setSenhasVisiveis((p) => ({ ...p, [key]: !p[key] }));
  const toggleExpand = (id) => setExpandido((p) => ({ ...p, [id]: !p[id] }));

  // ── Validação manual ──
  const campoVisivel = (campo, contaDados) => {
    if (!campo.condicional) return true;
    return contaDados[campo.condicional.campo] === campo.condicional.valor;
  };

  const validar = () => {
    for (const campo of CONFIG.camposResponsavel) {
      const err = validarCelula(resp[campo.id], campo.tipo);
      if (err) return `${campo.label}: ${err}`;
    }
    for (let i = 0; i < contas.length; i++) {
      for (const campo of CONFIG.camposConta) {
        if (!campoVisivel(campo, contas[i])) continue;
        const err = validarCelula(contas[i][campo.id], campo.tipo, campo.opcoes);
        if (err) return `Conta ${i + 1} — ${campo.label}: ${err}`;
      }
    }
    return null;
  };

  const montarRows = () => contas.map((ct) => {
    const ctFinal = { ...ct };
    if (ctFinal.cartaoClube === "Sim") ctFinal.cartaoMP = "";
    return [agora(), ...rowParaArray(resp, ctFinal)];
  });

  const parsearImport = (texto) => {
    const linhas = texto.trim().split("\n").map((l) => l.replace(/\r$/, ""));
    const rows = []; const erros = []; let buffer = "";
    let mapaIdx = null; // mapa de coluna colada → índice em COLUNAS (por header)

    for (const linha of linhas) {
      const celulas = linha.split("\t");

      // ── Detecta se é linha de cabeçalho ──
      const primeiraCell = normalizarHeader(celulas[0] || "");
      const ehCabecalho =
        primeiraCell.includes("parceiro") ||
        primeiraCell.includes("data") ||
        primeiraCell.includes("nome") ||
        primeiraCell.includes("preenchido") ||
        primeiraCell.includes("contato") ||
        // Se a maioria das células bate com labels conhecidos, é cabeçalho
        celulas.filter((c) => {
          const cn = normalizarHeader(c);
          return COLUNAS.some((col) => normalizarHeader(col.label).split(" ").filter(p => p.length > 3).every(p => cn.includes(p)));
        }).length >= Math.floor(COLUNAS.length * 0.5);

      if (ehCabecalho) {
        // Tenta mapear colunas por nome
        const tentativa = mapearColunasPorHeader(celulas);
        if (Object.keys(tentativa).length >= Math.floor(COLUNAS.length * 0.5)) {
          mapaIdx = tentativa;
        }
        continue;
      }

      const merged = buffer ? buffer + "\t" + linha.trim() : linha;
      const celulasM = merged.split("\t");

      if (celulasM.length < COLUNAS.length) { buffer = merged; continue; }
      buffer = "";

      let vals;
      if (mapaIdx && Object.keys(mapaIdx).length > 0) {
        // Usa mapeamento por header
        vals = new Array(COLUNAS.length).fill("");
        Object.entries(mapaIdx).forEach(([iColado, iColunas]) => {
          vals[iColunas] = normalizarBool((celulasM[iColado] || "").trim());
        });
        // Preenche restantes em ordem posicional pros que não foram mapeados
        let pos = 0;
        vals.forEach((v, i) => {
          if (v === "") {
            // Acha próxima célula não usada
            while (pos < celulasM.length && Object.keys(mapaIdx).includes(String(pos))) pos++;
            if (pos < celulasM.length) vals[i] = normalizarBool(celulasM[pos++].trim());
          }
        });
      } else {
        // Posicional padrão
        vals = celulasM.slice(0, COLUNAS.length).map((v) => normalizarBool(v.trim()));
      }

      // Zera cartaoMP se cartaoClube = Sim
      const idxCartaoClube = COLUNAS.findIndex((c) => c.id === "cartaoClube");
      const idxCartaoMP = COLUNAS.findIndex((c) => c.id === "cartaoMP");
      if (idxCartaoClube >= 0 && idxCartaoMP >= 0 && vals[idxCartaoClube] === "Sim") {
        vals[idxCartaoMP] = "";
      }

      // Validação — todos os campos obrigatórios
      const rowErros = {};
      COLUNAS.forEach((col, i) => {
        // Pula campo condicional que não se aplica
        if (col.condicional) {
          const idxDep = COLUNAS.findIndex((c) => c.id === col.condicional.campo);
          if (idxDep >= 0 && vals[idxDep] !== col.condicional.valor) return;
        }
        const err = validarCelula(vals[i], col.tipo, col.opcoes);
        if (err) rowErros[i] = `${col.label}: ${err}`;
      });

      rows.push(vals);
      erros.push(rowErros);
    }
    return { rows, erros };
  };

  const handleTextoImport = (texto) => {
    setTextoImport(texto); setErroMsg("");
    const { rows, erros } = parsearImport(texto);
    setPreviewRows(rows); setPreviewErros(erros);
  };
  const temErrosImport = () => previewErros.some((e) => Object.keys(e).length > 0);

  // ── Revisão ──
  const irParaRevisao = (rows) => { setRowsParaEnviar(rows); setQtdEnviada(rows.length); setTela("revisao"); };

  const handleEnviarManual = () => {
    const erro = validar();
    if (erro) { setErroMsg(erro); return; }
    setErroMsg(""); irParaRevisao(montarRows());
  };
  const handleEnviarImport = () => {
    if (previewRows.length === 0) { setErroMsg("Nenhuma linha válida."); return; }
    if (temErrosImport()) { setErroMsg("Corrija os erros antes de enviar."); return; }
    // Prepend timestamp to each row
    const rows = previewRows.map((vals) => [agora(), ...vals]);
    setErroMsg(""); irParaRevisao(rows);
  };

  const confirmarEnvio = async () => {
    setTela("enviando");
    try {
      await apiPostNoReply({ action: "submit", linhas: rowsParaEnviar });
      setTela("sucesso");
    } catch { setTela("erro"); }
  };

  // ── Consulta ──
  const consultarDados = async () => {
    const busca = consultaBusca.trim();
    if (!busca || busca.length < 3) { setConsultaErro("Digite pelo menos 3 caracteres."); return; }
    setConsultaErro(""); setConsultaSucesso(""); setConsultaCarregando(true); setConsultaResultado(null);
    try {
      const data = await apiGet({ action: "consultar", busca });
      if (data.linhas && data.linhas.length > 0) {
        setConsultaResultado(data.linhas.map((vals) => ({
          valores: vals.slice(0, -1),
          rowIndex: vals[vals.length - 1],
        })));
      } else setConsultaErro("Nenhum cadastro encontrado.");
    } catch { setConsultaErro("Erro ao consultar."); }
    setConsultaCarregando(false);
  };
  const reenviarCorrecao = async (rowIndex, novosValores) => {
    setConsultaCarregando(true); setConsultaSucesso("");
    try {
      await apiPostNoReply({ action: "atualizar", rowIndex, valores: novosValores });
      setConsultaSucesso("Dados atualizados!"); setConsultaResultado(null);
    } catch { setConsultaErro("Erro ao atualizar."); }
    setConsultaCarregando(false);
  };

  const resetar = () => {
    setResp({}); setContas([criarContaVazia()]); setSenhasVisiveis({}); setExpandido({});
    setTextoImport(""); setPreviewRows([]); setPreviewErros([]);
    setErroMsg(""); setRowsParaEnviar([]); setTela("form");
  };

  const getNomeConta = (ct, idx) => ct.nomeTitular || `Conta ${idx + 1}`;

  // Cabeçalho completo (com DATA)
  const headerCompleto = ["DATA", ...COLUNAS_LABELS];

  // ═════════════════
  // RENDER
  // ═════════════════
  return (
    <div style={{ ...st.page, background: c.fundo, color: c.texto }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ ...st.topBand, background: `linear-gradient(90deg, ${c.primaria}, ${c.destaque}, ${c.primaria})` }}><div style={st.bandPattern} /></div>

      {/* Botão flutuante — só aparece quando admin está logado e não está no painel */}
      {adminLogado && tela !== "admin" && tela !== "admin-login" && (
        <button onClick={() => { setTela("admin"); listarPromos(); }}
          style={{ position: "fixed", top: 14, right: 16, zIndex: 999, background: c.primaria, color: c.destaque, border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 2px 12px #00000030", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          ⚙ Painel
        </button>
      )}

      {/* LOADING */}
      {tela === "loading" && <div style={st.statusBox}><div style={{ ...st.spinner, borderTopColor: c.primaria }} /><p style={{ color: c.textoSuave }}>Verificando acesso...</p></div>}

      {/* FECHADO */}
      {tela === "fechado" && (
        <div style={st.statusBox}>
          <div style={{ ...st.successIcon, background: c.primaria + "15", color: c.primaria }}>🔒</div>
          <h2 style={{ ...st.statusTitle, color: c.texto }}>Acesso restrito</h2>
          <p style={{ ...st.statusSub, color: c.textoSuave }}>Este formulário requer um link de acesso válido.<br />Solicite com a equipe {CONFIG.empresa}.</p>
          <button style={{ ...st.linkBtn, marginTop: 30, fontSize: 11, color: c.textoSuave }} onClick={() => setTela("admin-login")}>Acesso administrativo</button>
        </div>
      )}

      {/* ADMIN LOGIN */}
      {tela === "admin-login" && (
        <div style={st.statusBox}>
          <h2 style={{ ...st.statusTitle, color: c.texto }}>Painel Administrativo</h2>
          <p style={{ ...st.statusSub, color: c.textoSuave, marginBottom: 20 }}>Digite a senha</p>
          <input style={{ ...st.input, maxWidth: 300, margin: "0 auto", textAlign: "center", background: c.inputFundo, borderColor: c.inputBorda, color: c.texto }}
            type="password" placeholder="Senha" value={adminSenha} onChange={(e) => setAdminSenha(e.target.value)} onKeyDown={(e) => e.key === "Enter" && adminLogin()} />
          {adminErro && <p style={{ color: c.erroCor, fontSize: 13, marginTop: 10 }}>{adminErro}</p>}
          <button style={{ ...st.submitBtn, maxWidth: 300, margin: "16px auto 0", background: c.primaria, color: c.destaque }} onClick={adminLogin} disabled={adminCarregando}>{adminCarregando ? "..." : "Entrar"}</button>
          <button style={{ ...st.linkBtn, marginTop: 16 }} onClick={() => setTela("fechado")}>← Voltar</button>
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {tela === "admin" && (
        <section style={{ ...st.formWrap, paddingTop: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ ...st.cardTitle, color: c.texto, margin: 0 }}>Painel — {CONFIG.empresa}</h2>
            <button style={{ ...st.linkBtn, fontSize: 12 }} onClick={() => { setTela("fechado"); setAdminSenha(""); setAdminLogado(false); }}>Sair</button>
          </div>
          <div style={{ ...st.card, background: c.cardFundo }}>
            <h3 style={{ ...st.cardTitle2, color: c.texto, marginBottom: 12 }}>Nova promoção</h3>
            <div className="search-bar" style={{ display: "flex", gap: 10 }}>
              <input style={{ ...st.input, flex: 1, background: c.inputFundo, borderColor: c.inputBorda, color: c.texto }}
                placeholder="Nome (ex: Promo Smiles Mai26)" value={novaPromoNome} onChange={(e) => setNovaPromoNome(e.target.value)} onKeyDown={(e) => e.key === "Enter" && criarPromo()} />
              <button style={{ ...st.submitBtn, width: "auto", padding: "11px 20px", background: c.primaria, color: c.destaque, fontSize: 14 }}
                onClick={criarPromo} disabled={adminCarregando || !novaPromoNome.trim()}>+ Criar</button>
            </div>
          </div>
          <div style={{ ...st.card, background: c.cardFundo }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ ...st.cardTitle2, color: c.texto }}>Promoções</h3>
              <button style={{ ...st.linkBtn, fontSize: 11 }} onClick={listarPromos}>↻ Atualizar</button>
            </div>
            {promos.length === 0 && <p style={{ color: c.textoSuave, fontSize: 13 }}>{adminCarregando ? "Carregando..." : "Nenhuma promoção."}</p>}
            {promos.map((promo, i) => (
              <div key={i} style={{ padding: "14px 0", borderTop: i > 0 ? "1px solid #f0ede6" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div><strong style={{ fontSize: 15 }}>{promo.nome}</strong>
                    <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12, background: promo.status === "ativa" ? "#f0fdf4" : "#fef2f2", color: promo.status === "ativa" ? "#16a34a" : "#dc2626" }}>
                      {promo.status === "ativa" ? "● Ativa" : "○ Inativa"}
                    </span></div>
                </div>
                <div style={{ fontSize: 12, color: c.textoSuave, marginBottom: 8 }}>Token: <code style={{ background: "#f5f3ee", padding: "2px 6px", borderRadius: 4 }}>{promo.token}</code></div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={{ ...st.miniBtn, background: c.destaque, color: c.primaria }} onClick={() => copiarLink(promo.token)}>{copiado === promo.token ? "✓ Copiado!" : "📋 Copiar link"}</button>
                  <button style={{ ...st.miniBtn, background: promo.status === "ativa" ? "#fef2f2" : "#f0fdf4", color: promo.status === "ativa" ? "#dc2626" : "#16a34a" }}
                    onClick={() => togglePromo(promo.token, promo.status)}>{promo.status === "ativa" ? "⏸ Desativar" : "▶ Ativar"}</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* HERO */}
      {(tela === "form" || tela === "revisao") && (
        <section style={st.hero}>
          <div style={{ ...st.promoTag, background: c.primaria, color: c.destaque }}>{promoAtual?.nome || "Promoção"}</div>
          <h1 style={{ ...st.title, color: c.primaria }}>{CONFIG.titulo}<br /><span style={{ ...st.titleAccent, color: c.destaque }}>{CONFIG.tituloDestaque}</span></h1>
          <p style={{ ...st.subtitle, color: c.textoSuave }}>{CONFIG.subtitulo}</p>
        </section>
      )}

      {/* ══════ FORM ══════ */}
      {tela === "form" && (
        <section style={st.formWrap}>

          {/* Banner — sempre visível, leva pro import */}
          {CONFIG.permitirImportacao && (
            <div style={{ background: "linear-gradient(135deg, #1A3C34, #2d5c4a)", borderRadius: 14, padding: "14px 20px", marginBottom: 14, display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
              onClick={() => { setModo("importar"); setErroMsg(""); }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>⚡</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: "#F2D645", marginBottom: 2 }}>Tem planilha? Importe direto!</div>
                <div style={{ fontSize: 12, color: "#a8c8be", lineHeight: 1.4 }}>Cole as linhas aqui e envie tudo de uma vez — sem digitar campo por campo.</div>
              </div>
              <span style={{ color: "#F2D645", fontSize: 18, flexShrink: 0 }}>→</span>
            </div>
          )}

          {CONFIG.permitirImportacao && (
            <div style={st.tabBar}>
              <button style={{ ...st.tab, ...(modo === "manual" ? { background: c.primaria, color: c.destaque } : { background: "transparent", color: c.textoSuave }) }} onClick={() => { setModo("manual"); setErroMsg(""); }}>✍️ Manual</button>
              <button style={{ ...st.tab, ...(modo === "importar" ? { background: c.primaria, color: c.destaque } : { background: "transparent", color: c.textoSuave }) }} onClick={() => { setModo("importar"); setErroMsg(""); }}>📋 Importar</button>
            </div>
          )}

          {/* ── MANUAL ── */}
          {modo === "manual" && (<>
            {/* Responsável */}
            <div style={{ ...st.card, background: c.cardFundo }}>
              <div style={st.cardIcon}>👤</div><h2 style={{ ...st.cardTitle, color: c.texto }}>Parceiro Responsável</h2>
              <div className="grid3" style={st.cardGrid3}>
                {CONFIG.camposResponsavel.map((campo) => (
                  <Input key={campo.id} label={campo.label} value={resp[campo.id] || ""} placeholder={campo.placeholder} tipo={campo.tipo} cores={c}
                    onChange={(e) => updateResp(campo.id, formatador(campo.tipo, e.target.value))} />
                ))}
              </div>
            </div>

            {/* Contas */}
            {contas.map((ct, idx) => {
              const isOpen = expandido[ct.id] !== false;
              return (<div key={ct.id} style={{ ...st.card, background: c.cardFundo }}>
                <div style={st.contaHeaderRow} onClick={() => toggleExpand(ct.id)}>
                  <div style={st.contaHeaderLeft}>
                    <div style={{ ...st.contaNum, background: c.destaque, color: c.primaria }}>{idx + 1}</div>
                    <h2 style={{ ...st.cardTitle2, color: c.texto }}>{getNomeConta(ct, idx)}</h2>
                  </div>
                  <div style={st.contaActions}>
                    {contas.length > 1 && <button style={st.removeBtn} onClick={(ev) => { ev.stopPropagation(); removeConta(ct.id); }}>✕</button>}
                    <span style={{ ...st.chevron, transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                  </div>
                </div>
                {isOpen && (
                  <div style={st.contaBody}>
                    <div className="grid2" style={st.cardGrid2}>
                      {CONFIG.camposConta.map((campo) => {
                        if (!campoVisivel(campo, ct)) return null;
                        return (
                          <Input key={campo.id} label={campo.label} value={ct[campo.id] || ""} placeholder={campo.placeholder}
                            tipo={campo.tipo} opcoes={campo.opcoes} cores={c}
                            senhaKey={campo.tipo === "senha" ? `${campo.id}-${ct.id}` : undefined}
                            senhasVisiveis={senhasVisiveis} toggleSenha={toggleSenha}
                            onChange={(e) => updateConta(ct.id, campo.id, formatador(campo.tipo, e.target.value))} />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>);
            })}

            <button style={{ ...st.addBtn, background: c.cardFundo }} onClick={addConta}>
              <span style={{ ...st.addPlus, background: c.destaque, color: c.primaria }}>+</span>Adicionar outra conta
            </button>

            {erroMsg && <div style={{ ...st.erroBox, color: c.erroCor }}>⚠ {erroMsg}</div>}
            <button style={{ ...st.submitBtn, background: c.primaria, color: c.destaque }} onClick={handleEnviarManual}>Revisar e enviar<span style={st.arrow}>→</span></button>
          </>)}

          {/* ── IMPORTAR ── */}
          {modo === "importar" && (<>
            <div style={{ ...st.card, background: c.cardFundo }}>

              {/* Passo a passo */}
              {[
                { n: "1", titulo: "Baixe o modelo", desc: "Baixe a planilha modelo já formatada no padrão correto.", acao: true },
                { n: "2", titulo: "Preencha no modelo", desc: "Abra no Excel ou Google Sheets e preencha as contas linha por linha conforme o exemplo abaixo." },
                { n: "3", titulo: "Copie as linhas preenchidas", desc: "Selecione só as linhas de dados (sem o cabeçalho) e pressione Ctrl+C." },
                { n: "4", titulo: "Cole aqui e envie", desc: "Clique na área abaixo e pressione Ctrl+V. Confira o preview e envie." },
              ].map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid #f0ede6" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: c.primaria, color: c.destaque, fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{p.n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700, color: c.primaria, marginBottom: 3 }}>{p.titulo}</div>
                    <div style={{ fontSize: 13, color: c.textoSuave, lineHeight: 1.5 }}>{p.desc}</div>
                    {p.acao && (
                      <button style={{ marginTop: 8, padding: "8px 16px", background: c.destaque, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, color: c.primaria, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: "pointer" }}
                        onClick={() => { const h = COLUNAS.map((col) => col.label).join("\t"); const b = new Blob([h + "\n"], { type: "text/plain;charset=utf-8" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "modelo_promo_smiles_mp.csv"; a.click(); URL.revokeObjectURL(u); }}>
                        ⬇ Baixar modelo
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Exemplo */}
              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.primaria, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>📊 Exemplo de linha preenchida:</div>
                <div style={st.previewScroll}>
                  <table style={st.previewTable}>
                    <thead><tr>{COLUNAS.map((col, i) => (<th key={i} style={{ ...st.previewTh, background: c.primaria, color: c.destaque }}>{col.coluna}<br /><span style={{ fontWeight: 400, fontSize: 9, opacity: 0.8 }}>{col.label.split(" ").slice(0, 2).join(" ")}</span></th>))}</tr></thead>
                    <tbody><tr style={{ background: "#f0fdf4" }}>{COLUNAS.map((col, i) => (<td key={i} style={{ ...st.previewTd, color: "#16a34a", fontWeight: 500 }}>{EXEMPLO[col.id] || "—"}</td>))}</tr></tbody>
                  </table>
                </div>
                <p style={{ fontSize: 11, color: c.textoSuave, marginTop: 6 }}>💡 Se <strong>não</strong> usou cartão próprio, preencha a coluna O com os últimos 4 dígitos do cartão MP.</p>
              </div>

              {/* Textarea */}
              <div style={{ fontSize: 12, fontWeight: 700, color: c.primaria, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cole aqui (Ctrl+V):</div>
              <textarea style={{ ...st.textarea, background: textoImport ? "#fff" : c.inputFundo, borderColor: textoImport ? c.primaria : c.inputBorda, color: c.texto }}
                placeholder="Selecione as linhas no Excel/Sheets → Ctrl+C → clique aqui → Ctrl+V" value={textoImport}
                onChange={(e) => handleTextoImport(e.target.value)} rows={6} />

              {previewRows.length > 0 && (
                <div style={st.previewBox}>
                  <div style={{ ...st.previewHeader, color: temErrosImport() ? c.erroCor : "#16a34a", background: temErrosImport() ? "#fef2f2" : "#f0fdf4" }}>
                    {temErrosImport()
                      ? `⚠ ${previewRows.filter((_, i) => Object.keys(previewErros[i] || {}).length > 0).length} linha(s) com erro — corrija antes de enviar`
                      : `✓ ${previewRows.length} linha(s) prontas para envio`}
                  </div>
                  <div style={st.previewScroll}>
                    <table style={st.previewTable}>
                      <thead><tr>{COLUNAS.map((col, i) => (<th key={i} style={{ ...st.previewTh, background: c.primaria, color: c.destaque }}>{col.coluna}</th>))}</tr></thead>
                      <tbody>{previewRows.slice(0, 10).map((vals, ri) => (
                        <tr key={ri}>{vals.map((v, ci) => {
                          const err = previewErros[ri]?.[ci];
                          return <td key={ci} style={{ ...st.previewTd, ...(err ? { background: "#fef2f2", color: c.erroCor } : {}) }} title={err || ""}>{v || "—"}{err && <span style={{ display: "block", fontSize: 9 }}>{err}</span>}</td>;
                        })}</tr>
                      ))}</tbody>
                    </table>
                  </div>
                  {previewRows.length > 10 && <p style={{ ...st.previewMore, color: c.textoSuave }}>... e mais {previewRows.length - 10}</p>}
                </div>
              )}
              {textoImport && previewRows.length === 0 && <div style={{ ...st.erroBox, color: c.erroCor, marginTop: 12 }}>⚠ Nenhuma linha reconhecida. Verifique se copiou as linhas de dados (sem cabeçalho) com {COLUNAS.length} colunas separadas por TAB.</div>}
            </div>
            {erroMsg && <div style={{ ...st.erroBox, color: c.erroCor }}>⚠ {erroMsg}</div>}
            <button style={{ ...st.submitBtn, background: c.primaria, color: c.destaque, opacity: previewRows.length === 0 || temErrosImport() ? 0.5 : 1 }}
              onClick={handleEnviarImport} disabled={previewRows.length === 0 || temErrosImport()}>
              Revisar {previewRows.length > 0 ? `${previewRows.length} linha${previewRows.length > 1 ? "s" : ""}` : ""}<span style={st.arrow}>→</span>
            </button>
          </>)}

          <p style={st.disclaimer}>🔒 Dados enviados com segurança para {CONFIG.empresa}.</p>
          {CONFIG.permitirConsulta && <p style={{ ...st.disclaimer, marginTop: 20 }}>Precisa corrigir?{" "}<button style={st.linkBtn} onClick={() => { setTela("consulta"); setConsultaResultado(null); setConsultaErro(""); setConsultaSucesso(""); }}>Consulte aqui</button></p>}
        </section>
      )}

      {/* ══════ REVISÃO ══════ */}
      {tela === "revisao" && (
        <section style={st.formWrap}>
          <div style={{ ...st.card, background: c.cardFundo }}>
            <h2 style={{ ...st.cardTitle, color: c.texto }}>📝 Confira antes de enviar</h2>
            <div style={st.previewScroll}>
              <table style={st.previewTable}>
                <thead><tr>{headerCompleto.map((h, i) => (<th key={i} style={{ ...st.previewTh, background: c.primaria, color: c.destaque }}>{h}</th>))}</tr></thead>
                <tbody>{rowsParaEnviar.map((row, ri) => (<tr key={ri}>{row.map((v, ci) => (<td key={ci} style={st.previewTd}>{v || "—"}</td>))}</tr>))}</tbody>
              </table>
            </div>
          </div>
          <div className="review-buttons" style={{ display: "flex", gap: 10 }}>
            <button style={{ ...st.submitBtn, flex: 1, background: "#e8e5dd", color: c.texto, boxShadow: "none" }} onClick={() => setTela("form")}>← Voltar</button>
            <button style={{ ...st.submitBtn, flex: 2, background: c.primaria, color: c.destaque }} onClick={confirmarEnvio}>Confirmar ({qtdEnviada})<span style={st.arrow}>→</span></button>
          </div>
        </section>
      )}

      {/* ══════ CONSULTA ══════ */}
      {tela === "consulta" && (
        <section style={{ ...st.formWrap, paddingTop: 40 }}>
          <div style={{ ...st.card, background: c.cardFundo }}>
            <h2 style={{ ...st.cardTitle, color: c.texto }}>🔍 Consultar cadastro</h2>
            <div className="search-bar" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <input style={{ ...st.input, flex: 1, background: c.inputFundo, borderColor: c.inputBorda, color: c.texto }}
                placeholder="Nome do parceiro ou nome do titular" value={consultaBusca} onChange={(e) => setConsultaBusca(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && consultarDados()} />
              <button style={{ ...st.submitBtn, width: "auto", padding: "11px 24px", background: c.primaria, color: c.destaque, fontSize: 14 }}
                onClick={consultarDados} disabled={consultaCarregando}>{consultaCarregando ? "..." : "Buscar"}</button>
            </div>
            {consultaErro && <div style={{ ...st.erroBox, color: c.erroCor }}>⚠ {consultaErro}</div>}
            {consultaSucesso && <div style={{ ...st.erroBox, background: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" }}>✓ {consultaSucesso}</div>}
            {consultaResultado && consultaResultado.map((r, ri) => (
              <ConsultaRow key={ri} valores={r.valores} rowIndex={r.rowIndex} header={headerCompleto} cores={c}
                onReenviar={reenviarCorrecao} carregando={consultaCarregando} />
            ))}
          </div>
          <button style={{ ...st.submitBtn, background: "#e8e5dd", color: c.texto, boxShadow: "none" }}
            onClick={() => { setTela("form"); setConsultaResultado(null); setConsultaBusca(""); setConsultaErro(""); setConsultaSucesso(""); }}>← Voltar</button>
        </section>
      )}

      {/* STATUS */}
      {tela === "enviando" && <div style={st.statusBox}><div style={{ ...st.spinner, borderTopColor: c.primaria }} /><h2 style={{ ...st.statusTitle, color: c.texto }}>Enviando...</h2></div>}
      {tela === "sucesso" && (<div style={st.statusBox}><div style={{ ...st.successIcon, background: c.destaque + "30", color: c.primaria }}>✓</div><h2 style={{ ...st.statusTitle, color: c.texto }}>Enviado!</h2><p style={{ ...st.statusSub, color: c.textoSuave }}>{qtdEnviada} conta{qtdEnviada > 1 ? "s" : ""} registrada{qtdEnviada > 1 ? "s" : ""}. {CONFIG.mensagemSucesso}</p><button style={{ ...st.resetBtn, background: c.destaque, color: c.primaria }} onClick={resetar}>Novo cadastro</button></div>)}
      {tela === "erro" && (<div style={st.statusBox}><div style={{ ...st.successIcon, background: "#fee", color: "#c00" }}>!</div><h2 style={{ ...st.statusTitle, color: c.texto }}>Erro no envio</h2><button style={{ ...st.resetBtn, background: c.destaque, color: c.primaria }} onClick={() => setTela("form")}>Tentar novamente</button></div>)}

      <footer style={st.footer}>{CONFIG.rodape}</footer>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder, textarea::placeholder { color: #a0a0a0; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: ${c.primaria} !important; box-shadow: 0 0 0 3px ${c.primaria}12; }
        button { cursor: pointer; transition: all .15s; }
        button:active { transform: scale(0.97); }
        button:disabled { cursor: not-allowed; }
        @media (max-width: 600px) {
          h1 { font-size: 28px !important; }
          h1 span { font-size: 36px !important; }
          .grid2 { grid-template-columns: 1fr !important; }
          .grid3 { grid-template-columns: 1fr !important; }
          .review-buttons { flex-direction: column !important; }
          .search-bar { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}

// ── Consulta Row editável ──
function ConsultaRow({ valores, rowIndex, header, cores, onReenviar, carregando }) {
  const [editando, setEditando] = useState(false);
  const [dados, setDados] = useState([...valores]);
  const c = cores;
  if (!editando) {
    return (<div style={{ padding: "14px 0", borderTop: "1px solid #f0ede6", marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <strong>{dados[1] || "—"}</strong>
        <button style={{ ...st.formatTag, background: c.destaque, color: c.primaria, border: "none", cursor: "pointer", fontWeight: 700 }} onClick={() => setEditando(true)}>Editar</button>
      </div>
      {header.map((h, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, borderBottom: "1px solid #f5f3ee" }}>
        <span style={{ color: c.textoSuave, fontSize: 11, textTransform: "uppercase" }}>{h}</span>
        <span style={{ color: c.texto, maxWidth: "60%", textAlign: "right", wordBreak: "break-all" }}>{dados[i] != null ? String(dados[i]) : "—"}</span>
      </div>))}
    </div>);
  }
  return (<div style={{ padding: "14px 0", borderTop: "1px solid #f0ede6", marginTop: 14 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: c.primaria, marginBottom: 12 }}>Editando:</div>
    {header.map((h, i) => (<div key={i} style={{ marginBottom: 8 }}>
      <label style={{ ...st.label, color: c.textoSuave, marginBottom: 4, display: "block" }}>{h}</label>
      <input style={{ ...st.input, background: c.inputFundo, borderColor: c.inputBorda, color: c.texto }}
        value={dados[i] != null ? String(dados[i]) : ""} onChange={(e) => { const n = [...dados]; n[i] = e.target.value; setDados(n); }} />
    </div>))}
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <button style={{ padding: "8px 16px", background: "#e8e5dd", color: c.texto, border: "none", borderRadius: 8, fontSize: 13 }} onClick={() => { setEditando(false); setDados([...valores]); }}>Cancelar</button>
      <button style={{ padding: "8px 16px", background: c.primaria, color: c.destaque, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700 }}
        onClick={() => onReenviar(rowIndex, dados)} disabled={carregando}>{carregando ? "Salvando..." : "Salvar"}</button>
    </div>
  </div>);
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
  subtitle: { fontSize: 15, maxWidth: 420, margin: "0 auto 18px", lineHeight: 1.6, fontWeight: 400 },
  formWrap: { maxWidth: 620, margin: "0 auto", padding: "0 16px 40px", animation: "fadeUp .5s ease-out .15s both" },
  tabBar: { display: "flex", gap: 4, marginBottom: 14, background: "#e8e5dd", borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: "10px 12px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all .2s" },
  card: { borderRadius: 14, padding: "22px 22px 18px", marginBottom: 14, border: "1px solid #e8e5dd", boxShadow: "0 1px 3px #0000000a" },
  cardIcon: { fontSize: 20, marginBottom: 6 },
  cardTitle: { fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16 },
  cardTitle2: { fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, margin: 0 },
  contaHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" },
  contaHeaderLeft: { display: "flex", alignItems: "center", gap: 12 },
  contaNum: { width: 32, height: 32, borderRadius: 8, fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  contaActions: { display: "flex", alignItems: "center", gap: 8 },
  chevron: { fontSize: 16, color: "#8a9a94", transition: "transform .2s" },
  removeBtn: { width: 26, height: 26, borderRadius: 6, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  contaBody: { marginTop: 18, paddingTop: 16, borderTop: "1px solid #f0ede6" },
  cardGrid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 },
  cardGrid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 8 },
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
  linkBtn: { background: "none", border: "none", color: "#1A3C34", textDecoration: "underline", fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, padding: 0, display: "inline" },
  miniBtn: { padding: "6px 14px", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" },
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
