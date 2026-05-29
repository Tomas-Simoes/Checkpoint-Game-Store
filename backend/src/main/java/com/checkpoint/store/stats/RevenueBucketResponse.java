package com.checkpoint.store.stats;

import java.math.BigDecimal;

public record RevenueBucketResponse(
        String period,
        long orders,
        BigDecimal total
) {
}
