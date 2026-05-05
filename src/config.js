// ╔══════════════════════════════════════════════════════════════╗
// ║  CONFIG — Milhas Plus · Formulário de Fornecedores          ║
// ╚══════════════════════════════════════════════════════════════╝

const CONFIG = {

  empresa: "Milhas Plus",
  titulo: "Cadastre suas",
  tituloDestaque: "contas",
  subtitulo: "Preencha os dados das suas contas de forma rápida e segura.",
  rodape: "Milhas Plus © 2026",
  mensagemSucesso: "Cadastro registrado com sucesso!",

  appsScriptUrl: "https://script.google.com/macros/s/AKfycbyIR0MgKn6V67xI1GLN1oklSIRrwIyC4uokz_06CEVwPatP2eYrVymtyH7D7QH-G_sDHw/exec",

  permitirImportacao: true,
  permitirConsulta: true,

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

  // ══════════════════════════════════════════════════════════════
  // TIPOS DE FORMULÁRIO
  // Coluna A = DATA (timestamp automático)
  // Colunas B em diante = dados do fornecedor
  // ══════════════════════════════════════════════════════════════

  tipos: {

    // ── VENDA DE CONTA — 16 campos (B-Q) + timestamp A ──
    "venda-conta": {
      label: "Venda de Conta",
      descricao: "Fornecedor vende a conta vazia para abastecimento",
      aba: "VENDA DE CONTA",
      emoji: "🏦",

      camposResponsavel: [
        { id: "parceiroResp", coluna: "B", label: "Parceiro responsável",           placeholder: "Seu nome",        tipo: "text" },
        { id: "telResp",      coluna: "C", label: "Telefone (parceiro responsável)", placeholder: "(21) 99999-9999", tipo: "tel"  },
      ],

      camposConta: [
        { id: "nomeTitular", coluna: "D", label: "Nome titular da conta",                placeholder: "Nome completo",          tipo: "text"   },
        { id: "dataNasc",    coluna: "E", label: "Data de nascimento (titular)",         placeholder: "DD/MM/AAAA",             tipo: "data"   },
        { id: "telTitular",  coluna: "F", label: "Telefone (titular da conta)",          placeholder: "(21) 99999-9999",        tipo: "tel"    },
        { id: "emailConta",  coluna: "G", label: "E-mail (registrado na conta)",         placeholder: "email@exemplo.com",      tipo: "email"  },
        { id: "loginSmiles", coluna: "H", label: "Login Smiles",                         placeholder: "email ou CPF",           tipo: "text"   },
        { id: "senhaSmiles", coluna: "I", label: "Senha Smiles",                         placeholder: "••••••••",               tipo: "senha"  },
        { id: "prazo",       coluna: "J", label: "Prazo de pagamento",                   placeholder: "Ex: 30 dias",            tipo: "text"   },
        { id: "saldo",       coluna: "K", label: "Saldo ofertado para venda",            placeholder: "Ex: 50000",              tipo: "text"   },
        { id: "temPontos",   coluna: "L", label: "A conta possui pontos além da oferta?",placeholder: "",                       tipo: "select", opcoes: ["Sim", "Não"] },
        { id: "totalSaldo",  coluna: "M", label: "Total de saldo na conta",              placeholder: "Ex: 80000",              tipo: "text",  condicional: { campo: "temPontos", valor: "Sim" } },
        { id: "cpfs",        coluna: "N", label: "CPFs disponíveis (rec. todos)",        placeholder: "CPF1, CPF2...",          tipo: "text"   },
        { id: "cartaoMP",    coluna: "O", label: "Cartão MP utilizado",                  placeholder: "Últimos 4 dígitos",      tipo: "text"   },
        { id: "dataClube",   coluna: "P", label: "Data da assinatura do clube",          placeholder: "DD/MM/AAAA",             tipo: "data"   },
        { id: "pixResp",     coluna: "Q", label: "Pix para recebimento",                 placeholder: "CPF, email ou telefone", tipo: "text"   },
      ],
    },

    // ── VENDA DE SALDO — 14 campos (B-O) + timestamp A ──
    "venda-saldo": {
      label: "Venda de Saldo",
      descricao: "Fornecedor faz abastecimento próprio e vende as milhas",
      aba: "VENDA DE SALDO",
      emoji: "✈️",

      camposResponsavel: [
        { id: "parceiroResp", coluna: "B", label: "Parceiro responsável",           placeholder: "Seu nome",        tipo: "text" },
        { id: "telResp",      coluna: "C", label: "Telefone (parceiro responsável)", placeholder: "(21) 99999-9999", tipo: "tel"  },
      ],

      camposConta: [
  { id: "nomeTitular", coluna: "D", label: "Nome titular da conta",                  placeholder: "Nome completo",          tipo: "text"   },
  { id: "dataNasc",    coluna: "E", label: "Data de nascimento (do titular da conta)", placeholder: "DD/MM/AAAA",           tipo: "data"   },
  { id: "telTitular",  coluna: "F", label: "Telefone (do titular da conta)",          placeholder: "(21) 99999-9999",        tipo: "tel"    },
  { id: "emailConta",  coluna: "G", label: "E-mail (registrado na conta)",            placeholder: "email@exemplo.com",      tipo: "email"  },
  { id: "loginSmiles", coluna: "H", label: "Login Smiles",                            placeholder: "email ou CPF",           tipo: "text"   },
  { id: "senhaSmiles", coluna: "I", label: "Senha Smiles",                            placeholder: "••••••••",               tipo: "senha"  },

  { id: "prazo",       coluna: "J", label: "Prazo de pagamento",                      placeholder: "30 dias / exceção...",   tipo: "text"   },
  { id: "saldo",       coluna: "K", label: "Saldo ofertado para venda",               placeholder: "Ex: 50000",              tipo: "text"   },

  { id: "temPontos",   coluna: "L", label: "A conta possui pontos além da oferta de venda?", placeholder: "", tipo: "select", opcoes: ["Sim", "Não"] },

  { id: "totalSaldo",  coluna: "M", label: "Total de saldo na conta",                 placeholder: "Ex: 80000",              tipo: "text",
    condicional: { campo: "temPontos", valor: "Sim" }
  },

  { id: "cpfs",        coluna: "N", label: "CPFs disponíveis (rec. todos)",           placeholder: "CPF1, CPF2...",          tipo: "text"   },
  { id: "cartaoMP",    coluna: "O", label: "Cartão MP utilizado",                     placeholder: "Últimos 4 dígitos",      tipo: "text"   },
  { id: "dataClube",   coluna: "P", label: "Data da assinatura do clube",             placeholder: "DD/MM/AAAA",             tipo: "data"   },
  { id: "pixResp",     coluna: "Q", label: "Pix para recebimento",                    placeholder: "CPF, email ou telefone", tipo: "text"   },
]

export default CONFIG;
