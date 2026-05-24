package com.checkpoint.store.customer;

import com.checkpoint.store.common.validation.SafeText;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerUpdateRequest(
        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 160, message = "O nome não pode ultrapassar 160 caracteres.")
        @SafeText
        String name,

        @Size(max = 40, message = "O telefone não pode ultrapassar 40 caracteres.")
        @SafeText
        String phone,

        @NotBlank(message = "A morada é obrigatória.")
        @Size(max = 500, message = "A morada não pode ultrapassar 500 caracteres.")
        @SafeText
        String address
) {
}
