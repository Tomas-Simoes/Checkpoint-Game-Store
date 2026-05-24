package com.checkpoint.store.stats;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/stats")
@PreAuthorize("hasRole('ADMIN')")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/products/top")
    public List<ProductSalesStatsResponse> topProducts(@RequestParam(defaultValue = "5") int limit) {
        return statsService.topProducts(limit);
    }

    @GetMapping("/products/least")
    public List<ProductSalesStatsResponse> leastSoldProducts(@RequestParam(defaultValue = "5") int limit) {
        return statsService.leastSoldProducts(limit);
    }

    @GetMapping("/customers/top")
    public List<CustomerStatsResponse> bestCustomers(@RequestParam(defaultValue = "5") int limit) {
        return statsService.bestCustomers(limit);
    }

    @GetMapping("/revenue")
    public RevenueStatsResponse revenue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) RevenueGroup groupBy
    ) {
        return statsService.revenue(from, to, groupBy);
    }
}
