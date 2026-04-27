// ╔══════════════════════════════════════════════════════════════╗
// ║  CONFIGURAÇÃO DO FORMULÁRIO — edite só aqui!               ║
// ║  Copie este arquivo e altere os valores pra cada cliente    ║
// ╚══════════════════════════════════════════════════════════════╝

const CONFIG = {

  // ── DADOS DO CLIENTE ──
  empresa: "Milhas Plus",               // Nome da empresa
  titulo: "Cadastre suas",              // Primeira linha do título
  tituloDestaque: "contas",             // Palavra em destaque (amarelo)
  subtitulo: "Preencha os dados das suas contas de forma rápida e segura.",
  rodape: "Milhas Plus © 2026",

  // ── MENSAGENS ──
  mensagemSucesso: "Suas contas foram registradas com sucesso!",

  // ── APPS SCRIPT ──
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbzxLDAPGMmHHQYL7pOO7owzqNJkL9dCyBCFMK84Hg0quGoO7Wjl-XkfPhjkyS85ZWSD/exec",
  
  // ── ABA DA PLANILHA ──
  // Mude isso a cada promoção nova. O Apps Script cria a aba automaticamente.
  abaPlanilha: "Promo Smiles Abr26",

  // ── IMPORTAÇÃO EM MASSA ──
  // Se true, mostra a aba "Importar planilha" além do formulário manual
  permitirImportacao: true,

  // ── PROGRAMAS ──
  // Cada programa vira uma seção no formulário com campos de email + senha
  programas: [
    { id: "smiles",  nome: "Smiles",  emoji: "😊", cor: "#FF6600" },
    { id: "livelo",  nome: "Livelo",  emoji: "💎", cor: "#6B2D8B" },
  ],

  // ── CAMPOS DO TITULAR ──
  // Campos que aparecem na seção "Dados do titular" de cada conta
  // Tipos: "text", "cpf", "data", "email"
  camposTitular: [
    { id: "titularNome", label: "Nome do titular",     placeholder: "Nome completo", tipo: "text" },
    { id: "cpf",         label: "CPF (só números)",    placeholder: "00000000000",   tipo: "cpf" },
    { id: "dataNasc",    label: "Data de nascimento",  placeholder: "DD/MM/AAAA",    tipo: "data" },
  ],

  // ── CORES (baseadas na logo Milhas Plus) ──
  cores: {
    primaria:     "#1A3C34",   // verde escuro
    destaque:     "#F2D645",   // amarelo
    fundo:        "#FAFAF6",   // fundo claro
    cardFundo:    "#ffffff",   // fundo dos cards
    texto:        "#1A3C34",   // cor do texto
    textoSuave:   "#6a8a80",   // texto secundário
    inputFundo:   "#FAFAF6",   // fundo dos inputs
    inputBorda:   "#e0ddd5",   // borda dos inputs
    erroCor:      "#dc2626",   // cor de erro
  },
};

export default CONFIG;
