package com.michias.threadims.report;

import com.michias.threadims.common.DateRanges;
import com.michias.threadims.inventory.InventoryBalanceRepository;
import com.michias.threadims.inventory.InventoryBalance;
import com.michias.threadims.payment.Payment;
import com.michias.threadims.report.dto.DailyRevenueRow;
import com.michias.threadims.report.dto.ProductSalesRow;
import com.michias.threadims.report.dto.SalesReportResponse;
import com.michias.threadims.sale.Sale;
import com.michias.threadims.sale.SaleItem;
import com.michias.threadims.sale.SaleRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final SaleRepository saleRepository;
    private final InventoryBalanceRepository inventoryBalanceRepository;

    public ReportService(SaleRepository saleRepository, InventoryBalanceRepository inventoryBalanceRepository) {
        this.saleRepository = saleRepository;
        this.inventoryBalanceRepository = inventoryBalanceRepository;
    }

    public SalesReportResponse salesSummary(UUID locationId, Instant from, Instant to) {
        List<Sale> sales =
                saleRepository.findCompletedForReport(locationId, DateRanges.orPast(from), DateRanges.orFuture(to));

        BigDecimal totalRevenue = sales.stream().map(Sale::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalTransactions = sales.size();
        BigDecimal average = totalTransactions == 0
                ? BigDecimal.ZERO
                : totalRevenue.divide(BigDecimal.valueOf(totalTransactions), 2, RoundingMode.HALF_UP);

        Map<String, BigDecimal> revenueByMethod = new LinkedHashMap<>();
        for (Sale sale : sales) {
            for (Payment payment : sale.getPayments()) {
                revenueByMethod.merge(payment.getMethod().name(), payment.getAmount(), BigDecimal::add);
            }
        }

        Map<String, Acc> byVariant = new LinkedHashMap<>();
        BigDecimal totalItemsSold = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        for (Sale sale : sales) {
            for (SaleItem item : sale.getItems()) {
                String key = item.getProductVariant().getId().toString();
                Acc acc = byVariant.computeIfAbsent(key, k -> new Acc(item));
                acc.quantity = acc.quantity.add(item.getQuantity());
                acc.revenue = acc.revenue.add(item.getLineTotal());
                totalItemsSold = totalItemsSold.add(item.getQuantity());
                if (item.getUnitCostAtSale() != null) {
                    totalCost = totalCost.add(item.getUnitCostAtSale().multiply(item.getQuantity()));
                }
            }
        }
        BigDecimal grossProfit = totalRevenue.subtract(totalCost);
        List<ProductSalesRow> bestSelling = byVariant.values().stream()
                .sorted(Comparator.comparing((Acc a) -> a.quantity).reversed())
                .limit(10)
                .map(a -> new ProductSalesRow(a.productName, a.sku, a.colorName, a.quantity, a.revenue))
                .toList();

        Map<LocalDate, DailyAcc> byDay = new LinkedHashMap<>();
        for (Sale sale : sales) {
            LocalDate day = sale.getSaleDate().atZone(ZoneOffset.UTC).toLocalDate();
            DailyAcc acc = byDay.computeIfAbsent(day, d -> new DailyAcc());
            acc.revenue = acc.revenue.add(sale.getTotalAmount());
            acc.transactions++;
        }
        List<DailyRevenueRow> dailyRevenue = buildDailySeries(byDay, from, to);

        return new SalesReportResponse(
                totalRevenue,
                totalTransactions,
                average,
                totalItemsSold,
                grossProfit,
                revenueByMethod,
                bestSelling,
                dailyRevenue);
    }

    private List<DailyRevenueRow> buildDailySeries(Map<LocalDate, DailyAcc> byDay, Instant from, Instant to) {
        if (from == null || to == null) {
            return byDay.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .map(e -> new DailyRevenueRow(e.getKey(), e.getValue().revenue, e.getValue().transactions))
                    .toList();
        }
        LocalDate start = from.atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate end = to.atZone(ZoneOffset.UTC).toLocalDate();
        List<DailyRevenueRow> series = new ArrayList<>();
        for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
            DailyAcc acc = byDay.get(day);
            series.add(acc == null
                    ? new DailyRevenueRow(day, BigDecimal.ZERO, 0)
                    : new DailyRevenueRow(day, acc.revenue, acc.transactions));
        }
        return series;
    }

    public List<Sale> salesRows(UUID locationId, Instant from, Instant to) {
        return saleRepository.findCompletedForReport(locationId, DateRanges.orPast(from), DateRanges.orFuture(to));
    }

    public List<InventoryBalance> inventoryRows(UUID locationId) {
        return inventoryBalanceRepository.findByLocation(locationId, "");
    }

    private static final class DailyAcc {
        BigDecimal revenue = BigDecimal.ZERO;
        long transactions = 0;
    }

    private static final class Acc {
        final String productName;
        final String sku;
        final String colorName;
        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal revenue = BigDecimal.ZERO;

        Acc(SaleItem item) {
            this.productName = item.getProductVariant().getProduct().getName();
            this.sku = item.getProductVariant().getSku();
            this.colorName = item.getProductVariant().getColorName();
        }
    }
}
