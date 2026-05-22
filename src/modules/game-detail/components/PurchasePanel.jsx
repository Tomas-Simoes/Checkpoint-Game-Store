import { useEffect, useMemo, useState } from "react";
import { shopApi } from "../../../api/shopApi.js";
import { useAuth } from "../../auth/index.js";
import { formatPrice } from "../../../utils/formatters.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const postalCodePattern = /^[0-9]{4}-[0-9]{3}$/;

function createInitialForm(user) {
  return {
    address: "",
    city: "",
    email: user?.email ?? "",
    name: user?.name ?? "",
    phone: "",
    postalCode: "",
    quantity: "1"
  };
}

function readErrorMessage(error) {
  return (
    error?.data?.message ??
    error?.message ??
    "Não foi possível concluir a compra."
  );
}

function formatPurchaseDate(date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

function validatePurchaseForm(form) {
  const name = form.name.trim();
  const email = form.email.trim().toLowerCase();
  const phone = form.phone.trim();
  const address = form.address.trim();
  const postalCode = form.postalCode.trim();
  const city = form.city.trim();
  const quantity = Number(form.quantity);

  if (name.length < 2 || name.length > 80) {
    return { error: "O nome deve ter entre 2 e 80 caracteres." };
  }

  if (!emailPattern.test(email)) {
    return { error: "Indica um email válido." };
  }

  if (phone.length < 6 || phone.length > 20) {
    return { error: "Indica um contacto telefónico válido." };
  }

  if (address.length < 6 || address.length > 140) {
    return { error: "A morada deve ter entre 6 e 140 caracteres." };
  }

  if (!postalCodePattern.test(postalCode)) {
    return { error: "O código postal deve usar o formato 0000-000." };
  }

  if (city.length < 2 || city.length > 60) {
    return { error: "A localidade deve ter entre 2 e 60 caracteres." };
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
    return { error: "A quantidade deve estar entre 1 e 5." };
  }

  return {
    payload: {
      customer: {
        email,
        name
      },
      delivery: {
        address,
        city,
        name,
        phone,
        postalCode
      },
      quantity
    }
  };
}

export function PurchasePanel({ game }) {
  const { isAuthenticated, isChecking, user } = useAuth();
  const [form, setForm] = useState(() => createInitialForm(user));
  const [formError, setFormError] = useState("");
  const [purchase, setPurchase] = useState(null);
  const [status, setStatus] = useState("idle");
  const loginHref = useMemo(
    () => `#/login?next=${encodeURIComponent(`/jogos/${game.slug}`)}`,
    [game.slug]
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      email: user.email,
      name: currentForm.name || user.name
    }));
  }, [user]);

  function updateForm(field, value) {
    setFormError("");
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function submitPurchase(event) {
    event.preventDefault();

    if (!isAuthenticated) {
      window.location.hash = loginHref.slice(1);
      return;
    }

    const validation = validatePurchaseForm(form);

    if (validation.error) {
      setFormError(validation.error);
      return;
    }

    setStatus("submitting");
    setFormError("");

    try {
      const purchaseResponse = await shopApi.purchaseGame(
        game.id,
        validation.payload
      );

      setPurchase(purchaseResponse);
      setStatus("success");
    } catch (error) {
      setStatus("idle");
      setFormError(readErrorMessage(error));
    }
  }

  if (isChecking) {
    return (
      <section className="purchase-panel" aria-label="Compra">
        <p className="catalog-status">A validar sessão...</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="purchase-panel" aria-labelledby="purchase-title">
        <div className="purchase-panel-heading">
          <p className="eyebrow">Compra online</p>
          <h2 id="purchase-title">Entra para comprar</h2>
        </div>
        <p className="purchase-muted">
          A compra fica associada à tua conta e gera uma key de jogo mockada.
        </p>
        <a className="button button-primary" href={loginHref}>
          Entrar e comprar
        </a>
      </section>
    );
  }

  if (purchase) {
    return (
      <section className="purchase-panel purchase-confirmation" aria-live="polite">
        <div className="purchase-panel-heading">
          <p className="eyebrow">Compra registada</p>
          <h2>{game.title}</h2>
        </div>

        <dl className="purchase-result">
          <div>
            <dt>Key do jogo</dt>
            <dd>
              <code>{purchase.gameKey}</code>
            </dd>
          </div>
          <div>
            <dt>Fatura</dt>
            <dd>{purchase.invoice.number}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{formatPrice(purchase.invoice.total)}</dd>
          </div>
          <div>
            <dt>Pagamento</dt>
            <dd>{purchase.invoice.paymentMethod}</dd>
          </div>
        </dl>

        <p className="purchase-muted">
          A venda ficou pendente no backoffice até o pagamento ser confirmado na entrega.
        </p>

        <article className="invoice-preview" aria-label="Fatura emitida">
          <div className="invoice-heading">
            <div>
              <span>Fatura</span>
              <strong>{purchase.invoice.number}</strong>
            </div>
            <button onClick={() => window.print()} type="button">
              Imprimir
            </button>
          </div>

          <dl className="invoice-meta">
            <div>
              <dt>Emitida em</dt>
              <dd>{formatPurchaseDate(purchase.invoice.issuedAt)}</dd>
            </div>
            <div>
              <dt>Cliente</dt>
              <dd>{purchase.invoice.customer.name}</dd>
            </div>
            <div>
              <dt>Pagamento</dt>
              <dd>{purchase.invoice.paymentMethod}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{purchase.invoice.paymentStatus}</dd>
            </div>
          </dl>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Qtd</th>
                <th>Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {purchase.invoice.items.map((item) => (
                <tr key={item.productId}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.unitPrice)}</td>
                  <td>{formatPrice(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="invoice-total">
            Total a pagar na entrega:{" "}
            <strong>{formatPrice(purchase.invoice.total)}</strong>
          </p>
        </article>

        <button
          className="button button-secondary"
          onClick={() => {
            setPurchase(null);
            setForm((currentForm) => ({
              ...currentForm,
              quantity: "1"
            }));
          }}
          type="button"
        >
          Nova compra
        </button>
      </section>
    );
  }

  return (
    <section className="purchase-panel" aria-labelledby="purchase-title">
      <div className="purchase-panel-heading">
        <p className="eyebrow">Compra online</p>
        <h2 id="purchase-title">Comprar {game.title}</h2>
      </div>

      <form className="purchase-form" noValidate onSubmit={submitPurchase}>
        <label>
          Nome para entrega
          <input
            autoComplete="name"
            onChange={(event) => updateForm("name", event.target.value)}
            type="text"
            value={form.name}
          />
        </label>

        <label>
          Email da conta
          <input
            autoComplete="email"
            onChange={(event) => updateForm("email", event.target.value)}
            readOnly
            type="email"
            value={form.email}
          />
        </label>

        <label>
          Contacto
          <input
            autoComplete="tel"
            onChange={(event) => updateForm("phone", event.target.value)}
            type="tel"
            value={form.phone}
          />
        </label>

        <label>
          Quantidade
          <input
            max="5"
            min="1"
            onChange={(event) => updateForm("quantity", event.target.value)}
            type="number"
            value={form.quantity}
          />
        </label>

        <label className="purchase-form-wide">
          Morada
          <input
            autoComplete="street-address"
            onChange={(event) => updateForm("address", event.target.value)}
            type="text"
            value={form.address}
          />
        </label>

        <label>
          Código postal
          <input
            autoComplete="postal-code"
            onChange={(event) => updateForm("postalCode", event.target.value)}
            placeholder="0000-000"
            type="text"
            value={form.postalCode}
          />
        </label>

        <label>
          Localidade
          <input
            autoComplete="address-level2"
            onChange={(event) => updateForm("city", event.target.value)}
            type="text"
            value={form.city}
          />
        </label>

        <label className="purchase-form-wide">
          Pagamento
          <select disabled value="delivery">
            <option value="delivery">Pagamento no momento da entrega</option>
          </select>
        </label>

        {formError && (
          <p className="purchase-error" role="alert">
            {formError}
          </p>
        )}

        <button
          className="button button-primary purchase-submit"
          disabled={status === "submitting"}
          type="submit"
        >
          {status === "submitting" ? "A comprar..." : "Comprar agora"}
        </button>
      </form>
    </section>
  );
}
