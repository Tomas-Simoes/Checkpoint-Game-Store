package com.checkpoint.store.sale;

import com.checkpoint.store.domain.Sale;
import com.checkpoint.store.domain.SaleStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SaleResponse(
        Long id,
        Long customerId,
        String customerName,
        Instant saleDate,
        SaleStatus status,
        BigDecimal total,
        String paymentMethod,
        String deliveryAddress,
        String invoiceNumber,
        Instant invoiceIssuedAt,
        List<SaleItemResponse> items
) {

    public static SaleResponse from(Sale sale) {
        return new SaleResponse(
                sale.getId(),
                sale.getCustomer().getId(),
                sale.getCustomer().getName(),
                sale.getSaleDate(),
                sale.getStatus(),
                sale.getTotal(),
                sale.getPaymentMethod(),
                sale.getDeliveryAddress(),
                sale.getInvoiceNumber(),
                sale.getInvoiceIssuedAt(),
                sale.getItems().stream().map(SaleItemResponse::from).toList()
        );
    }
}
