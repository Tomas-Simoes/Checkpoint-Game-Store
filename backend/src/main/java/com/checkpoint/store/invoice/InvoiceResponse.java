package com.checkpoint.store.invoice;

import com.checkpoint.store.domain.Sale;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record InvoiceResponse(
        String invoiceNumber,
        Instant issuedAt,
        Long saleId,
        Instant saleDate,
        String customerName,
        String customerEmail,
        String billingAddress,
        String paymentMethod,
        BigDecimal total,
        List<InvoiceItemResponse> items,
        String note
) {

    public static InvoiceResponse from(Sale sale) {
        return new InvoiceResponse(
                sale.getInvoiceNumber(),
                sale.getInvoiceIssuedAt(),
                sale.getId(),
                sale.getSaleDate(),
                sale.getCustomer().getName(),
                sale.getCustomer().getEmail(),
                sale.getDeliveryAddress(),
                sale.getPaymentMethod(),
                sale.getTotal(),
                sale.getItems().stream().map(InvoiceItemResponse::from).toList(),
                "Pagamento no momento da entrega."
        );
    }
}
