// /api/proxy.js
// Backend Vercel para consultar CPF sem expor token no front-end.
// Front chama: /api/proxy?cpf=00000000000

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

function pick(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return "";
}

function normalizeApiResponse(data) {
  const base =
    data?.dadosBasicos ||
    data?.dados_basicos ||
    data?.data?.dadosBasicos ||
    data?.data?.dados_basicos ||
    data?.result?.dadosBasicos ||
    data?.resultado?.dadosBasicos ||
    data?.data ||
    data;

  return {
    dadosBasicos: {
      nome: pick(base, ["nome", "NOME", "name"]) || "Cliente",
      mae: pick(base, ["mae", "nomeMae", "nome_mae", "NOME_MAE", "mae_nome"]),
      nascimento: pick(base, [
        "nascimento",
        "dataNascimento",
        "data_nascimento",
        "DATA_NASCIMENTO",
        "nasc",
        "dtNascimento",
      ]),
    },
  };
}

export default async function handler(req, res) {
  // CORS opcional
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método não permitido. Use GET.",
    });
  }

  const cpf = onlyDigits(req.query.cpf);

  if (!cpf || cpf.length !== 11) {
    return res.status(400).json({
      error: "CPF inválido. Envie 11 dígitos.",
    });
  }

  if (!isValidCpf(cpf)) {
    return res.status(400).json({
      error: "CPF inválido.",
    });
  }

  const token = process.env.CPF_API_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "Token da API não configurado no servidor.",
    });
  }

  const apiUrl = new URL("https://bk.elaiflow.dev/consultar-filtrada/cpf");
  apiUrl.searchParams.set("cpf", cpf);
  apiUrl.searchParams.set("token", token);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const apiRes = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    let data;
    try {
      data = await apiRes.json();
    } catch {
      return res.status(502).json({
        error: "A API de CPF retornou uma resposta inválida.",
      });
    }

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({
        error: data?.error || data?.message || "Erro na consulta de CPF.",
      });
    }

    const normalized = normalizeApiResponse(data);

    if (!normalized.dadosBasicos.nascimento) {
      return res.status(404).json({
        error: "Não foi possível obter a data de nascimento.",
      });
    }

    return res.status(200).json(normalized);
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      return res.status(504).json({
        error: "Tempo limite excedido na consulta de CPF.",
      });
    }

    return res.status(500).json({
      error: "Erro interno ao consultar CPF.",
    });
  }
}
