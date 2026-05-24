package com.checkpoint.store.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales")
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false)
    private Instant saleDate = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SaleStatus status = SaleStatus.PENDING_DELIVERY;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(nullable = false, length = 80)
    private String paymentMethod = "PAYMENT_ON_DELIVERY";

    @Column(nullable = false, length = 500)
    private String deliveryAddress;

    @Column(unique = true, length = 40)
    private String invoiceNumber;

    private Instant invoiceIssuedAt;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SaleItem> items = new ArrayList<>();

    protected Sale() {
    }

    public Sale(Customer customer, String deliveryAddress) {
        this.customer = customer;
        this.deliveryAddress = deliveryAddress;
    }

    public Long getId() {
        return id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public Instant getSaleDate() {
        return saleDate;
    }

    public SaleStatus getStatus() {
        return status;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public Instant getInvoiceIssuedAt() {
        return invoiceIssuedAt;
    }

    public List<SaleItem> getItems() {
        return items;
    }

    public void addItem(SaleItem item) {
        items.add(item);
        item.assignToSale(this);
        recalculateTotal();
    }

    public void setStatus(SaleStatus status) {
        this.status = status;
    }

    public void issueInvoice(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
        this.invoiceIssuedAt = Instant.now();
    }

    private void recalculateTotal() {
        total = items.stream()
                .map(SaleItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
