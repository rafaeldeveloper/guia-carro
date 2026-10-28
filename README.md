# Guia do Carro

Compara carros 0 km pela nota de risco (reclamações por 1.000 vendidos), mostra o preço justo de cada um, calcula o juro escondido numa proposta de financiamento e acompanha o carro que você comprou (FIPE, revisão, garantia). Os dados da ficha ficam só no navegador.

Site público: https://rafaeldeveloper.github.io/guia-carro/

## Rodar local

```bash
npm ci
npm run dev        # http://localhost:3000
npm test
```

A leitura da proposta por foto (`/api/proposta/extrair`) usa o Claude Agent SDK e só funciona na versão local, com o Claude Code instalado e logado na máquina (`claude` → `/login`). Sem isso, o app avisa e o formulário manual continua funcionando.

## Busca

A busca da inicial e do Comparar roda toda no navegador (`src/lib/busca.ts`): várias palavras em qualquer ordem, sem acento, com correção de erro de digitação, ordem por relevância e autocomplete. Preço, tipo e equipamentos escritos na frase ("suv até 160 mil", "120k", "picape com couro") viram filtros. Sinônimos, apelidos de marca e atalhos do autocomplete ficam em `src/data/sinonimos.ts`.

## Publicação no GitHub Pages

O workflow `.github/workflows/pages.yml` roda a cada push no `main` e uma vez por dia (para atualizar datas e promoções): `npm ci`, `npm test`, `npm run build` com `GITHUB_PAGES=true` e publica a pasta `out/`.

Com `GITHUB_PAGES=true` o Next gera um site estático (`output: "export"`) em `/guia-carro`:

- a rota de leitura por foto fica fora do build e os botões de foto somem da página de proposta;
- a FIPE da Minha ficha é buscada direto do navegador em fipe.parallelum.com.br, com cache de 24 h;
- o preço justo da página de cada carro usa a data do build.

Para testar o build estático: `GITHUB_PAGES=true npm run build` e sirva `out/` sob o caminho `/guia-carro/`.
