package com.checkpoint.store.customer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerPasswordRequest(
        @NotBlank(message = "A palavra-passe atual é obrigatória.")
        String currentPassword,

        @NotBlank(message = "A nova palavra-passe é obrigatória.")
        @Size(min = 8, max = 120, message = "A nova palavra-passe deve ter entre 8 e 120 caracteres.")
        String newPassword
) {
}
