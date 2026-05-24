package com.checkpoint.store.invoice;

import com.checkpoint.store.sale.SaleService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final SaleService saleService;

    public InvoiceController(SaleService saleService) {
        this.saleService = saleService;
    }

    @GetMapping("/sales/{saleId}")
    public InvoiceResponse findBySale(@PathVariable Long saleId) {
        return InvoiceResponse.from(saleService.getSaleForInvoice(saleId));
    }
}
