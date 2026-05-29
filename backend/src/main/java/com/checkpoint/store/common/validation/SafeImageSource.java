package com.checkpoint.store.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = SafeImageSourceValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface SafeImageSource {

    String message() default "A imagem deve ser um URL http/https, um caminho local seguro ou um identificador local.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
