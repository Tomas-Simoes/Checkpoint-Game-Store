package com.checkpoint.store.repository;

import com.checkpoint.store.domain.SaleItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    @Query("""
            SELECT p.id AS productId,
                   p.name AS productName,
                   COALESCE(SUM(si.quantity), 0) AS unitsSold,
                   COALESCE(SUM(si.lineTotal), 0) AS revenue
            FROM SaleItem si
            JOIN si.product p
            JOIN si.sale s
            WHERE s.status <> com.checkpoint.store.domain.SaleStatus.CANCELLED
            GROUP BY p.id, p.name
            ORDER BY SUM(si.quantity) DESC
            """)
    List<ProductSalesProjection> findTopSoldProducts(Pageable pageable);

    @Query("""
            SELECT p.id AS productId,
                   p.name AS productName,
                   COALESCE(SUM(si.quantity), 0) AS unitsSold,
                   COALESCE(SUM(si.lineTotal), 0) AS revenue
            FROM Product p
            LEFT JOIN p.saleItems si ON si.sale.status <> com.checkpoint.store.domain.SaleStatus.CANCELLED
            GROUP BY p.id, p.name
            ORDER BY COALESCE(SUM(si.quantity), 0) ASC, p.name ASC
            """)
    List<ProductSalesProjection> findLeastSoldProducts(Pageable pageable);
}
