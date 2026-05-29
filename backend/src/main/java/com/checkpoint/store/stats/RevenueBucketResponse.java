package com.checkpoint.store.stats;

import java.math.BigDecimal;

public record RevenueBucketResponse(
        String period,
        BigDecimal total
) {
}
