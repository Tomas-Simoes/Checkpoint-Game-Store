package com.checkpoint.store.product;

import com.checkpoint.store.auth.CurrentUserService;
import com.checkpoint.store.common.NotFoundException;
import com.checkpoint.store.domain.Category;
import com.checkpoint.store.domain.Product;
import com.checkpoint.store.repository.CategoryRepository;
import com.checkpoint.store.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CurrentUserService currentUserService;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            CurrentUserService currentUserService
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> search(Long categoryId, String search, BigDecimal minPrice, BigDecimal maxPrice, Boolean inStock, boolean includeInactive) {
        boolean canIncludeInactive = includeInactive && currentUserService.isAdmin();
        String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
        return productRepository.search(categoryId, normalizedSearch, minPrice, maxPrice, inStock, canIncludeInactive).stream()
                .map(ProductResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        Product product = getProduct(id);
        if (!product.isActive() && !currentUserService.isAdmin()) {
            throw new NotFoundException("Produto não encontrado.");
        }
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Category category = getCategory(request.categoryId());
        Product product = new Product(
                request.name().trim(),
                request.description().trim(),
                request.price(),
                request.stock(),
                normalizeOptional(request.imageUrl()),
                category
        );
        if (Boolean.FALSE.equals(request.active())) {
            product.deactivate();
        }
        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getProduct(id);
        Category category = getCategory(request.categoryId());
        product.update(
                request.name().trim(),
                request.description().trim(),
                request.price(),
                request.stock(),
                normalizeOptional(request.imageUrl()),
                request.active() == null || request.active(),
                category
        );
        return ProductResponse.from(product);
    }

    @Transactional
    public void delete(Long id) {
        Product product = getProduct(id);
        product.deactivate();
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Produto não encontrado."));
    }

    private Category getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Categoria não encontrada."));
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
