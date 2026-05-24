package com.checkpoint.store.stats;

import com.checkpoint.store.domain.Sale;
import com.checkpoint.store.domain.SaleStatus;
import com.checkpoint.store.repository.SaleItemRepository;
import com.checkpoint.store.repository.SaleRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class StatsService {

    private final SaleItemRepository saleItemRepository;
    private final SaleRepository saleRepository;

    public StatsService(SaleItemRepository saleItemRepository, SaleRepository saleRepository) {
        this.saleItemRepository = saleItemRepository;
        this.saleRepository = saleRepository;
    }

    public List<ProductSalesStatsResponse> topProducts(int limit) {
        return saleItemRepository.findTopSoldProducts(PageRequest.of(0, sanitizeLimit(limit))).stream()
                .map(ProductSalesStatsResponse::from)
                .toList();
    }

    public List<ProductSalesStatsResponse> leastSoldProducts(int limit) {
        return saleItemRepository.findLeastSoldProducts(PageRequest.of(0, sanitizeLimit(limit))).stream()
                .map(ProductSalesStatsResponse::from)
                .toList();
    }

    public List<CustomerStatsResponse> bestCustomers(int limit) {
        return saleRepository.findBestCustomers(PageRequest.of(0, sanitizeLimit(limit))).stream()
                .map(CustomerStatsResponse::from)
                .toList();
    }

    public RevenueStatsResponse revenue(LocalDate from, LocalDate to, RevenueGroup groupBy) {
        LocalDate effectiveTo = to == null ? LocalDate.now() : to;
        LocalDate effectiveFrom = from == null ? effectiveTo.minusMonths(1) : from;
        RevenueGroup effectiveGroup = groupBy == null ? RevenueGroup.DAY : groupBy;

        ZoneId zone = ZoneId.systemDefault();
        Instant start = effectiveFrom.atStartOfDay(zone).toInstant();
        Instant end = effectiveTo.plusDays(1).atStartOfDay(zone).toInstant();
        List<Sale> sales = saleRepository.findBySaleDateBetweenAndStatusNot(start, end, SaleStatus.CANCELLED);

        Map<String, BigDecimal> grouped = sales.stream()
                .collect(Collectors.groupingBy(
                        sale -> bucketFor(sale, effectiveGroup, zone),
                        TreeMap::new,
                        Collectors.reducing(BigDecimal.ZERO, Sale::getTotal, BigDecimal::add)
                ));

        BigDecimal total = grouped.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        List<RevenueBucketResponse> buckets = grouped.entrySet().stream()
                .map(entry -> new RevenueBucketResponse(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(RevenueBucketResponse::period))
                .toList();

        return new RevenueStatsResponse(effectiveFrom, effectiveTo, effectiveGroup, total, buckets);
    }

    private String bucketFor(Sale sale, RevenueGroup groupBy, ZoneId zone) {
        LocalDate date = sale.getSaleDate().atZone(zone).toLocalDate();
        return switch (groupBy) {
            case DAY -> date.format(DateTimeFormatter.ISO_DATE);
            case WEEK -> {
                WeekFields weekFields = WeekFields.of(Locale.getDefault());
                int week = date.get(weekFields.weekOfWeekBasedYear());
                int year = date.get(weekFields.weekBasedYear());
                yield year + "-W" + String.format("%02d", week);
            }
            case MONTH -> date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        };
    }

    private int sanitizeLimit(int limit) {
        if (limit < 1) {
            return 1;
        }
        return Math.min(limit, 50);
    }
}
