package com.checkpoint.store.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "O nome do produto é obrigatório.")
        @Size(max = 180, message = "O nome do produto não pode ultrapassar 180 caracteres.")
        String name,

        @NotBlank(message = "A descrição do produto é obrigatória.")
        @Size(max = 1000, message = "A descrição não pode ultrapassar 1000 caracteres.")
        String description,

        @NotNull(message = "O preço é obrigatório.")
        @DecimalMin(value = "0.01", message = "O preço deve ser superior a zero.")
        BigDecimal price,

        @PositiveOrZero(message = "O stock não pode ser negativo.")
        int stock,

        @Size(max = 600, message = "O URL/imagem não pode ultrapassar 600 caracteres.")
        String imageUrl,

        @NotNull(message = "A categoria é obrigatória.")
        Long categoryId,

        Boolean active
) {
}
