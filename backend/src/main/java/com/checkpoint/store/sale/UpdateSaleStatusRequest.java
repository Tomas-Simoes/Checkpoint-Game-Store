package com.checkpoint.store.sale;

import com.checkpoint.store.domain.SaleStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateSaleStatusRequest(
        @NotNull(message = "O estado é obrigatório.")
        SaleStatus status
) {
}
