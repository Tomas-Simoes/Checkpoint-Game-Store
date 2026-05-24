package com.checkpoint.store.invoice;

import com.checkpoint.store.domain.SaleItem;

import java.math.BigDecimal;

public record InvoiceItemResponse(
        String productName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {

    public static InvoiceItemResponse from(SaleItem item) {
        return new InvoiceItemResponse(
                item.getProduct().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getLineTotal()
        );
    }
}
