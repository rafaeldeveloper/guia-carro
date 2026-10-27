import { dadosFicha, codigoFipe } from "@/data/fichaCarros";
import { precosMercado } from "@/data/precoMercado";
import { lerPrecoFipe } from "@/lib/ficha";

const API = "https://fipe.parallelum.com.br/api/v2/cars";
const UM_DIA_MS = 86_400_000;
const TEMPO_LIMITE_MS = 10_000;

type ValorFipe = { valor: number; anoModelo: number; mesReferencia: string; codigo: string; modelo: string | null };

export type RespostaFipe = (ValorFipe & { origem: "api" | "salvo"; aviso?: string }) | { erro: string };

class FalhaFipe extends Error {}

async function buscarJson(url: string): Promise<unknown> {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    const resposta = await fetch(url, { signal: controle.signal }).catch((e) => {
      throw new FalhaFipe(
        controle.signal.aborted ? "A tabela FIPE demorou demais para responder." : "Sem conexão com a tabela FIPE.",
        { cause: e },
      );
    });
    if (!resposta.ok && resposta.status !== 404) throw new FalhaFipe(`A tabela FIPE respondeu com erro ${resposta.status}.`);
    return await resposta.json();
  } finally {
    clearTimeout(relogio);
  }
}

function salvo(carroId: string, anoModelo: number, codigo: string): ValorFipe | null {
  const fipe = precosMercado[carroId]?.fipe;
  if (!fipe || fipe.anoModelo !== anoModelo || fipe.codigo !== codigo) return null;
  return { valor: fipe.valor, anoModelo, mesReferencia: fipe.mesReferencia, codigo, modelo: null };
}

function lerCache(chave: string): RespostaFipe | null {
  try {
    const item = JSON.parse(localStorage.getItem(chave) ?? "null") as { em: number; dados: RespostaFipe } | null;
    return item && Date.now() - item.em < UM_DIA_MS ? item.dados : null;
  } catch {
    return null;
  }
}

function gravarCache(chave: string, dados: RespostaFipe) {
  try {
    localStorage.setItem(chave, JSON.stringify({ em: Date.now(), dados }));
  } catch {}
}

export async function buscarFipe(carroId: string, anoModelo: number): Promise<RespostaFipe> {
  if (!dadosFicha[carroId] || !Number.isInteger(anoModelo) || anoModelo < 1990 || anoModelo > 2100)
    return { erro: "Carro ou ano-modelo inválido." };
  const codigo = codigoFipe(carroId, anoModelo);
  if (!codigo) return { erro: "Carro sem código FIPE mapeado." };

  const chave = `guia-carro:fipe:${codigo}:${anoModelo}`;
  const guardado = lerCache(chave);
  if (guardado) return guardado;

  try {
    const anos = await buscarJson(`${API}/${codigo}/years`);
    if (!Array.isArray(anos)) throw new FalhaFipe("Resposta inesperada da tabela FIPE.");
    const ano = anos.find((a): a is { code: string } => typeof a?.code === "string" && a.code.startsWith(`${anoModelo}-`));
    if (!ano) {
      const disponiveis = anos
        .map((a) => Number(String(a?.code).split("-")[0]))
        .filter((a) => a > 1900 && a < 32000);
      const resposta = {
        erro: `A FIPE não lista o ano-modelo ${anoModelo} no código ${codigo}${disponiveis.length ? ` (anos disponíveis: ${disponiveis.join(", ")})` : ""}.`,
      };
      gravarCache(chave, resposta);
      return resposta;
    }
    const dados = (await buscarJson(`${API}/${codigo}/years/${ano.code}`)) as Record<string, unknown>;
    const valor = typeof dados.price === "string" ? lerPrecoFipe(dados.price) : null;
    if (valor === null) throw new FalhaFipe("A tabela FIPE não devolveu preço para esse ano-modelo.");
    const resultado: RespostaFipe = {
      valor,
      anoModelo,
      mesReferencia: typeof dados.referenceMonth === "string" ? dados.referenceMonth : "",
      codigo,
      modelo: typeof dados.model === "string" ? dados.model : null,
      origem: "api",
    };
    gravarCache(chave, resultado);
    return resultado;
  } catch (e) {
    const motivo = e instanceof FalhaFipe ? e.message : "Não foi possível consultar a tabela FIPE agora.";
    const reserva = salvo(carroId, anoModelo, codigo);
    if (reserva) return { ...reserva, origem: "salvo", aviso: motivo };
    return { erro: motivo };
  }
}
