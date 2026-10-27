import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { interpretarResposta, type ExtracaoProposta } from "@/lib/extracaoProposta";

const query = vi.fn();

vi.mock("@anthropic-ai/claude-agent-sdk", () => ({ query }));

const exemplo: ExtracaoProposta = {
  modelo: "Avenger Limited T200",
  precoAVista: 125079,
  precoProposta: null,
  entrada: 80000,
  parcelas: 24,
  valorParcela: 2492,
  parcelaFinal: null,
  taxaAnunciadaMensalPct: 0.99,
  opcionais: [{ nome: "Pintura metálica", valor: 2190 }],
  emplacamento: 2500,
};

const resposta = (texto: string, stop_reason = "end_turn") => ({ stop_reason, content: [{ type: "text", text: texto }] });

describe("interpretarResposta", () => {
  it("aceita JSON válido", () => {
    expect(interpretarResposta(resposta(JSON.stringify(exemplo)))).toEqual({ ok: true, dados: exemplo });
  });

  it("recusa JSON quebrado, campos faltando ou com tipo errado", () => {
    expect(interpretarResposta(resposta("{")).ok).toBe(false);
    const semEntrada: Partial<ExtracaoProposta> = { ...exemplo };
    delete semEntrada.entrada;
    expect(interpretarResposta(resposta(JSON.stringify(semEntrada))).ok).toBe(false);
    expect(interpretarResposta(resposta(JSON.stringify({ ...exemplo, entrada: "80.000" }))).ok).toBe(false);
  });

  it("recusa valores negativos e parcelas fracionadas", () => {
    expect(interpretarResposta(resposta(JSON.stringify({ ...exemplo, entrada: -1 }))).ok).toBe(false);
    expect(interpretarResposta(resposta(JSON.stringify({ ...exemplo, parcelas: 24.5 }))).ok).toBe(false);
  });

  it("trata recusa, corte por max_tokens e resposta sem texto", () => {
    expect(interpretarResposta(resposta("", "refusal")).ok).toBe(false);
    expect(interpretarResposta(resposta("{}", "max_tokens")).ok).toBe(false);
    expect(interpretarResposta({ stop_reason: "end_turn", content: [{ type: "thinking" }] }).ok).toBe(false);
  });
});

describe("POST /api/proposta/extrair", () => {
  const enviar = async (arquivo?: File) => {
    const { POST } = await import("@/app/api/proposta/extrair/route.server");
    const corpo = new FormData();
    if (arquivo) corpo.set("imagem", arquivo);
    return POST(new Request("http://localhost/api/proposta/extrair", { method: "POST", body: corpo }));
  };
  const foto = () => new File([new Uint8Array([1, 2, 3])], "proposta.png", { type: "image/png" });
  const init = { type: "system", subtype: "init" };
  const sucesso = (texto: string) => ({ type: "result", subtype: "success", is_error: false, stop_reason: "end_turn", result: texto });
  const responder = (...mensagens: object[]) =>
    query.mockImplementation(async function* () {
      yield* mensagens;
    });

  beforeEach(() => {
    query.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("valida o arquivo sem chamar o SDK", async () => {
    expect((await enviar()).status).toBe(400);
    expect((await enviar(new File(["x"], "a.txt", { type: "text/plain" }))).status).toBe(415);
    expect(query).not.toHaveBeenCalled();
  });

  it("devolve os campos extraídos e manda a imagem em base64, sem ferramentas e em 1 turno", async () => {
    let enviado: unknown[] = [];
    query.mockImplementation(({ prompt }: { prompt: AsyncIterable<unknown> }) =>
      (async function* () {
        enviado = await Array.fromAsync(prompt);
        yield init;
        yield sucesso(JSON.stringify(exemplo));
      })(),
    );
    const r = await enviar(foto());
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual(exemplo);
    const { options } = query.mock.calls[0][0];
    expect(options).toMatchObject({ model: "claude-opus-5-5", tools: [], maxTurns: 1, settingSources: [], persistSession: false });
    expect(options.systemPrompt).toMatch(/CPF/);
    expect(options.abortController).toBeInstanceOf(AbortController);
    expect(options.env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(enviado).toHaveLength(1);
    expect(enviado[0]).toMatchObject({
      type: "user",
      message: {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/png", data: Buffer.from([1, 2, 3]).toString("base64") } },
          { type: "text" },
        ],
      },
    });
  });

  it("responde 501 quando o Claude Code não está logado", async () => {
    query.mockImplementation(async function* () {
      yield init;
      yield { type: "assistant", error: "authentication_failed", message: { content: [] } };
      yield { ...sucesso("Not logged in"), is_error: true };
      throw new Error("Claude Code returned an error result: Not logged in");
    });
    const r = await enviar(foto());
    expect(r.status).toBe(501);
    expect((await r.json()).erro).toMatch(/Claude Code/);
  });

  it("responde 501 quando o Claude Code não inicia", async () => {
    query.mockImplementation(async function* () {
      throw new Error("spawn ENOENT");
    });
    expect((await enviar(foto())).status).toBe(501);
  });

  it("responde 422 quando o JSON não passa na validação", async () => {
    responder(init, sucesso(JSON.stringify({ ...exemplo, parcelas: "24" })));
    expect((await enviar(foto())).status).toBe(422);
    responder(init, sucesso("não é JSON"));
    expect((await enviar(foto())).status).toBe(422);
  });

  it("responde 504 quando passa do tempo limite", async () => {
    vi.useFakeTimers();
    query.mockImplementation(({ options }: { options: { abortController: AbortController } }) =>
      (async function* () {
        yield init;
        await new Promise((_, falha) => options.abortController.signal.addEventListener("abort", () => falha(new Error("aborted"))));
      })(),
    );
    const resposta = enviar(foto());
    await vi.advanceTimersByTimeAsync(60_000);
    expect((await resposta).status).toBe(504);
  });
});
