package com.checkpoint.store.repository;

import java.math.BigDecimal;

public interface ProductSalesProjection {

    Long getProductId();

    String getProductName();

    Long getUnitsSold();

    BigDecimal getRevenue();
}
