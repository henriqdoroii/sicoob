# Arquivos para subir na Vercel

Estrutura:

```txt
seu-projeto/
├─ index.html
├─ 3.html
├─ images/
├─ js/
└─ api/
   └─ consulta-cpf.js
```

O `index.html` mantém o layout original e chama:

```js
/api/consulta-cpf?cpf=${cpf}
```

A pasta `api` deve ficar na raiz do projeto, não dentro da pasta `js`.

Observação: esta versão valida CPF, mas não consulta base externa nem retorna nome, mãe, nascimento, telefone, endereço ou renda.
