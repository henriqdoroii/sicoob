// /api/consulta-cpf.js

function onlyDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

function parseJsonSafe(value) {
  if (typeof value !== "string") return value;

  try {
    const parsed = JSON.parse(value);

    if (typeof parsed === "string") {
      try {
        return JSON.parse(parsed);
      } catch {
        return parsed;
      }
    }

    return parsed;
  } catch {
    return value;
  }
}

function formatarDataNascimento(valor) {
  valor = String(valor || "").trim();

  if (!valor) return "";

  const dataBR = valor.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (dataBR) {
    return `${dataBR[1]}/${dataBR[2]}/${dataBR[3]}`;
  }

  const dataISO = valor.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if (dataISO) {
    return `${dataISO[3]}/${dataISO[2]}/${dataISO[1]}`;
  }

  return valor;
}

function pegarCampo(obj, campos) {
  if (!obj || typeof obj !== "object") return "";

  for (const campo of campos) {
    if (
      obj[campo] !== undefined &&
      obj[campo] !== null &&
      String(obj[campo]).trim() !== ""
    ) {
      return String(obj[campo]).trim();
    }
  }

  return "";
}

function encontrarObjetoComDados(data) {
  data = parseJsonSafe(data);

  if (!data) return {};

  if (Array.isArray(data)) {
    for (const item of data) {
      const encontrado = encontrarObjetoComDados(item);
      if (encontrado && Object.keys(encontrado).length > 0) return encontrado;
    }

    return {};
  }

  if (typeof data === "object") {
    const temNascimento =
      pegarCampo(data, [
        "nascimento",
        "DT_NASCIMENTO",
        "dt_nascimento",
        "DATA_NASCIMENTO",
        "dataNascimento",
        "data_nascimento",
        "DATA_NASC",
        "data_nasc",
        "NASCIMENTO"
      ]) !== "";

    const temNome =
      pegarCampo(data, [
        "nome",
        "NOME",
        "name"
      ]) !== "";

    if (temNascimento || temNome) {
      return data;
    }

    const possiveis = [
      data?.dadosBasicos,
      data?.dados,
      data?.data?.dadosBasicos,
      data?.data,
      data?.resultado,
      data?.result,
      data?.response,
      data?.body
    ];

    for (const item of possiveis) {
      const encontrado = encontrarObjetoComDados(item);
      if (encontrado && Object.keys(encontrado).length > 0) return encontrado;
    }

    for (const value of Object.values(data)) {
      const encontrado = encontrarObjetoComDados(value);
      if (encontrado && Object.keys(encontrado).length > 0) return encontrado;
    }
  }

  return {};
}

function normalizarCPF(data) {
  const base = encontrarObjetoComDados(data);

  const nome = pegarCampo(base, [
    "nome",
    "NOME",
    "name"
  ]);

  const nomeMae = pegarCampo(base, [
    "mae",
    "MAE",
    "nomeMae",
    "nome_mae",
    "NOME_MAE",
    "NOME_DA_MAE",
    "MAE_NOME"
  ]);

  const nascimento = formatarDataNascimento(
    pegarCampo(base, [
      "nascimento",
      "DT_NASCIMENTO",
      "dt_nascimento",
      "DATA_NASCIMENTO",
      "dataNascimento",
      "data_nascimento",
      "DATA_NASC",
      "data_nasc",
      "NASCIMENTO"
    ])
  );

  return {
    dadosBasicos: {
      nome: nome || "Cliente",
      mae: nomeMae || "",
      nascimento
    }
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método não permitido. Use GET."
    });
  }

  const cpf = onlyDigits(req.query.cpf);

  if (!cpf || cpf.length !== 11) {
    return res.status(400).json({
      error: "CPF inválido. Envie 11 dígitos."
    });
  }

  const token = process.env.CPF_API_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "Token da API não configurado no servidor."
    });
  }

  const apiUrl = new URL("https://bk.elaiflow.dev/consultar-filtrada/cpf");
  apiUrl.searchParams.set("cpf", cpf);
  apiUrl.searchParams.set("token", token);

  try {
    const apiRes = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    const rawText = await apiRes.text();
    const data = parseJsonSafe(rawText);

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({
        error: data?.error || data?.message || "Erro na consulta de CPF."
      });
    }

    const normalized = normalizarCPF(data);

    if (!normalized.dadosBasicos.nascimento) {
      return res.status(404).json({
        error: "Não foi possível obter a data de nascimento.",
        recebido: data
      });
    }

    return res.status(200).json(normalized);
  } catch (err) {
    return res.status(500).json({
      error: "Erro interno ao consultar CPF.",
      detalhe: err.message
    });
  }
}
