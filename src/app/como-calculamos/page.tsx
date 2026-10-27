import { IconeRisco, ReguaRisco } from "@/components/NotaRiscoSelo";
import { Topo } from "@/components/Topo";

export const metadata = { title: "Como calculamos · Guia do Carro" };

const faixas = [
  { nivel: 1, rotulo: "Risco baixo", de: "abaixo de 4" },
  { nivel: 2, rotulo: "Risco médio", de: "de 4 a menos de 5,5" },
  { nivel: 3, rotulo: "Risco médio-alto", de: "de 5,5 a menos de 7" },
  { nivel: 4, rotulo: "Risco alto", de: "7 ou mais" },
] as const;

const corTexto = { 1: "text-nivel-1", 2: "text-nivel-2", 3: "text-nivel-3", 4: "text-nivel-4" };

export default function ComoCalculamos() {
  return (
    <main className="conteudo grid gap-6 py-6 md:py-8">
      <Topo titulo="Como calculamos a nota de risco">
        A nota mede a chance de o carro dar defeito caro. Vai de 2 a 10,5 e <strong className="text-ink">menor é melhor</strong>.
      </Topo>
      <div className="grid max-w-2xl gap-6">
        <ReguaRisco nota={5.5} />
        <ul className="grid gap-2 text-sm">
          {faixas.map((f) => (
            <li key={f.nivel} className={`flex items-center gap-2 ${corTexto[f.nivel]}`}>
              <IconeRisco nivel={f.nivel} />
              <span className="font-medium">{f.rotulo}</span>
              <span className="text-muted">{f.de}</span>
            </li>
          ))}
        </ul>

        <section className="grid gap-2">
          <h2 className="text-xl font-bold tracking-tight">1. Motor, câmbio e parte elétrica</h2>
          <p>Para cada sistema damos dois pontos de 1 a 5 e tiramos a média:</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>
              <strong>Frequência</strong>: reclamações por 1.000 carros vendidos. Menos de 0,5 vale 1; menos de 1, 2; menos de
              2, 3; menos de 3,5, 4; daí para cima, 5.
            </li>
            <li>
              <strong>Gravidade</strong>: custo típico do conserto. Menos de R$ 5 mil vale 1; menos de R$ 10 mil, 2;
              menos de R$ 20 mil, 3; menos de R$ 30 mil, 4; daí para cima, 5. Se o defeito deixa o carro parado, soma 1 (até 5).
            </li>
          </ul>
        </section>

        <section className="grid gap-2">
          <h2 className="text-xl font-bold tracking-tight">2. Pós-venda</h2>
          <p className="text-sm">
            Garantia de 5 anos ou mais vale 1 ponto; de 3 a 4 anos, 3; menos, 4. Se a marca tem nota abaixo de 7,5 no
            Reclame Aqui, soma 1.
          </p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-xl font-bold tracking-tight">3. Incerteza</h2>
          <p className="text-sm">
            Com menos de 12 meses de vendas, somamos 0,5 à nota. Modelos novos usam as reclamações de carros com o mesmo
            motor e câmbio; a página do carro diz quais. Nesses casos a régua mostra uma faixa hachurada em vez de um ponto
            cheio.
          </p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-xl font-bold tracking-tight">4. Nota final</h2>
          <p className="rounded-xl bg-surface-2 p-4 text-sm">
            (motor + câmbio + elétrica + pós-venda) ÷ 2 + incerteza
          </p>
          <p className="text-sm text-muted">
            Mostramos uma casa decimal: com poucos meses de dados, a segunda casa seria precisão falsa. A conta completa de
            cada carro fica em &quot;Ver a conta completa&quot;, na página dele.
          </p>
        </section>
      </div>
    </main>
  );
}
