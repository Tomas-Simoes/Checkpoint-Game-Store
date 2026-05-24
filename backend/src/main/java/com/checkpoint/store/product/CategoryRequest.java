package com.checkpoint.store.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "O nome da categoria é obrigatório.")
        @Size(max = 120, message = "O nome da categoria não pode ultrapassar 120 caracteres.")
        String name,

        @NotBlank(message = "A descrição da categoria é obrigatória.")
        @Size(max = 500, message = "A descrição da categoria não pode ultrapassar 500 caracteres.")
        String description
) {
}
