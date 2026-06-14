// api/consulta-cpf.js
// Backend seguro para Vercel.
// Coloque este arquivo em: /api/consulta-cpf.js
//
// Este endpoint NÃO consulta base externa de CPF e NÃO retorna dados pessoais.
// Ele apenas valida o formato e os dígitos verificadores do CPF.
//
// Uso no front:
// GET  /api/consulta-cpf?cpf=00000000000
// POST /api/consulta-cpf  body: { "cpf": "00000000000" }

function onlyDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

function isValidCpf(cpf) {
  cpf = onlyDigits(cpf);

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(cpf[i]) * (10 - i);
  }

  let digit1 = 11 - (sum % 11);
  if (digit1 >= 10) digit1 = 0;
  if (digit1 !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(cpf[i]) * (11 - i);
  }

  let digit2 = 11 - (sum % 11);
  if (digit2 >= 10) digit2 = 0;

  return digit2 === Number(cpf[10]);
}

export default async function handler(req, res) {
  // CORS básico, caso o front esteja em outro domínio.
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({
      ok: false,
      error: "Método não permitido. Use GET ou POST."
    });
  }

  const rawCpf = req.method === "GET" ? req.query.cpf : req.body?.cpf;
  const cpf = onlyDigits(rawCpf);

  if (!cpf) {
    return res.status(400).json({
      ok: false,
      error: "CPF não informado."
    });
  }

  if (!isValidCpf(cpf)) {
    return res.status(400).json({
      ok: false,
      error: "CPF inválido."
    });
  }

  return res.status(200).json({
    ok: true,
    cpf,
    mensagem: "CPF válido."
  });
}
