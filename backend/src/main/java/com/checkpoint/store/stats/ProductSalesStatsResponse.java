package com.checkpoint.store.stats;

import com.checkpoint.store.repository.ProductSalesProjection;

import java.math.BigDecimal;

public record ProductSalesStatsResponse(
        Long productId,
        String productName,
        Long unitsSold,
        BigDecimal revenue
) {

    public static ProductSalesStatsResponse from(ProductSalesProjection projection) {
        return new ProductSalesStatsResponse(
                projection.getProductId(),
                projection.getProductName(),
                projection.getUnitsSold(),
                projection.getRevenue()
        );
    }
}
