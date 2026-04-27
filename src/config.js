// ╔══════════════════════════════════════════════════════════════╗
// ║  CONFIGURAÇÃO — branding e campos (igual pra todas promos) ║
// ╚══════════════════════════════════════════════════════════════╝

const CONFIG = {

  // ── IDENTIDADE ──
  empresa: "Milhas Plus",
  titulo: "Cadastre suas",
  tituloDestaque: "contas",
  subtitulo: "Preencha os dados das suas contas de forma rápida e segura.",
  rodape: "Milhas Plus © 2026",
  mensagemSucesso: "Suas contas foram registradas com sucesso!",

  // ── APPS SCRIPT ──
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbzxLDAPGMmHHQYL7pOO7owzqNJkL9dCyBCFMK84Hg0quGoO7Wjl-XkfPhjkyS85ZWSD/exec",

  // ── IMPORTAÇÃO / CONSULTA ──
  permitirImportacao: true,
  permitirConsulta: true,

  // ── PROGRAMAS (compartilhado entre promos) ──
  programas: [
    { id: "smiles", nome: "Smiles", emoji: "😊", cor: "#FF6600" },
    { id: "livelo", nome: "Livelo", emoji: "💎", cor: "#6B2D8B" },
  ],

  // ── CAMPOS DO TITULAR ──
  camposTitular: [
    { id: "titularNome", label: "Nome do titular",      placeholder: "Nome completo",          tipo: "text" },
    { id: "cpf",         label: "CPF (só números)",     placeholder: "00000000000",            tipo: "cpf" },
    { id: "dataNasc",    label: "Data de nascimento",   placeholder: "DD/MM/AAAA",             tipo: "data" },
    { id: "pix",         label: "Pix para recebimento", placeholder: "CPF, email ou telefone", tipo: "text" },
  ],

  // ── CORES ──
  cores: {
    primaria:   "#1A3C34",
    destaque:   "#F2D645",
    fundo:      "#FAFAF6",
    cardFundo:  "#ffffff",
    texto:      "#1A3C34",
    textoSuave: "#6a8a80",
    inputFundo: "#FAFAF6",
    inputBorda: "#e0ddd5",
    erroCor:    "#dc2626",
  },
};

export default CONFIG;
