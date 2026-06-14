# Backend seguro para consulta-cpf

Coloque o arquivo:

```txt
api/consulta-cpf.js
```

na raiz do seu projeto na Vercel:

```txt
seu-projeto/
├─ index.html
├─ 3.html
├─ images/
├─ js/
└─ api/
   └─ consulta-cpf.js
```

No front-end, chame:

```js
const url = `/api/consulta-cpf?cpf=${cpf}`;
const res = await fetch(url, { method: 'GET' });
const responseData = await res.json();

if (!res.ok || !responseData.ok) {
  throw new Error(responseData.error || 'Erro ao validar CPF.');
}
```

Este endpoint valida CPF pelo algoritmo oficial de dígitos verificadores.
Ele não puxa nome, nome da mãe ou data de nascimento.
