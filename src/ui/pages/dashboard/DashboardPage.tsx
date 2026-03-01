import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../supabase/client";
import { useSupabaseSession } from "../../../supabase/SupabaseProvider";
import { getBillingCycleDates } from "../../../utils/billingCycle";

type TipoMovimento = "entrada" | "saida" | "investimento";

type MetodoPagamento = "Dinheiro" | "Valor em conta" | "Cartão de Crédito";

type CategoriaSaida = "Moradia" | "Alimentação" | "Transporte" | "Lazer";
type CategoriaEntrada = "Salário" | "Renda extra";

type CreditCard = {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  limit_amount: number;
  due_day: number;
  closing_day: number;
};

type Transacao = {
  id: string;
  nome: string;
  data: string;
  tipo: TipoMovimento;
  categoriaPai: CategoriaSaida | CategoriaEntrada;
  subcategoria?: string;
  valor: number;
  payment_method?: MetodoPagamento | null;
  credit_card_id?: string | null;
};

const SUBCATEGORIAS_SAIDA: Record<CategoriaSaida, string[]> = {
  Moradia: ["Aluguel/Condomínio", "Contas fixas"],
  Alimentação: ["Mercado", "Proteína", "Delivery", "Restaurante"],
  Transporte: ["Uber", "Transporte público"],
  Lazer: ["Assinaturas", "Ocasiões especiais"],
};

const CATEGORIAS_ENTRADA: CategoriaEntrada[] = ["Salário", "Renda extra"];

type TransactionsRow = {
  id: string;
  user_id: string;
  name?: string;
  nome?: string;
  date?: string;
  data?: string;
  type?: string;
  tipo?: string;
  category?: string;
  parent_category?: string;
  categoria_pai?: string;
  subcategory?: string | null;
  subcategoria?: string | null;
  amount?: number;
  valor?: number;
  payment_method?: string | null;
  credit_card_id?: string | null;
};

type FiltroTipo = "todos" | "entrada" | "saida" | "investimento";

export function DashboardPage() {
  const { session } = useSupabaseSession();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [filtroCategoriaSaida, setFiltroCategoriaSaida] = useState<CategoriaSaida | "">("");
  const [filtroSubcategoria, setFiltroSubcategoria] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  const [modalAberto, setModalAberto] = useState(false);
  const [modalTransacao, setModalTransacao] = useState<Transacao | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [novoModalAberto, setNovoModalAberto] = useState(false);
  const [novoForm, setNovoForm] = useState<
    Omit<Transacao, "id"> & { payment_method: MetodoPagamento }
  >({
    nome: "",
    data: new Date().toISOString().slice(0, 10),
    tipo: "saida",
    categoriaPai: "Alimentação",
    subcategoria: "",
    valor: 0,
    payment_method: "Dinheiro",
    credit_card_id: null,
  });

  const [cartoesCredito, setCartoesCredito] = useState<CreditCard[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  useEffect(() => {
    async function carregarTransacoes() {
      if (!session) return;
      setCarregando(true);
      setErroCarregamento(null);

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("date", { ascending: false });

      if (error) {
        setErroCarregamento("Não foi possível carregar suas transações.");
        setCarregando(false);
        return;
      }

      const mapped =
        data?.map((row: TransactionsRow) => mapRowToTransacao(row)).filter(Boolean) ?? [];

      setTransacoes(mapped);
      setCarregando(false);
    }

    void carregarTransacoes();
  }, [session]);

  useEffect(() => {
    async function carregarCartoes() {
      if (!session) return;
      const { data } = await supabase
        .from("credit_cards")
        .select("*")
        .eq("user_id", session.user.id)
        .order("name", { ascending: true });
      setCartoesCredito((data ?? []) as CreditCard[]);
    }

    void carregarCartoes();
  }, [session]);

  const valores = useMemo(() => {
    const entrada = transacoes
      .filter((t) => t.tipo === "entrada")
      .reduce((acc, t) => acc + t.valor, 0);
    const saida = transacoes
      .filter((t) => t.tipo === "saida")
      .reduce((acc, t) => acc + t.valor, 0);
    const investido = transacoes
      .filter((t) => t.tipo === "investimento")
      .reduce((acc, t) => acc + t.valor, 0);
    const sobra = entrada - saida - investido;

    return { entrada, saida, investido, sobra };
  }, [transacoes]);

  const transacoesFiltradas = useMemo(() => {
    return transacoes
      .filter((t) => {
        if (filtroTipo !== "todos" && t.tipo !== filtroTipo) return false;
        if (dataInicio && t.data < dataInicio) return false;
        if (dataFim && t.data > dataFim) return false;

        if (filtroTipo === "saida") {
          if (filtroCategoriaSaida && t.categoriaPai !== filtroCategoriaSaida) return false;
          if (filtroSubcategoria && t.subcategoria !== filtroSubcategoria) return false;
        }

        return true;
      })
      .sort((a, b) => (a.data < b.data ? 1 : -1));
  }, [transacoes, filtroTipo, dataInicio, dataFim, filtroCategoriaSaida, filtroSubcategoria]);

  function abrirModalDetalhe(transacao: Transacao) {
    setModalTransacao(transacao);
    setModalAberto(true);
  }

  function fecharModalDetalhe() {
    setModalAberto(false);
    setModalTransacao(null);
  }

  function handleUpdateTransacao(
    campo: keyof Transacao,
    valor: string | number | TipoMovimento | MetodoPagamento | null,
  ) {
    if (!modalTransacao) return;
    let atualizado: Transacao = { ...modalTransacao, [campo]: valor };

    if (campo === "tipo" && valor !== "saida") {
      atualizado = { ...atualizado, subcategoria: undefined };
    }
    if (campo === "payment_method" && valor !== "Cartão de Crédito") {
      atualizado = { ...atualizado, credit_card_id: null };
    }

    setModalTransacao(atualizado);
    setTransacoes((atual) => atual.map((t) => (t.id === atualizado.id ? atualizado : t)));

    void supabase
      .from("transactions")
      .update({
        name: atualizado.nome,
        date: atualizado.data,
        type: atualizado.tipo,
        category: atualizado.categoriaPai,
        subcategory: atualizado.tipo === "saida" ? atualizado.subcategoria ?? null : null,
        amount: atualizado.valor,
        payment_method: atualizado.payment_method ?? null,
        credit_card_id:
          atualizado.payment_method === "Cartão de Crédito" ? atualizado.credit_card_id : null,
      })
      .eq("id", atualizado.id)
      .then(({ error }) => {
        if (error) {
          setToast("Erro ao salvar alterações da transação.");
          setTimeout(() => setToast(null), 3500);
        }
      });
  }

  function handleConfirmDelete(id: string) {
    setConfirmDeleteId(id);
  }

  function cancelarDelete() {
    setConfirmDeleteId(null);
  }

  function confirmarDelete() {
    if (!confirmDeleteId) return;
    void supabase
      .from("transactions")
      .delete()
      .eq("id", confirmDeleteId)
      .then(({ error }) => {
        if (error) {
          setToast("Erro ao deletar transação.");
          setTimeout(() => setToast(null), 3500);
          return;
        }

        setTransacoes((atual) => atual.filter((t) => t.id !== confirmDeleteId));
        setConfirmDeleteId(null);
        setModalAberto(false);
        setToast("Transação deletada com sucesso.");
        setTimeout(() => setToast(null), 3500);
      });
  }

  function getUsoFaturaCartao(creditCardId: string, closingDay: number): number {
    const { start, end } = getBillingCycleDates(closingDay);
    return transacoes
      .filter(
        (t) =>
          t.credit_card_id === creditCardId &&
          t.tipo === "saida" &&
          t.data >= start &&
          t.data <= end,
      )
      .reduce((acc, t) => acc + Math.abs(t.valor), 0);
  }

  function getDisponivelCartao(card: CreditCard): number {
    const uso = getUsoFaturaCartao(card.id, card.closing_day);
    return Math.max(0, Number(card.limit_amount) - uso);
  }

  const cartaoSelecionado = useMemo(() => {
    if (!novoForm.credit_card_id) return null;
    return cartoesCredito.find((c) => c.id === novoForm.credit_card_id) ?? null;
  }, [novoForm.credit_card_id, cartoesCredito]);

  const limiteExcedido =
    novoForm.payment_method === "Cartão de Crédito" &&
    cartaoSelecionado !== null &&
    novoForm.valor > 0 &&
    novoForm.valor + getUsoFaturaCartao(cartaoSelecionado.id, cartaoSelecionado.closing_day) >
      Number(cartaoSelecionado.limit_amount);

  function abrirNovoModal() {
    setNovoForm((f) => ({
      ...f,
      payment_method: "Dinheiro",
      credit_card_id: null,
    }));
    setNovoModalAberto(true);
  }

  function fecharNovoModal() {
    setNovoModalAberto(false);
  }

  function salvarNovaTransacao() {
    if (!session || limiteExcedido) return;

    void supabase
      .from("transactions")
      .insert({
        user_id: session.user.id,
        name: novoForm.nome,
        date: novoForm.data,
        type: novoForm.tipo,
        category: novoForm.categoriaPai,
        subcategory: novoForm.tipo === "saida" ? novoForm.subcategoria ?? null : null,
        amount: novoForm.valor,
        payment_method: novoForm.payment_method,
        credit_card_id:
          novoForm.payment_method === "Cartão de Crédito" ? novoForm.credit_card_id : null,
      })
      .select("*")
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setToast("Erro ao cadastrar nova transação.");
          setTimeout(() => setToast(null), 3500);
          return;
        }

        const nova = mapRowToTransacao(data as TransactionsRow);
        setTransacoes((atual) => [nova, ...atual]);
        setNovoModalAberto(false);
        setToast("Nova transação cadastrada.");
        setTimeout(() => setToast(null), 3500);
      });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Dashboard</h1>
          <p className="text-xs text-sf-muted">
            Acompanhe os principais números do seu mês em tempo real.
          </p>
        </div>
        <button type="button" className="sf-button-primary" onClick={abrirNovoModal}>
          Novo cadastro
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Valor de entrada"
          valor={valores.entrada}
          cor="sf-success"
          descricao="Total de receitas no período"
        />
        <ResumoCard
          titulo="Valor de saída"
          valor={valores.saida}
          cor="sf-danger"
          descricao="Total de despesas no período"
        />
        <ResumoCard
          titulo="Valor investido"
          valor={valores.investido}
          cor="sf-invest"
          descricao="Total destinado a investimentos"
        />
        <ResumoCard
          titulo="Sobra (balanço)"
          valor={valores.sobra}
          cor="sf-muted"
          descricao="Entrada - saída - investimentos"
        />
      </section>

      <section className="sf-card">
        <div className="flex flex-col gap-4 border-b border-sf-border px-6 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Extrato geral</h2>
            <p className="text-xs text-sf-muted">
              Itens mais recentes aparecem primeiro. Clique para ver detalhes e editar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="space-y-1">
              <span className="sf-label">Intervalo de datas</span>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="sf-input max-w-[140px]"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
                <input
                  type="date"
                  className="sf-input max-w-[140px]"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="sf-label">Tipo</span>
              <select
                className="sf-input max-w-[150px]"
                value={filtroTipo}
                onChange={(e) => {
                  const v = e.target.value as FiltroTipo;
                  setFiltroTipo(v);
                  if (v !== "saida") {
                    setFiltroCategoriaSaida("");
                    setFiltroSubcategoria("");
                  }
                }}
              >
                <option value="todos">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="saida">Saídas</option>
                <option value="investimento">Investimentos</option>
              </select>
            </div>

            {filtroTipo === "saida" ? (
              <>
                <div className="space-y-1">
                  <span className="sf-label">Categoria</span>
                  <select
                    className="sf-input max-w-[150px]"
                    value={filtroCategoriaSaida}
                    onChange={(e) => {
                      const v = e.target.value as CategoriaSaida | "";
                      setFiltroCategoriaSaida(v);
                      setFiltroSubcategoria("");
                    }}
                  >
                    <option value="">Todas</option>
                    {Object.keys(SUBCATEGORIAS_SAIDA).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {filtroCategoriaSaida ? (
                  <div className="space-y-1">
                    <span className="sf-label">Subcategoria</span>
                    <select
                      className="sf-input max-w-[150px]"
                      value={filtroSubcategoria}
                      onChange={(e) => setFiltroSubcategoria(e.target.value)}
                    >
                      <option value="">Todas</option>
                      {SUBCATEGORIAS_SAIDA[filtroCategoriaSaida].map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          {carregando ? (
            <div className="px-4 py-6 text-center text-[12px] text-sf-muted">
              Carregando transações...
            </div>
          ) : erroCarregamento ? (
            <div className="px-4 py-6 text-center text-[12px] text-sf-danger">
              {erroCarregamento}
            </div>
          ) : (
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-sf-border/80 bg-sf-surface-elevated/60 uppercase tracking-[0.12em] text-sf-muted">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Subcategoria</th>
                  <th className="px-4 py-3 text-right">Valor (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border/60">
                {transacoesFiltradas.map((t) => (
                  <tr
                    key={t.id}
                    className="cursor-pointer bg-sf-surface-elevated/40 hover:bg-sf-primary-900/20"
                    onClick={() => abrirModalDetalhe(t)}
                  >
                    <td className="px-4 py-3 text-[13px] text-white">{t.nome}</td>
                    <td className="px-4 py-3">
                      <TipoBadge tipo={t.tipo} />
                    </td>
                    <td className="px-4 py-3 text-[12px] text-sf-muted">{t.categoriaPai}</td>
                    <td className="px-4 py-3 text-[12px] text-sf-muted">
                      {t.tipo === "entrada" ? "—" : t.subcategoria ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-medium text-sf-text">
                      {t.valor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                  </tr>
                ))}
                {transacoesFiltradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-[12px] text-sf-muted/80"
                    >
                      Nenhuma transação encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {modalAberto && modalTransacao ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
          <div className="sf-card w-full max-w-lg px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Detalhes da transação</h3>
                <p className="text-[11px] text-sf-muted">
                  Edite qualquer campo ou delete a transação.
                </p>
              </div>
              <button
                type="button"
                onClick={fecharModalDetalhe}
                className="sf-button-ghost px-2 py-1 text-xs"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="sf-label">Nome da transação</label>
                <input
                  className="sf-input"
                  value={modalTransacao.nome}
                  onChange={(e) => handleUpdateTransacao("nome", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="sf-label">Tipo</label>
                <select
                  className="sf-input"
                  value={modalTransacao.tipo}
                  onChange={(e) =>
                    handleUpdateTransacao("tipo", e.target.value as TipoMovimento)
                  }
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                  <option value="investimento">Investimento</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="sf-label">Valor</label>
                <input
                  type="number"
                  className="sf-input"
                  value={modalTransacao.valor}
                  onChange={(e) =>
                    handleUpdateTransacao("valor", Number(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="sf-label">Categoria</label>
                <select
                  className="sf-input"
                  value={modalTransacao.categoriaPai}
                  onChange={(e) =>
                    handleUpdateTransacao(
                      "categoriaPai",
                      e.target.value as CategoriaSaida | CategoriaEntrada,
                    )
                  }
                >
                  {modalTransacao.tipo === "entrada"
                    ? CATEGORIAS_ENTRADA.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))
                    : (Object.keys(SUBCATEGORIAS_SAIDA) as CategoriaSaida[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                </select>
              </div>

              {modalTransacao.tipo === "saida" ? (
                <div className="space-y-1.5">
                  <label className="sf-label">Subcategoria</label>
                  <select
                    className="sf-input"
                    value={modalTransacao.subcategoria ?? ""}
                    onChange={(e) => handleUpdateTransacao("subcategoria", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {SUBCATEGORIAS_SAIDA[modalTransacao.categoriaPai as CategoriaSaida]?.map(
                      (sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              ) : null}

              <div className="space-y-1.5 sm:col-span-2">
                <label className="sf-label">Método de Pagamento</label>
                <select
                  className="sf-input"
                  value={modalTransacao.payment_method ?? "Dinheiro"}
                  onChange={(e) => {
                    const v = e.target.value as MetodoPagamento;
                    handleUpdateTransacao("payment_method", v);
                  }}
                >
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Valor em conta">Valor em conta</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                </select>
              </div>

              {modalTransacao.payment_method === "Cartão de Crédito" ? (
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="sf-label">Cartão de Crédito</label>
                  <select
                    className="sf-input"
                    value={modalTransacao.credit_card_id ?? ""}
                    onChange={(e) =>
                      handleUpdateTransacao(
                        "credit_card_id",
                        e.target.value || null,
                      )
                    }
                  >
                    <option value="">Selecione o cartão</option>
                    {cartoesCredito.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.bank}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                className="rounded-lg bg-sf-danger/10 px-3 py-2 text-xs font-medium text-sf-danger hover:bg-sf-danger/20"
                onClick={() => handleConfirmDelete(modalTransacao.id)}
              >
                Deletar
              </button>
              <p className="text-[11px] text-sf-muted">
                Alterações são salvas automaticamente enquanto você edita.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {novoModalAberto ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
          <div className="sf-card w-full max-w-lg px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Nova transação</h3>
              <button
                type="button"
                onClick={fecharNovoModal}
                className="sf-button-ghost px-2 py-1 text-xs"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="sf-label">Nome da transação</label>
                <input
                  className="sf-input"
                  value={novoForm.nome}
                  onChange={(e) => setNovoForm((f) => ({ ...f, nome: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="sf-label">Data</label>
                <input
                  type="date"
                  className="sf-input"
                  value={novoForm.data}
                  onChange={(e) => setNovoForm((f) => ({ ...f, data: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="sf-label">Tipo</label>
                <select
                  className="sf-input"
                  value={novoForm.tipo}
                  onChange={(e) => {
                    const tipo = e.target.value as TipoMovimento;
                    setNovoForm((f) => ({
                      ...f,
                      tipo,
                      subcategoria: tipo === "saida" ? f.subcategoria : undefined,
                    }));
                  }}
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                  <option value="investimento">Investimento</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="sf-label">Método de Pagamento</label>
                <select
                  className="sf-input"
                  value={novoForm.payment_method}
                  onChange={(e) => {
                    const v = e.target.value as MetodoPagamento;
                    setNovoForm((f) => ({
                      ...f,
                      payment_method: v,
                      credit_card_id: v === "Cartão de Crédito" ? f.credit_card_id : null,
                    }));
                  }}
                >
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Valor em conta">Valor em conta</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                </select>
              </div>

              {novoForm.payment_method === "Cartão de Crédito" ? (
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="sf-label">Cartão de Crédito</label>
                  <select
                    className="sf-input"
                    value={novoForm.credit_card_id ?? ""}
                    onChange={(e) =>
                      setNovoForm((f) => ({
                        ...f,
                        credit_card_id: e.target.value || null,
                      }))
                    }
                  >
                    <option value="">Selecione o cartão</option>
                    {cartoesCredito.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.bank}
                      </option>
                    ))}
                  </select>
                  {cartaoSelecionado ? (
                    limiteExcedido ? (
                      <p className="mt-1 text-xs text-sf-danger">
                        Limite insuficiente. Por favor, selecione outro cartão ou método
                        de pagamento.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-sf-muted">
                        Você possui R${" "}
                        {getDisponivelCartao(cartaoSelecionado).toLocaleString("pt-BR")}{" "}
                        disponíveis
                      </p>
                    )
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label className="sf-label">Valor</label>
                <input
                  type="number"
                  className="sf-input"
                  value={novoForm.valor}
                  onChange={(e) =>
                    setNovoForm((f) => ({ ...f, valor: Number(e.target.value) || 0 }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="sf-label">Categoria</label>
                <select
                  className="sf-input"
                  value={novoForm.categoriaPai}
                  onChange={(e) =>
                    setNovoForm((f) => ({
                      ...f,
                      categoriaPai: e.target.value as CategoriaSaida | CategoriaEntrada,
                      subcategoria: undefined,
                    }))
                  }
                >
                  {novoForm.tipo === "entrada"
                    ? CATEGORIAS_ENTRADA.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))
                    : (Object.keys(SUBCATEGORIAS_SAIDA) as CategoriaSaida[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                </select>
              </div>

              {novoForm.tipo === "saida" ? (
                <div className="space-y-1.5">
                  <label className="sf-label">Subcategoria</label>
                  <select
                    className="sf-input"
                    value={novoForm.subcategoria ?? ""}
                    onChange={(e) =>
                      setNovoForm((f) => ({
                        ...f,
                        subcategoria: e.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione</option>
                    {SUBCATEGORIAS_SAIDA[novoForm.categoriaPai as CategoriaSaida]?.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="sf-button-ghost text-xs" onClick={fecharNovoModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="sf-button-primary text-xs disabled:cursor-not-allowed disabled:opacity-60"
                disabled={limiteExcedido}
                onClick={salvarNovaTransacao}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDeleteId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="sf-card max-w-sm px-6 py-5">
            <h3 className="text-sm font-semibold text-white">Deletar transação</h3>
            <p className="mt-2 text-xs text-sf-muted">
              Essa ação não pode ser desfeita. Tem certeza que deseja excluir esta transação?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="sf-button-ghost text-xs"
                onClick={cancelarDelete}
              >
                Não
              </button>
              <button
                type="button"
                className="rounded-lg bg-sf-danger px-3 py-1.5 text-xs font-medium text-white hover:bg-sf-danger/90"
                onClick={confirmarDelete}
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="sf-card border-sf-success/40 bg-sf-surface-elevated/95 px-4 py-3 text-xs text-sf-success">
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function mapRowToTransacao(row: TransactionsRow): Transacao {
  const tipoRaw = (row.type ?? row.tipo ?? "saida") as TipoMovimento;
  const categoria =
    (row.category ?? row.parent_category ?? row.categoria_pai ?? "Alimentação") as
      | CategoriaSaida
      | CategoriaEntrada;
  const paymentMethod = (row.payment_method ?? null) as MetodoPagamento | null;

  return {
    id: row.id,
    nome: (row.name ?? row.nome ?? "Sem nome") as string,
    data: (row.date ?? row.data ?? new Date().toISOString().slice(0, 10)) as string,
    tipo: tipoRaw,
    categoriaPai: categoria,
    subcategoria: (row.subcategory ?? row.subcategoria ?? undefined) ?? undefined,
    valor: (row.amount ?? row.valor ?? 0) as number,
    payment_method: paymentMethod ?? undefined,
    credit_card_id: row.credit_card_id ?? null,
  };
}

function ResumoCard({
  titulo,
  valor,
  cor,
  descricao,
}: {
  titulo: string;
  valor: number;
  cor: "sf-success" | "sf-danger" | "sf-invest" | "sf-muted";
  descricao: string;
}) {
  const corClasses: Record<typeof cor, string> = {
    "sf-success": "text-sf-success bg-sf-success/10",
    "sf-danger": "text-sf-danger bg-sf-danger/10",
    "sf-invest": "text-sf-invest bg-sf-invest/10",
    "sf-muted": "text-sf-muted bg-sf-muted/10",
  } as const;

  return (
    <div className="sf-card flex flex-col gap-3 px-4 py-4">
      <p className="text-xs font-medium text-sf-muted uppercase tracking-[0.15em]">
        {titulo}
      </p>
      <p className={`inline-flex items-baseline gap-1 text-lg font-semibold ${corClasses[cor]}`}>
        <span>
          {valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      </p>
      <p className="text-[11px] text-sf-muted">{descricao}</p>
    </div>
  );
}

function TipoBadge({ tipo }: { tipo: TipoMovimento }) {
  if (tipo === "entrada") {
    return (
      <span className="sf-badge bg-sf-success/10 text-sf-success">
        <span>↑</span>
        Entrada
      </span>
    );
  }
  if (tipo === "saida") {
    return (
      <span className="sf-badge bg-sf-danger/10 text-sf-danger">
        <span>↓</span>
        Saída
      </span>
    );
  }
  return (
    <span className="sf-badge bg-sf-invest/10 text-sf-invest">
      <span>🎯</span>
      Investimento
    </span>
  );
}
