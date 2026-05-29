package com.checkpoint.store.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class SafeImageSourceValidator implements ConstraintValidator<SafeImageSource, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return SecurityTextChecks.isSafeImageSource(value);
    }
}
