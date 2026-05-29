package com.checkpoint.store.sale;

import com.checkpoint.store.auth.CurrentUserService;
import com.checkpoint.store.common.BusinessException;
import com.checkpoint.store.common.NotFoundException;
import com.checkpoint.store.domain.Customer;
import com.checkpoint.store.domain.Product;
import com.checkpoint.store.domain.Sale;
import com.checkpoint.store.domain.SaleItem;
import com.checkpoint.store.domain.SaleStatus;
import com.checkpoint.store.repository.ProductRepository;
import com.checkpoint.store.repository.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SaleService {

    private static final DateTimeFormatter INVOICE_YEAR = DateTimeFormatter.ofPattern("yyyy").withZone(ZoneId.systemDefault());

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final CurrentUserService currentUserService;

    public SaleService(SaleRepository saleRepository, ProductRepository productRepository, CurrentUserService currentUserService) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public SaleResponse create(CreateSaleRequest request) {
        Customer customer = currentUserService.getAuthenticatedCustomer();
        String deliveryAddress = request.deliveryAddress() == null || request.deliveryAddress().isBlank()
                ? customer.getAddress()
                : request.deliveryAddress().trim();

        Sale sale = new Sale(customer, deliveryAddress);

        Map<Long, Integer> quantitiesByProduct = request.items().stream()
                .collect(Collectors.toMap(
                        CreateSaleItemRequest::productId,
                        CreateSaleItemRequest::quantity,
                        Integer::sum
                ));

        quantitiesByProduct.forEach((productId, quantity) -> {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new NotFoundException("Produto não encontrado: " + productId));
            if (!product.isActive()) {
                throw new BusinessException("O produto não está disponível: " + product.getName());
            }
            if (quantity > product.getStock()) {
                throw new BusinessException("Stock insuficiente para o produto: " + product.getName());
            }
            product.decreaseStock(quantity);
            sale.addItem(new SaleItem(product, quantity));
        });

        Sale saved = saleRepository.save(sale);
        saved.issueInvoice(buildInvoiceNumber(saved));
        return SaleResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<SaleResponse> findMine() {
        Customer customer = currentUserService.getAuthenticatedCustomer();
        return saleRepository.findDetailedByCustomerId(customer.getId()).stream()
                .map(SaleResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SaleResponse> findAll() {
        return saleRepository.findAllByOrderBySaleDateDesc().stream()
                .map(SaleResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SaleResponse findById(Long id) {
        Sale sale = getDetailedSale(id);
        ensureCanRead(sale);
        return SaleResponse.from(sale);
    }

    @Transactional
    public SaleResponse updateStatus(Long id, UpdateSaleStatusRequest request) {
        Sale sale = getDetailedSale(id);
        if (sale.getStatus() == SaleStatus.CANCELLED) {
            throw new BusinessException("Não é possível alterar uma venda cancelada.");
        }
        if (request.status() == SaleStatus.CANCELLED) {
            sale.getItems().forEach(item -> item.getProduct().increaseStock(item.getQuantity()));
        }
        sale.setStatus(request.status());
        return SaleResponse.from(sale);
    }

    @Transactional(readOnly = true)
    public Sale getSaleForInvoice(Long id) {
        Sale sale = getDetailedSale(id);
        ensureCanRead(sale);
        return sale;
    }

    private Sale getDetailedSale(Long id) {
        return saleRepository.findDetailedById(id)
                .orElseThrow(() -> new NotFoundException("Venda não encontrada."));
    }

    private void ensureCanRead(Sale sale) {
        if (currentUserService.isAdmin()) {
            return;
        }
        Customer current = currentUserService.getAuthenticatedCustomer();
        if (!sale.getCustomer().getId().equals(current.getId())) {
            throw new BusinessException("Não pode consultar vendas de outro cliente.");
        }
    }

    private String buildInvoiceNumber(Sale sale) {
        return "INV-" + INVOICE_YEAR.format(sale.getSaleDate()) + "-" + String.format("%06d", sale.getId());
    }
}
