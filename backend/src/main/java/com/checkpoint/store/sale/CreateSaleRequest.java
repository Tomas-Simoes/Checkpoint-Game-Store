package com.checkpoint.store.sale;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateSaleRequest(
        @Size(max = 500, message = "A morada de entrega não pode ultrapassar 500 caracteres.")
        String deliveryAddress,

        @NotEmpty(message = "A compra deve conter pelo menos um produto.")
        List<@Valid CreateSaleItemRequest> items
) {
}
