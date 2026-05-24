package com.checkpoint.store.repository;

import java.math.BigDecimal;

public interface CustomerSalesProjection {

    Long getCustomerId();

    String getCustomerName();

    String getEmail();

    Long getTotalOrders();

    BigDecimal getTotalSpent();
}
