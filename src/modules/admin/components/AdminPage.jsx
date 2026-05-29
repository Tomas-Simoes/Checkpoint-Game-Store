import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../../api/adminApi.js";
import { useAuth } from "../../auth/index.js";
import { reportAppError } from "../../error/index.js";
import { formatPrice } from "../../../utils/formatters.js";

const emptyProductForm = {
  category: "Indie",
  price: "0",
  sku: "",
  status: "Ativo",
  stock: "0",
  title: ""
};

const saleStatuses = ["Pendente", "Pago", "Enviado", "Cancelado"];
const productStatuses = ["Ativo", "Sem stock", "Arquivado"];
const revenuePeriodLabels = {
  day: "Dia",
  month: "Mês",
  week: "Semana"
};
const billableSaleStatuses = new Set(["Pago", "Enviado"]);

function AdminGuard({ children }) {
  const { isAuthenticated, isChecking, user } = useAuth();

  if (isChecking) {
    return (
      <main className="admin-page">
        <div className="section-inner">
          <p className="catalog-status">A validar permissões...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="admin-page">
        <div className="section-inner admin-guard">
          <p className="eyebrow">Admin</p>
          <h1>Acesso reservado</h1>
          <a className="button button-primary" href="#/login?redirect=admin">
            Entrar
          </a>
        </div>
      </main>
    );
  }

  if (user?.role !== "admin") {
    return (
      <main className="admin-page">
        <div className="section-inner admin-guard">
          <p className="eyebrow">Admin</p>
          <h1>Sem permissões</h1>
          <a className="button button-secondary" href="#/catalogo">
            Voltar ao catálogo
          </a>
        </div>
      </main>
    );
  }

  return children;
}

function summarizeProducts(products, sales) {
  const stockUnits = products.reduce((total, product) => total + product.stock, 0);
  const lowStock = products.filter((product) => product.stock <= 5).length;
  const revenue = sales
    .filter((sale) => billableSaleStatuses.has(sale.status))
    .reduce((total, sale) => total + sale.total, 0);

  return {
    lowStock,
    products: products.length,
    revenue,
    stockUnits
  };
}

function validateProductForm(form) {
  const title = form.title.trim();
  const sku = form.sku.trim();
  const category = form.category.trim();
  const price = Number(form.price);
  const stock = Number(form.stock);

  if (title.length < 2 || title.length > 80) {
    return {
      error: "O nome do produto deve ter entre 2 e 80 caracteres."
    };
  }

  if (sku && !/^[a-z0-9-]{2,24}$/i.test(sku)) {
    return {
      error: "O SKU só pode ter letras, números e hifens."
    };
  }

  if (category.length < 2 || category.length > 40) {
    return {
      error: "A categoria deve ter entre 2 e 40 caracteres."
    };
  }

  if (!Number.isFinite(price) || price < 0 || price > 999.99) {
    return {
      error: "O preço deve ser um valor entre 0 e 999,99."
    };
  }

  if (!Number.isInteger(stock) || stock < 0 || stock > 9999) {
    return {
      error: "O stock deve ser um número inteiro entre 0 e 9999."
    };
  }

  if (!productStatuses.includes(form.status)) {
    return {
      error: "O estado do produto é inválido."
    };
  }

  return {
    payload: {
      category,
      price,
      sku,
      status: form.status,
      stock,
      title
    }
  };
}

function formatDateTime(date) {
  if (!date) {
    return "Sem registo";
  }

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(date));
}

function formatInvoiceDate(date) {
  if (!date) {
    return "Sem emissão";
  }

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

const emptyStats = {
  bestClients: [],
  leastSoldProducts: [],
  revenueByPeriod: [],
  topSoldProducts: []
};

export function AdminPage() {
  const { logout, user } = useAuth();
  const [activePanel, setActivePanel] = useState("products");
  const [editingProductId, setEditingProductId] = useState(null);
  const [form, setForm] = useState(emptyProductForm);
  const [formError, setFormError] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState([]);
  const [revenuePeriod, setRevenuePeriod] = useState("day");
  const [sales, setSales] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [status, setStatus] = useState("loading");
  const [stats, setStats] = useState(emptyStats);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      adminApi.getProducts({ signal: controller.signal }),
      adminApi.getSales({ signal: controller.signal }),
      adminApi.getInvoices({ signal: controller.signal }),
      adminApi.getStats(revenuePeriod, { signal: controller.signal }),
      adminApi.getUsers({ signal: controller.signal })
    ])
      .then(([productsResponse, salesResponse, invoicesResponse, statsResponse, usersResponse]) => {
        setProducts(productsResponse);
        setSales(salesResponse);
        setInvoices(invoicesResponse);
        setStats(statsResponse);
        setUsers(usersResponse);
        setStatus("success");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setStatus("error");
          reportAppError(error, {
            actionHref: "#/admin",
            actionLabel: "Voltar ao admin",
            message: "Não foi possível carregar os dados de administração.",
            title: "Falha no backoffice"
          });
        }
      });

    return () => controller.abort();
  }, [revenuePeriod]);

  const summary = useMemo(
    () => summarizeProducts(products, sales),
    [products, sales]
  );
  const invoicesBySaleId = useMemo(
    () => new Map(invoices.map((invoice) => [invoice.saleId, invoice])),
    [invoices]
  );
  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedInvoiceId),
    [invoices, selectedInvoiceId]
  );

  function updateForm(field, value) {
    setFormError("");
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function resetForm() {
    setEditingProductId(null);
    setForm(emptyProductForm);
  }

  function editProduct(product) {
    setEditingProductId(product.id);
    setForm({
      category: product.category,
      price: String(product.price),
      sku: product.sku,
      status: product.status,
      stock: String(product.stock),
      title: product.title
    });
    setActivePanel("products");
  }

  async function refreshStats() {
    const statsResponse = await adminApi.getStats(revenuePeriod);
    setStats(statsResponse);
  }

  async function submitProduct(event) {
    event.preventDefault();
    setFormError("");
    setMessage("");

    const validation = validateProductForm(form);

    if (validation.error) {
      setFormError(validation.error);
      return;
    }

    try {
      if (editingProductId) {
        const updatedProduct = await adminApi.updateProduct(
          editingProductId,
          validation.payload
        );

        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === updatedProduct.id ? updatedProduct : product
          )
        );
        setMessage("Produto atualizado.");
      } else {
        const createdProduct = await adminApi.createProduct(validation.payload);

        setProducts((currentProducts) => [createdProduct, ...currentProducts]);
        setMessage("Produto criado.");
      }

      await refreshStats();
      resetForm();
    } catch (error) {
      reportAppError(error, {
        actionHref: "#/admin",
        actionLabel: "Voltar ao admin",
        message: "Não foi possível guardar o produto.",
        title: "Falha no produto"
      });
    }
  }

  async function removeProduct(productId) {
    if (!window.confirm("Queres mesmo remover este produto?")) {
      return;
    }

    try {
      await adminApi.deleteProduct(productId);
      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== productId)
      );
      await refreshStats();
      setMessage("Produto removido.");
    } catch (error) {
      reportAppError(error, {
        actionHref: "#/admin",
        actionLabel: "Voltar ao admin",
        message: "Não foi possível remover o produto.",
        title: "Falha no produto"
      });
    }
  }

  async function updateStock(productId, stock) {
    try {
      const updatedProduct = await adminApi.updateProductStock(productId, stock);

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === productId ? updatedProduct : product
        )
      );
    } catch (error) {
      reportAppError(error, {
        actionHref: "#/admin",
        actionLabel: "Voltar ao admin",
        message: "Não foi possível atualizar o stock.",
        title: "Falha no stock"
      });
    }
  }

  async function updateSaleStatus(saleId, nextStatus) {
    try {
      const updatedSale = await adminApi.updateSaleStatus(saleId, nextStatus);
      const invoicesResponse = await adminApi.getInvoices();

      setSales((currentSales) =>
        currentSales.map((sale) => (sale.id === saleId ? updatedSale : sale))
      );
      setInvoices(invoicesResponse);
      await refreshStats();
    } catch (error) {
      reportAppError(error, {
        actionHref: "#/admin",
        actionLabel: "Voltar ao admin",
        message: "Não foi possível atualizar a venda.",
        title: "Falha nas vendas"
      });
    }
  }

  async function refreshUsers() {
    const usersResponse = await adminApi.getUsers();

    setUsers(usersResponse);
  }

  async function deleteUser(userId) {
    if (!window.confirm("Queres mesmo apagar este utilizador?")) {
      return;
    }

    try {
      await adminApi.deleteUser(userId);
      await refreshUsers();
      setMessage("Utilizador removido.");
    } catch (error) {
      reportAppError(error, {
        actionHref: "#/admin",
        actionLabel: "Voltar ao admin",
        message: "Não foi possível remover o utilizador.",
        title: "Falha nos utilizadores"
      });
    }
  }

  async function revokeUserSessions(userId) {
    if (!window.confirm("Queres terminar todas as sessões deste utilizador?")) {
      return;
    }

    try {
      await adminApi.revokeUserSessions(userId);
      await refreshUsers();
      setMessage("Sessões terminadas.");

      if (userId === user?.id) {
        await logout();
      }
    } catch (error) {
      reportAppError(error, {
        actionHref: "#/admin",
        actionLabel: "Voltar ao admin",
        message: "Não foi possível terminar as sessões do utilizador.",
        title: "Falha nas sessões"
      });
    }
  }

  async function revokeSession(session) {
    if (!window.confirm("Queres terminar esta sessão?")) {
      return;
    }

    try {
      await adminApi.revokeSession(session.id);
      await refreshUsers();
      setMessage("Sessão terminada.");

      if (session.userId === user?.id) {
        await logout();
      }
    } catch (error) {
      reportAppError(error, {
        actionHref: "#/admin",
        actionLabel: "Voltar ao admin",
        message: "Não foi possível terminar a sessão.",
        title: "Falha nas sessões"
      });
    }
  }

  return (
    <AdminGuard>
      <main className="admin-page">
        <section className="section-inner admin-layout">
          <div className="admin-heading">
            <div>
              <p className="eyebrow">Backoffice</p>
              <h1>Admin</h1>
            </div>
            <a className="button button-secondary" href="#/catalogo">
              Loja
            </a>
          </div>

          {status === "loading" && (
            <p className="catalog-status">A carregar backoffice...</p>
          )}

          {status === "error" && (
            <p className="catalog-status">Não foi possível carregar o admin.</p>
          )}

          {status === "success" && (
            <>
              <div className="admin-summary">
                <div>
                  <span>Produtos</span>
                  <strong>{summary.products}</strong>
                </div>
                <div>
                  <span>Stock</span>
                  <strong>{summary.stockUnits}</strong>
                </div>
                <div>
                  <span>Baixo stock</span>
                  <strong>{summary.lowStock}</strong>
                </div>
                <div>
                  <span>Vendas</span>
                  <strong>{formatPrice(summary.revenue)}</strong>
                </div>
              </div>

              <div className="admin-tabs" aria-label="Secções de admin">
                <button
                  className={activePanel === "products" ? "is-active" : undefined}
                  onClick={() => setActivePanel("products")}
                  type="button"
                >
                  Produtos
                </button>
                <button
                  className={activePanel === "sales" ? "is-active" : undefined}
                  onClick={() => setActivePanel("sales")}
                  type="button"
                >
                  Vendas
                </button>
                <button
                  className={activePanel === "stock" ? "is-active" : undefined}
                  onClick={() => setActivePanel("stock")}
                  type="button"
                >
                  Stock
                </button>
                <button
                  className={activePanel === "users" ? "is-active" : undefined}
                  onClick={() => setActivePanel("users")}
                  type="button"
                >
                  Utilizadores
                </button>
                <button
                  className={activePanel === "stats" ? "is-active" : undefined}
                  onClick={() => setActivePanel("stats")}
                  type="button"
                >
                  Estatísticas
                </button>
              </div>

              {message && <p className="admin-message">{message}</p>}

              {activePanel === "products" && (
                <section className="admin-panel">
                  <form className="admin-form" onSubmit={submitProduct}>
                    <label>
                      Nome
                      <input
                        onChange={(event) => updateForm("title", event.target.value)}
                        required
                        type="text"
                        value={form.title}
                      />
                    </label>
                    <label>
                      SKU
                      <input
                        onChange={(event) => updateForm("sku", event.target.value)}
                        type="text"
                        value={form.sku}
                      />
                    </label>
                    <label>
                      Categoria
                      <input
                        onChange={(event) =>
                          updateForm("category", event.target.value)
                        }
                        required
                        type="text"
                        value={form.category}
                      />
                    </label>
                    <label>
                      Preço
                      <input
                        min="0"
                        onChange={(event) => updateForm("price", event.target.value)}
                        required
                        step="0.01"
                        type="number"
                        value={form.price}
                      />
                    </label>
                    <label>
                      Stock
                      <input
                        min="0"
                        onChange={(event) => updateForm("stock", event.target.value)}
                        required
                        type="number"
                        value={form.stock}
                      />
                    </label>
                    <label>
                      Estado
                      <select
                        onChange={(event) => updateForm("status", event.target.value)}
                        value={form.status}
                      >
                        {productStatuses.map((productStatus) => (
                          <option key={productStatus}>{productStatus}</option>
                        ))}
                      </select>
                    </label>
                    {formError && (
                      <p className="admin-form-error" role="alert">
                        {formError}
                      </p>
                    )}
                    <div className="admin-form-actions">
                      <button type="submit">
                        {editingProductId ? "Guardar" : "Criar"}
                      </button>
                      {editingProductId && (
                        <button onClick={resetForm} type="button">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th>SKU</th>
                          <th>Categoria</th>
                          <th>Preço</th>
                          <th>Stock</th>
                          <th>Estado</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td>{product.title}</td>
                            <td>{product.sku}</td>
                            <td>{product.category}</td>
                            <td>{formatPrice(product.price)}</td>
                            <td>{product.stock}</td>
                            <td>{product.status}</td>
                            <td>
                              <div className="admin-actions">
                                <button onClick={() => editProduct(product)} type="button">
                                  Editar
                                </button>
                                <button
                                  onClick={() => removeProduct(product.id)}
                                  type="button"
                                >
                                  Remover
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activePanel === "sales" && (
                <section className="admin-panel">
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Venda</th>
                          <th>Data</th>
                          <th>Cliente</th>
                          <th>Produto</th>
                          <th>Qtd</th>
                          <th>Total</th>
                          <th>Fatura</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((sale) => {
                          const invoice = invoicesBySaleId.get(sale.id);

                          return (
                            <tr key={sale.id}>
                              <td>{sale.id}</td>
                              <td>{sale.date}</td>
                              <td>{sale.customer}</td>
                              <td>{sale.productTitle}</td>
                              <td>{sale.quantity}</td>
                              <td>{formatPrice(sale.total)}</td>
                              <td>
                                <button
                                  className="admin-invoice-button"
                                  disabled={!invoice}
                                  onClick={() => setSelectedInvoiceId(invoice.id)}
                                  type="button"
                                >
                                  {invoice?.number ?? "Por emitir"}
                                </button>
                              </td>
                              <td>
                                <select
                                  onChange={(event) =>
                                    updateSaleStatus(sale.id, event.target.value)
                                  }
                                  value={sale.status}
                                >
                                  {saleStatuses.map((saleStatus) => (
                                    <option key={saleStatus}>{saleStatus}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {selectedInvoice && (
                    <article className="admin-invoice-preview">
                      <div className="admin-invoice-heading">
                        <div>
                          <span>Fatura emitida</span>
                          <strong>{selectedInvoice.number}</strong>
                        </div>
                        <div className="admin-actions">
                          <button onClick={() => window.print()} type="button">
                            Imprimir
                          </button>
                          <button
                            onClick={() => setSelectedInvoiceId(null)}
                            type="button"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>

                      <dl className="admin-invoice-meta">
                        <div>
                          <dt>Emitida em</dt>
                          <dd>{formatInvoiceDate(selectedInvoice.issuedAt)}</dd>
                        </div>
                        <div>
                          <dt>Cliente</dt>
                          <dd>{selectedInvoice.customer.name}</dd>
                        </div>
                        <div>
                          <dt>Pagamento</dt>
                          <dd>{selectedInvoice.paymentMethod}</dd>
                        </div>
                        <div>
                          <dt>Estado</dt>
                          <dd>{selectedInvoice.paymentStatus}</dd>
                        </div>
                      </dl>

                      <div className="admin-table-wrap">
                        <table className="admin-table stats-table">
                          <thead>
                            <tr>
                              <th>Descrição</th>
                              <th>Qtd</th>
                              <th>Unitário</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInvoice.items.map((item) => (
                              <tr key={item.productId}>
                                <td>{item.description}</td>
                                <td>{item.quantity}</td>
                                <td>{formatPrice(item.unitPrice)}</td>
                                <td>{formatPrice(item.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <p className="admin-invoice-total">
                        Total a pagar na entrega:{" "}
                        <strong>{formatPrice(selectedInvoice.total)}</strong>
                      </p>
                    </article>
                  )}
                </section>
              )}

              {activePanel === "stock" && (
                <section className="admin-panel stock-grid">
                  {products.map((product) => (
                    <article className="stock-row" key={product.id}>
                      <div>
                        <strong>{product.title}</strong>
                        <span>{product.sku}</span>
                      </div>
                      <input
                        min="0"
                        onChange={(event) =>
                          updateStock(product.id, Number(event.target.value))
                        }
                        type="number"
                        value={product.stock}
                      />
                      <span
                        className={
                          product.stock <= 5
                            ? "stock-badge stock-badge-low"
                            : "stock-badge"
                        }
                      >
                        {product.stock <= 5 ? "Baixo" : "OK"}
                      </span>
                    </article>
                  ))}
                </section>
              )}

              {activePanel === "users" && (
                <section className="admin-panel">
                  <div className="admin-table-wrap">
                    <table className="admin-table users-table">
                      <thead>
                        <tr>
                          <th>Utilizador</th>
                          <th>Role</th>
                          <th>Sessões ativas</th>
                          <th>Sessões</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((managedUser) => (
                          <tr key={managedUser.id}>
                            <td>
                              <strong>{managedUser.name}</strong>
                              <span className="admin-muted-cell">
                                {managedUser.email}
                              </span>
                            </td>
                            <td>{managedUser.role}</td>
                            <td>{managedUser.activeSessions}</td>
                            <td>
                              <div className="session-list">
                                {managedUser.sessions.length === 0 && (
                                  <span className="session-empty">
                                    Sem sessões
                                  </span>
                                )}
                                {managedUser.sessions.map((session) => (
                                  <div className="session-pill" key={session.id}>
                                    <div>
                                      <strong>
                                        {session.isActive ? "Ativa" : "Terminada"}
                                      </strong>
                                      <span>
                                        Última atividade:{" "}
                                        {formatDateTime(session.lastSeenAt)}
                                      </span>
                                    </div>
                                    {session.isActive && (
                                      <button
                                        onClick={() => revokeSession(session)}
                                        type="button"
                                      >
                                        Terminar
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td>
                              <div className="admin-actions">
                                <button
                                  disabled={managedUser.activeSessions === 0}
                                  onClick={() =>
                                    revokeUserSessions(managedUser.id)
                                  }
                                  type="button"
                                >
                                  Terminar sessões
                                </button>
                                <button
                                  disabled={
                                    !managedUser.canDelete ||
                                    managedUser.id === user?.id
                                  }
                                  onClick={() => deleteUser(managedUser.id)}
                                  type="button"
                                >
                                  Apagar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activePanel === "stats" && (
                <section className="admin-panel stats-panel">
                  <div className="stats-grid">
                    <article className="stats-card">
                      <div className="stats-card-heading">
                        <span>Mais vendidos</span>
                        <strong>Top produtos</strong>
                      </div>
                      <ol className="stats-list">
                        {stats.topSoldProducts.map((product) => (
                          <li key={product.id}>
                            <span>{product.title}</span>
                            <strong>{product.sold} vendas</strong>
                          </li>
                        ))}
                      </ol>
                    </article>

                    <article className="stats-card">
                      <div className="stats-card-heading">
                        <span>Menos vendidos</span>
                        <strong>Atenção comercial</strong>
                      </div>
                      <ol className="stats-list">
                        {stats.leastSoldProducts.map((product) => (
                          <li key={product.id}>
                            <span>{product.title}</span>
                            <strong>{product.sold} vendas</strong>
                          </li>
                        ))}
                      </ol>
                    </article>

                    <article className="stats-card">
                      <div className="stats-card-heading">
                        <span>Clientes</span>
                        <strong>Melhores clientes</strong>
                      </div>
                      <ol className="stats-list">
                        {stats.bestClients.map((client) => (
                          <li key={client.customer}>
                            <span>{client.customer}</span>
                            <strong>{formatPrice(client.total)}</strong>
                          </li>
                        ))}
                      </ol>
                    </article>
                  </div>

                  <article className="stats-card stats-card-wide">
                    <div className="stats-card-heading stats-card-heading-inline">
                      <div>
                        <span>Faturação</span>
                        <strong>Valor faturado por período</strong>
                      </div>
                      <select
                        onChange={(event) => setRevenuePeriod(event.target.value)}
                        value={revenuePeriod}
                      >
                        {Object.entries(revenuePeriodLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-table-wrap">
                      <table className="admin-table stats-table">
                        <thead>
                          <tr>
                            <th>Período</th>
                            <th>Encomendas</th>
                            <th>Valor faturado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.revenueByPeriod.map((period) => (
                            <tr key={period.label}>
                              <td>{period.label}</td>
                              <td>{period.orders}</td>
                              <td>{formatPrice(period.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </section>
              )}
            </>
          )}
        </section>
      </main>
    </AdminGuard>
  );
}
