package com.checkpoint.store.common.validation;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityTextChecksTest {

    @Test
    void safeTextAcceptsPlainBusinessText() {
        assertThat(SecurityTextChecks.containsUnsafeMarkup("Rua Demo 1, Lisboa")).isFalse();
        assertThat(SecurityTextChecks.containsUnsafeMarkup("Comando Wireless Pro")).isFalse();
        assertThat(SecurityTextChecks.containsUnsafeMarkup("Jogos digitais e retrogaming")).isFalse();
    }

    @Test
    void safeTextRejectsStoredAndReflectedXssPayloads() {
        assertThat(SecurityTextChecks.containsUnsafeMarkup("<script>alert(1)</script>")).isTrue();
        assertThat(SecurityTextChecks.containsUnsafeMarkup("<img src=x onerror=alert(1)>")).isTrue();
        assertThat(SecurityTextChecks.containsUnsafeMarkup("%3Csvg%20onload%3Dalert(1)%3E")).isTrue();
        assertThat(SecurityTextChecks.containsUnsafeMarkup("&#x3C;iframe srcdoc=alert(1)&#x3E;")).isTrue();
        assertThat(SecurityTextChecks.containsUnsafeMarkup("\\u003cscript\\u003ealert(1)\\u003c/script\\u003e")).isTrue();
        assertThat(SecurityTextChecks.containsUnsafeMarkup("javascript:alert(1)")).isTrue();
        assertThat(SecurityTextChecks.containsUnsafeMarkup("background: expression(alert(1))")).isTrue();
    }

    @Test
    void safeImageSourceAllowsOnlyExpectedImageReferences() {
        assertThat(SecurityTextChecks.isSafeImageSource("cover-peak")).isTrue();
        assertThat(SecurityTextChecks.isSafeImageSource("/assets/covers/peak.png")).isTrue();
        assertThat(SecurityTextChecks.isSafeImageSource("https://example.com/cover.png")).isTrue();
        assertThat(SecurityTextChecks.isSafeImageSource("http://example.com/cover.png")).isTrue();

        assertThat(SecurityTextChecks.isSafeImageSource("javascript:alert(1)")).isFalse();
        assertThat(SecurityTextChecks.isSafeImageSource("data:image/svg+xml,<svg onload=alert(1)>")).isFalse();
        assertThat(SecurityTextChecks.isSafeImageSource("//evil.example/cover.png")).isFalse();
        assertThat(SecurityTextChecks.isSafeImageSource("/../secret.png")).isFalse();
    }
}
