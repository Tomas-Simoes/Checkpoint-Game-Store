package com.checkpoint.store.stats;

import com.checkpoint.store.repository.CustomerSalesProjection;

import java.math.BigDecimal;

public record CustomerStatsResponse(
        Long customerId,
        String customerName,
        String email,
        Long totalOrders,
        BigDecimal totalSpent
) {

    public static CustomerStatsResponse from(CustomerSalesProjection projection) {
        return new CustomerStatsResponse(
                projection.getCustomerId(),
                projection.getCustomerName(),
                projection.getEmail(),
                projection.getTotalOrders(),
                projection.getTotalSpent()
        );
    }
}
