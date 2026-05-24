package com.checkpoint.store.repository;

import com.checkpoint.store.domain.Customer;
import com.checkpoint.store.domain.Sale;
import com.checkpoint.store.domain.SaleStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    @EntityGraph(attributePaths = {"customer", "items", "items.product", "items.product.category"})
    @Query("SELECT s FROM Sale s WHERE s.id = :id")
    Optional<Sale> findDetailedById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"items", "items.product", "items.product.category"})
    List<Sale> findByCustomerOrderBySaleDateDesc(Customer customer);

    @EntityGraph(attributePaths = {"customer", "items", "items.product"})
    List<Sale> findAllByOrderBySaleDateDesc();

    List<Sale> findBySaleDateBetweenAndStatusNot(Instant from, Instant to, SaleStatus status);

    @Query("""
            SELECT c.id AS customerId,
                   c.name AS customerName,
                   c.email AS email,
                   COUNT(s.id) AS totalOrders,
                   COALESCE(SUM(s.total), 0) AS totalSpent
            FROM Sale s
            JOIN s.customer c
            WHERE s.status <> com.checkpoint.store.domain.SaleStatus.CANCELLED
            GROUP BY c.id, c.name, c.email
            ORDER BY SUM(s.total) DESC
            """)
    List<CustomerSalesProjection> findBestCustomers(Pageable pageable);

    @Query("""
            SELECT s FROM Sale s
            JOIN FETCH s.customer
            LEFT JOIN FETCH s.items si
            LEFT JOIN FETCH si.product
            WHERE s.customer.id = :customerId
            ORDER BY s.saleDate DESC
            """)
    List<Sale> findDetailedByCustomerId(@Param("customerId") Long customerId);
}
