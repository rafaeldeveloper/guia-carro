# Backlog

## Parte 1: busca e escolha (em andamento)
- [x] Busca com filtros (orçamento, vão livre, equipamentos) e ordenação por risco ou preço
- [x] Ficha do carro com nota de risco detalhada por sistema
- [ ] Ampliar a base além dos 4 finalistas (SUVs até R$ 150 mil, depois top 30)
- [x] Layout com base no benchmark: identidade visual, régua de risco, filtros em folha inferior no mobile, detalhe por sistema
- [x] Relayout (2026-10-27): página inicial com busca, sugestões guiadas e vitrines; /comparar com régua comum; grafite com amarelo só na marca e no botão principal; Inter; largura única de 1180px; faixa de 3 números na página do carro
- [x] Fotos da Wikimedia Commons (2026-10-27): uma foto por carro (28 de 28) com licença CC BY ou CC BY-SA, crédito na página do carro e em /creditos (`src/data/fotos.ts`); só redimensionadas para WebP, sem corte
  - Modelos sem foto: nenhum; a ilustração por tipo continua como reserva
  - Fotos de outra versão ou mercado (mesma geração): Avenger, Strada, Creta, Kicks, HR-V, City e Basalt entre outros; Onix hatch é anterior à reestilização de 2025 (trocar quando houver foto do 2025 na Commons)
- [ ] Pedir às montadoras fotos de imprensa com autorização de uso (versão exata vendida no Brasil)
- [ ] Comparação lado a lado (até 3 carros no desktop, 2 no mobile; cabeçalho fixo, "só diferenças", melhor valor de cada linha destacado)
- [ ] Veredito no topo do detalhe: resumo em 1 frase + "o que é bom" / "o que preocupa" (3 itens cada)

## Parte 2: preço justo
- [x] Comparar preço pedido com FIPE, tabela da montadora, anúncios e promoções (faixa min/alvo/max, veredito em 4 níveis, régua e campo de preço na ficha)
- [x] Dados de mercado dos 4 finalistas (FIPE out/2026, tabela, promoções; anúncios só do Avenger)
- [ ] Anúncios de concessionárias no CE para Renegade, 2008 e Strada; tabela 2026 atual de 2008 e Strada
- [ ] Preencher `precoMercado` nos carros da base ampliada

## Parte 3: proposta e pagamento
- [x] POC em /proposta: formulário manual, taxa real sobre o preço à vista (Price) vs anunciada, total e juros, detecção de "taxa zero" com juro, comparação com empréstimo com IOF financiado, taxa de empate e perguntas para a loja
- [x] POC da leitura por foto: rota /api/proposta/extrair (Claude Opus 5.5, saída JSON validada, sem gravar imagem nem dados pessoais)
- [x] Leitura por foto com a conta Claude do Claude Code logado via Agent SDK (sem ferramentas, 1 turno, sem settings do usuário, limite de 60 s; 501 sem login)
  - Login da conta Claude via Agent SDK serve para uso local/pessoal; para publicar o app para outras pessoas é preciso usar a API com chave própria (os termos não permitem oferecer o login/limites do Claude.ai a terceiros sem aprovação) e limitar uso
- [ ] Testar a leitura com propostas reais (com consentimento) e medir acerto por campo
- [ ] Limite de uso e proteção contra abuso na rota de leitura antes de publicar
- [ ] CET completo: tarifa de cadastro, registro, seguro prestamista e IOF do financiamento da loja
- [ ] Comparar propostas com prazos diferentes por valor presente (hoje o empréstimo usa o mesmo prazo da proposta)
- [ ] Ligar a proposta à ficha do carro (preço à vista contra a faixa do preço justo)

## Parte 4: ficha do carro de quem já comprou
- [x] POC em /minha-ficha (2026-10-27): cadastro do carro (modelo da base ou outro, ano-modelo, compra, km, preço pago, última revisão) guardado só no navegador (localStorage, com fallback em memória); sem placa, chassi, RENAVAM nem dados pessoais
- [x] Valor hoje: FIPE do ano-modelo pela rota /api/ficha/fipe (API pública parallelum, cache diário de 86400 s), depreciação em R$, % e por mês; fallback no valor salvo em `precoMercado` quando a API falha
- [x] Manutenção: próxima revisão por km ou tempo (o que vier primeiro, com projeção pelo ritmo de km), custos de revisão do Avenger e do Renegade (`src/data/fichaCarros.ts`), garantia restante com alerta abaixo de 6 meses
- [x] Riscos do conjunto (nota e principais da base) e "o que observar" por carro
- [x] Recalls: links oficiais (montadora, Senatran, Senacon) e instrução, sem coletar chassi
- [ ] Recalls por modelo/ano: consultar campanhas em fonte pública (Senacon publica as campanhas; verificar se há dado aberto ou API) e avisar quando sair recall do modelo
- [ ] Reclamações novas do conjunto (Reclame Aqui) e boletins técnicos desde a compra
- [ ] Intervalo e custo de revisão de 2008 e Strada; garantia e revisão para carros "outro"
- [ ] Nota de risco por ano-modelo (hoje o Renegade 2025 usa os dados do 2027)
- [ ] Código FIPE para carros fora da base (busca por marca/modelo/ano na API)
- [ ] Histórico de FIPE (curva de depreciação mês a mês)
- [ ] Alertas por e-mail/push: revisão chegando, fim da garantia, recall novo, queda forte da FIPE
- [ ] Contas no servidor para sincronizar a ficha entre aparelhos (consentimento, LGPD, exclusão de dados)

## Ajustes depois do merge (2026-10-27)
- [x] Régua do preço justo no painel lateral: rótulos de FIPE, anúncios e tabela se sobrepõem na largura de 340px (marcadores numerados com distribuição sem colisão e legenda abaixo; referências e regra em blocos recolhíveis)

## Seminovos e usados (pedido em 2026-10-27)
O carro não precisa ser 0 km. Para cobrir usados:
- [ ] Modelo de dados por geração/ano-modelo, não só pela versão 0 km (o risco depende do conjunto motor/câmbio de cada ano)
- [ ] Busca com filtro 0 km / usado, faixa de ano-modelo e km
- [ ] Nota de risco por ano-modelo: recalls do lote, reclamações da geração e garantia restante (de fábrica e de loja)
- [ ] Preço justo de usado: FIPE do ano-modelo, ajuste por km e estado, faixa de anúncios da mesma versão e região
- [ ] Textos da interface sem "0 km" fixo
