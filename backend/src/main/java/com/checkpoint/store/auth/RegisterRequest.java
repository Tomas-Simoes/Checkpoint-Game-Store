package com.checkpoint.store.auth;

import com.checkpoint.store.common.validation.SafeText;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 160, message = "O nome não pode ultrapassar 160 caracteres.")
        @SafeText
        String name,

        @NotBlank(message = "O email é obrigatório.")
        @Email(message = "O email deve ser válido.")
        @Size(max = 180, message = "O email não pode ultrapassar 180 caracteres.")
        String email,

        @NotBlank(message = "A palavra-passe é obrigatória.")
        @Size(min = 8, max = 120, message = "A palavra-passe deve ter entre 8 e 120 caracteres.")
        String password,

        @Size(max = 40, message = "O telefone não pode ultrapassar 40 caracteres.")
        @SafeText
        String phone,

        @NotBlank(message = "A morada é obrigatória.")
        @Size(max = 500, message = "A morada não pode ultrapassar 500 caracteres.")
        @SafeText
        String address
) {
}
