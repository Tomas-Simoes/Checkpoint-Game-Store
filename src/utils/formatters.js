export function formatPrice(price) {
  return new Intl.NumberFormat("pt-PT", {
    currency: "EUR",
    style: "currency"
  }).format(price);
}

export function formatRating(rating) {
  return rating.toFixed(1);
}
