import { query, type SDKAssistantMessageError, type SDKResultMessage, type SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import {
  MODELO_EXTRACAO,
  PROMPT_EXTRACAO,
  TAMANHO_MAXIMO_IMAGEM,
  TIPOS_IMAGEM,
  interpretarResposta,
  type TipoImagem,
} from "@/lib/extracaoProposta";

const TEMPO_LIMITE_MS = 60_000;
const ERROS_DE_CONTA: SDKAssistantMessageError[] = [
  "authentication_failed",
  "oauth_org_not_allowed",
  "account_on_hold",
  "verification_required",
  "billing_error",
];
const SEM_CONTA = "Leitura por foto indisponível: o servidor precisa do Claude Code instalado e logado. Preencha à mão.";

const erro = (mensagem: string, status: number) => Response.json({ erro: mensagem }, { status });

export async function POST(request: Request) {
  let imagem: FormDataEntryValue | null;
  try {
    imagem = (await request.formData()).get("imagem");
  } catch {
    return erro("Envie a foto no campo imagem.", 400);
  }
  if (!(imagem instanceof File)) return erro("Envie a foto no campo imagem.", 400);
  if (!TIPOS_IMAGEM.includes(imagem.type as TipoImagem)) return erro("Use uma foto JPG, PNG, WebP ou GIF.", 415);
  if (imagem.size > TAMANHO_MAXIMO_IMAGEM) return erro("A foto passa de 5 MB.", 413);

  const dados = Buffer.from(await imagem.arrayBuffer()).toString("base64");
  const mensagem: SDKUserMessage = {
    type: "user",
    parent_tool_use_id: null,
    message: {
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: imagem.type as TipoImagem, data: dados } },
        { type: "text", text: "Extraia os campos financeiros desta proposta." },
      ],
    },
  };
  async function* entrada() {
    yield mensagem;
  }

  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  let iniciou = false;
  let erroConta: SDKAssistantMessageError | undefined;
  let resultado: SDKResultMessage | undefined;

  async function ler() {
    for await (const m of query({
      prompt: entrada(),
      options: {
        model: MODELO_EXTRACAO,
        systemPrompt: PROMPT_EXTRACAO,
        tools: [],
        maxTurns: 1,
        settingSources: [],
        persistSession: false,
        abortController: controle,
        env: { ...process.env, ANTHROPIC_API_KEY: undefined },
      },
    })) {
      if (m.type === "system" && m.subtype === "init") iniciou = true;
      else if (m.type === "assistant" && m.error) erroConta = m.error;
      else if (m.type === "result") resultado = m;
    }
  }
  await ler()
    .catch(() => undefined)
    .finally(() => clearTimeout(limite));

  if (controle.signal.aborted) return erro("A leitura da foto demorou demais. Tente de novo ou preencha à mão.", 504);
  if (!iniciou || (erroConta && ERROS_DE_CONTA.includes(erroConta))) return erro(SEM_CONTA, 501);
  if (erroConta === "rate_limit") return erro("Muitas leituras agora. Tente de novo em instantes ou preencha à mão.", 429);
  if (!resultado || resultado.subtype !== "success" || resultado.is_error) {
    return erro("A leitura da foto falhou. Preencha à mão.", 502);
  }

  const lido = interpretarResposta({
    stop_reason: resultado.stop_reason,
    content: [{ type: "text", text: resultado.result }],
  });
  return lido.ok ? Response.json(lido.dados) : erro(lido.erro, 422);
}
