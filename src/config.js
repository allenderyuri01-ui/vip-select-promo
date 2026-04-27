// ╔══════════════════════════════════════════════════════════════╗
// ║  CONFIGURAÇÃO DO FORMULÁRIO — edite só aqui!               ║
// ╚══════════════════════════════════════════════════════════════╝

const CONFIG = {

  empresa: "Milhas Plus",
  titulo: "Cadastre suas",
  tituloDestaque: "contas",
  subtitulo: "Preencha os dados das suas contas de forma rápida e segura.",
  rodape: "Milhas Plus © 2026",
  mensagemSucesso: "Suas contas foram registradas com sucesso!",

  appsScriptUrl: "https://script.google.com/macros/s/AKfycbzxLDAPGMmHHQYL7pOO7owzqNJkL9dCyBCFMK84Hg0quGoO7Wjl-XkfPhjkyS85ZWSD/exec",
  abaPlanilha: "Promo Smiles Abr26",

  permitirImportacao: true,
  permitirConsulta: true,

  programas: [ ],

  camposTitular: [
    { id: "titularNome", label: "Nome do titular",       placeholder: "Nome completo",    tipo: "text" },
    { id: "cpf",         label: "CPF (só números)",      placeholder: "00000000000",      tipo: "cpf" },
    { id: "dataNasc",    label: "Data de nascimento",    placeholder: "DD/MM/AAAA",       tipo: "data" },
    { id: "pix",         label: "Pix para recebimento",  placeholder: "CPF, email ou telefone", tipo: "text" },
  ],

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
