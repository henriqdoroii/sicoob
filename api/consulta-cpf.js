// api/consulta-cpf.js
// Rota backend para Vercel.
// Coloque este arquivo exatamente em: /api/consulta-cpf.js
//
// Esta versão valida CPF sem expor token no front-end e sem retornar dados pessoais.
// O index.html chama: /api/consulta-cpf?cpf=00000000000

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
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Método não permitido. Use GET."
    });
  }

  const cpf = onlyDigits(req.query.cpf);

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
