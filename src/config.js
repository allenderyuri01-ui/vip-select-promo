// ╔══════════════════════════════════════════════════════════════╗
// ║  CONFIG — Formulário Smiles · Milhas Plus                   ║
// ╚══════════════════════════════════════════════════════════════╝

const CONFIG = {

  empresa: "Milhas Plus",
  titulo: "Cadastre suas",
  tituloDestaque: "contas",
  subtitulo: "Preencha os dados das contas Smiles e Livelo de forma rápida e segura.",
  rodape: "Milhas Plus © 2026",
  mensagemSucesso: "Contas registradas com sucesso!",

  // ── APPS SCRIPT ──
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbyIR0MgKn6V67xI1GLN1oklSIRrwIyC4uokz_06CEVwPatP2eYrVymtyH7D7QH-G_sDHw/exec",

  // ── PLANILHA ──
  // O script usa openById, então o ID fica no script, não aqui.
  // A aba fixa é "base fixa" — configurada no script.

  // ── ACESSO ──
  permitirImportacao: true,
  permitirConsulta: true,

  // ══════════════════════════════════════════
  // COLUNAS DA PLANILHA (A-P) — na ordem exata
  // A coluna A (DATA) é preenchida automaticamente.
  // ══════════════════════════════════════════

  // Campos do PARCEIRO RESPONSÁVEL (preenchidos 1x, repetidos em cada linha)
  camposResponsavel: [
    { id: "parceiroResp",   coluna: "B", label: "Parceiro responsável",           placeholder: "Seu nome",                    tipo: "text" },
    { id: "telResp",        coluna: "C", label: "Telefone (parceiro responsável)", placeholder: "(21) 99999-9999",             tipo: "tel" },
    { id: "pixResp",        coluna: "Q", label: "Pix parceiro responsável",        placeholder: "CPF, email ou telefone",      tipo: "text" },
  ],

  // Campos de cada CONTA (repetidos por conta adicionada)
  camposConta: [
    { id: "nomeTitular",    coluna: "D", label: "Nome titular da conta",                placeholder: "Nome completo",          tipo: "text" },
    { id: "dataNasc",       coluna: "E", label: "Data de nascimento (titular)",         placeholder: "DD/MM/AAAA",             tipo: "data" },
    { id: "telTitular",     coluna: "F", label: "Telefone (titular da conta)",          placeholder: "(21) 99999-9999",        tipo: "tel" },
    { id: "emailConta",     coluna: "G", label: "E-mail (registrado na conta)",         placeholder: "email@exemplo.com",      tipo: "email" },
    { id: "loginSmiles",    coluna: "H", label: "Login Smiles",                         placeholder: "email ou CPF",           tipo: "text" },
    { id: "senhaSmiles",    coluna: "I", label: "Senha Smiles",                         placeholder: "••••••••",               tipo: "senha" },
    { id: "loginLivelo",    coluna: "J", label: "Login Livelo",                         placeholder: "email ou CPF",           tipo: "text" },
    { id: "senhaLivelo",    coluna: "K", label: "Senha Livelo",                         placeholder: "••••••••",               tipo: "senha" },
    { id: "prazo",          coluna: "L", label: "Prazo de pagamento",                   placeholder: "Ex: 30 dias",            tipo: "text" },
    { id: "contaCheia",     coluna: "M", label: "Conta cheia?",                         placeholder: "",                       tipo: "select", opcoes: ["Sim", "Não"] },
    { id: "cartaoClube",    coluna: "N", label: "Usou cartão próprio no clube?",         placeholder: "",                       tipo: "select", opcoes: ["Sim", "Não"] },
    { id: "cartaoMP",       coluna: "O", label: "Cartão MP utilizado (últimos 4 dígitos)", placeholder: "Ex: 1234",             tipo: "text", condicional: { campo: "cartaoClube", valor: "Não" } },
    { id: "dataClube",      coluna: "P", label: "Data da assinatura do clube",          placeholder: "DD/MM/AAAA",             tipo: "data" },
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
