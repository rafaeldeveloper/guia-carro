import { dadosFicha, codigoFipe } from "@/data/fichaCarros";
import { precosMercado } from "@/data/precoMercado";
import { lerPrecoFipe } from "@/lib/ficha";

const API = "https://fipe.parallelum.com.br/api/v2/cars";
const UM_DIA = 86400;
const TEMPO_LIMITE_MS = 10_000;

type ValorFipe = { valor: number; anoModelo: number; mesReferencia: string; codigo: string; modelo: string | null };

class FalhaFipe extends Error {}

async function buscarJson(url: string): Promise<unknown> {
  let relogio: ReturnType<typeof setTimeout> | undefined;
  const tempo = new Promise<never>((_, falha) => {
    relogio = setTimeout(() => falha(new FalhaFipe("A tabela FIPE demorou demais para responder.")), TEMPO_LIMITE_MS);
  });
  const resposta = await Promise.race([fetch(url, { next: { revalidate: UM_DIA } }), tempo]).finally(() =>
    clearTimeout(relogio),
  );
  if (!resposta.ok && resposta.status !== 404) throw new FalhaFipe(`A tabela FIPE respondeu com erro ${resposta.status}.`);
  return resposta.json();
}

function salvo(carroId: string, anoModelo: number, codigo: string): ValorFipe | null {
  const fipe = precosMercado[carroId]?.fipe;
  if (!fipe || fipe.anoModelo !== anoModelo || fipe.codigo !== codigo) return null;
  return { valor: fipe.valor, anoModelo, mesReferencia: fipe.mesReferencia, codigo, modelo: null };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const carroId = params.get("carro") ?? "";
  const anoModelo = Number(params.get("ano"));
  if (!dadosFicha[carroId] || !Number.isInteger(anoModelo) || anoModelo < 1990 || anoModelo > 2100)
    return Response.json({ erro: "Carro ou ano-modelo inválido." }, { status: 400 });
  const codigo = codigoFipe(carroId, anoModelo);
  if (!codigo) return Response.json({ erro: "Carro sem código FIPE mapeado." }, { status: 404 });

  const cabecalhos = { "Cache-Control": `public, max-age=3600, s-maxage=${UM_DIA}` };
  try {
    const anos = await buscarJson(`${API}/${codigo}/years`);
    if (!Array.isArray(anos)) throw new FalhaFipe("Resposta inesperada da tabela FIPE.");
    const ano = anos.find((a): a is { code: string } => typeof a?.code === "string" && a.code.startsWith(`${anoModelo}-`));
    if (!ano) {
      const disponiveis = anos
        .map((a) => Number(String(a?.code).split("-")[0]))
        .filter((a) => a > 1900 && a < 32000);
      return Response.json(
        {
          erro: `A FIPE não lista o ano-modelo ${anoModelo} no código ${codigo}${disponiveis.length ? ` (anos disponíveis: ${disponiveis.join(", ")})` : ""}.`,
        },
        { status: 404, headers: cabecalhos },
      );
    }
    const dados = (await buscarJson(`${API}/${codigo}/years/${ano.code}`)) as Record<string, unknown>;
    const valor = typeof dados.price === "string" ? lerPrecoFipe(dados.price) : null;
    if (valor === null) throw new FalhaFipe("A tabela FIPE não devolveu preço para esse ano-modelo.");
    const resultado: ValorFipe = {
      valor,
      anoModelo,
      mesReferencia: typeof dados.referenceMonth === "string" ? dados.referenceMonth : "",
      codigo,
      modelo: typeof dados.model === "string" ? dados.model : null,
    };
    return Response.json({ ...resultado, origem: "api" }, { headers: cabecalhos });
  } catch (e) {
    const motivo = e instanceof FalhaFipe ? e.message : "Não foi possível consultar a tabela FIPE agora.";
    const reserva = salvo(carroId, anoModelo, codigo);
    if (reserva) return Response.json({ ...reserva, origem: "salvo", aviso: motivo });
    return Response.json({ erro: motivo }, { status: 502 });
  }
}
