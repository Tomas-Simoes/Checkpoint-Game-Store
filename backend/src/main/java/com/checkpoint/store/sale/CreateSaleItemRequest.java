package com.checkpoint.store.sale;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateSaleItemRequest(
        @NotNull(message = "O produto é obrigatório.")
        Long productId,

        @Positive(message = "A quantidade deve ser superior a zero.")
        int quantity
) {
}
