package com.checkpoint.store.stats;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record RevenueStatsResponse(
        LocalDate from,
        LocalDate to,
        RevenueGroup groupBy,
        BigDecimal total,
        List<RevenueBucketResponse> buckets
) {
}
