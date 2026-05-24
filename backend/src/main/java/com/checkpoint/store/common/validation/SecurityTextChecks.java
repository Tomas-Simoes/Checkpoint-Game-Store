package com.checkpoint.store.common.validation;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Pattern;

final class SecurityTextChecks {

    private static final Pattern EVENT_HANDLER = Pattern.compile("(?i)(^|[\\s\"'`;/<])on[a-z0-9_-]{2,}\\s*=");
    private static final Pattern DANGEROUS_PROTOCOL = Pattern.compile("(?i)(?:javascript|vbscript|data)\\s*:");
    private static final Pattern CSS_EXPRESSION = Pattern.compile("(?i)expression\\s*\\(");
    private static final Pattern LOCAL_IMAGE_SOURCE = Pattern.compile("[A-Za-z0-9][A-Za-z0-9._/-]{0,199}");

    private SecurityTextChecks() {
    }

    static boolean containsUnsafeMarkup(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        String canonical = canonicalize(value);
        String lower = canonical.toLowerCase(Locale.ROOT);

        return lower.indexOf('<') >= 0
                || lower.indexOf('>') >= 0
                || EVENT_HANDLER.matcher(canonical).find()
                || DANGEROUS_PROTOCOL.matcher(canonical).find()
                || CSS_EXPRESSION.matcher(canonical).find();
    }

    static boolean isSafeImageSource(String value) {
        if (value == null || value.isBlank()) {
            return true;
        }

        String canonical = canonicalize(value).trim();
        String lower = canonical.toLowerCase(Locale.ROOT);

        if (containsUnsafeMarkup(canonical)
                || canonical.contains("\\")
                || canonical.contains("\r")
                || canonical.contains("\n")) {
            return false;
        }

        if (lower.startsWith("http://") || lower.startsWith("https://")) {
            try {
                java.net.URI uri = java.net.URI.create(canonical);
                return uri.getHost() != null
                        && ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()));
            } catch (IllegalArgumentException exception) {
                return false;
            }
        }

        if (canonical.startsWith("/") && !canonical.startsWith("//")) {
            return !canonical.contains("..");
        }

        return LOCAL_IMAGE_SOURCE.matcher(canonical).matches();
    }

    static String canonicalize(String value) {
        String current = value;

        for (int index = 0; index < 3; index++) {
            String decoded = decodeUrl(current);
            decoded = decodeHtmlEntities(decoded);
            decoded = decodeEscapedAngles(decoded);

            if (decoded.equals(current)) {
                return decoded;
            }

            current = decoded;
        }

        return current;
    }

    private static String decodeUrl(String value) {
        try {
            return URLDecoder.decode(value, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException exception) {
            return value;
        }
    }

    private static String decodeHtmlEntities(String value) {
        return value
                .replaceAll("(?i)&lt;|&#0*60;|&#x0*3c;", "<")
                .replaceAll("(?i)&gt;|&#0*62;|&#x0*3e;", ">")
                .replaceAll("(?i)&colon;|&#0*58;|&#x0*3a;", ":")
                .replaceAll("(?i)&quot;|&#0*34;|&#x0*22;", "\"")
                .replaceAll("(?i)&apos;|&#0*39;|&#x0*27;", "'")
                .replaceAll("(?i)&grave;|&#0*96;|&#x0*60;", "`");
    }

    private static String decodeEscapedAngles(String value) {
        return value
                .replaceAll("(?i)\\\\u0*3c|\\\\x0*3c", "<")
                .replaceAll("(?i)\\\\u0*3e|\\\\x0*3e", ">")
                .replaceAll("(?i)\\\\u0*3a|\\\\x0*3a", ":");
    }
}
