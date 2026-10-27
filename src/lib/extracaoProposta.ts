import * as z from "zod";

export const MODELO_EXTRACAO = "claude-opus-5-5";
export const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type TipoImagem = (typeof TIPOS_IMAGEM)[number];
export const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;

const valor = z.number().nullable();

export const esquemaExtracao = z.object({
  modelo: z.string().nullable(),
  precoAVista: valor,
  precoProposta: valor,
  entrada: valor,
  parcelas: valor,
  valorParcela: valor,
  parcelaFinal: valor,
  taxaAnunciadaMensalPct: valor,
  opcionais: z.array(z.object({ nome: z.string(), valor: z.number() })),
  emplacamento: valor,
});

export type ExtracaoProposta = z.infer<typeof esquemaExtracao>;

export const PROMPT_EXTRACAO = `Você lê a foto de uma proposta de venda de carro de uma concessionária brasileira e devolve só os campos financeiros.

Campos (use null quando o campo não aparecer ou estiver ilegível; não invente valores):
- modelo: modelo e versão do carro, como escrito na proposta.
- precoAVista: preço do carro para pagamento à vista, em reais.
- precoProposta: preço do carro usado nesta proposta, se for diferente do à vista; senão null.
- entrada: valor de entrada, em reais.
- parcelas: número de parcelas mensais (sem contar a parcela final).
- valorParcela: valor de cada parcela mensal, em reais.
- parcelaFinal: parcela final, residual ou balão, em reais; null se não houver.
- taxaAnunciadaMensalPct: taxa de juros mensal anunciada, em porcentagem (0,99% vira 0.99; "taxa zero" vira 0); null se não aparecer.
- opcionais: itens cobrados à parte com valor (pintura, acessórios, películas etc.).
- emplacamento: valor de emplacamento, documentação ou despachante, em reais; null se não aparecer.

Valores em reais como número, sem símbolo e com ponto decimal (R$ 2.681,54 vira 2681.54).

Responda só com um objeto JSON com exatamente esses campos, sem markdown nem texto fora do JSON. Cada item de opcionais é {"nome": texto, "valor": número}; sem opcionais, use [].

Privacidade: a foto pode ter dados pessoais do cliente ou do vendedor. Ignore e nunca devolva nome, CPF, RG, CNH, endereço, telefone, e-mail, assinatura, placa, chassi ou RENAVAM, nem dentro do campo modelo ou dos nomes dos opcionais.`;

export type ResultadoExtracao = { ok: true; dados: ExtracaoProposta } | { ok: false; erro: string };

type BlocoResposta = { type: string; text?: string };
type RespostaModelo = { stop_reason: string | null; content: BlocoResposta[] };

export function interpretarResposta(resposta: RespostaModelo): ResultadoExtracao {
  if (resposta.stop_reason === "refusal") return { ok: false, erro: "A leitura da foto foi recusada. Preencha à mão." };
  if (resposta.stop_reason === "max_tokens") return { ok: false, erro: "A leitura ficou incompleta. Preencha à mão." };
  const texto = resposta.content.find((b) => b.type === "text")?.text;
  if (!texto) return { ok: false, erro: "A leitura não devolveu dados. Preencha à mão." };
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    return { ok: false, erro: "A leitura devolveu um formato inválido. Preencha à mão." };
  }
  const r = esquemaExtracao.safeParse(json);
  if (!r.success) return { ok: false, erro: "A leitura devolveu campos inválidos. Preencha à mão." };
  const d = r.data;
  const numeros = [d.precoAVista, d.precoProposta, d.entrada, d.parcelas, d.valorParcela, d.parcelaFinal, d.emplacamento];
  if (numeros.some((n) => n !== null && (!Number.isFinite(n) || n < 0)) || d.opcionais.some((o) => o.valor < 0)) {
    return { ok: false, erro: "A leitura devolveu valores negativos. Preencha à mão." };
  }
  if (d.parcelas !== null && !Number.isInteger(d.parcelas)) return { ok: false, erro: "Número de parcelas inválido. Preencha à mão." };
  return { ok: true, dados: d };
}
