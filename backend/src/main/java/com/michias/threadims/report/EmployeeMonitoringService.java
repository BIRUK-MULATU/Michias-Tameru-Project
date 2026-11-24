package com.michias.threadims.report;

import com.michias.threadims.audit.AuditLogService;
import com.michias.threadims.audit.dto.AuditLogResponse;
import com.michias.threadims.closing.ClosingService;
import com.michias.threadims.closing.DailyClosingRepository;
import com.michias.threadims.common.DateRanges;
import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.closing.dto.ClosingPreviewResponse;
import com.michias.threadims.inventory.InventoryBalanceRepository;
import com.michias.threadims.inventory.StockAdjustmentRepository;
import com.michias.threadims.inventory.StockMovementRepository;
import com.michias.threadims.inventory.dto.StockMovementResponse;
import com.michias.threadims.location.Location;
import com.michias.threadims.payment.Payment;
import com.michias.threadims.report.dto.DailyRevenueRow;
import com.michias.threadims.report.dto.EmployeeComparisonRow;
import com.michias.threadims.report.dto.EmployeePerformanceResponse;
import com.michias.threadims.report.dto.EmployeeSummaryResponse;
import com.michias.threadims.report.dto.ProductSalesRow;
import com.michias.threadims.returns.ReturnRepository;
import com.michias.threadims.sale.Sale;
import com.michias.threadims.sale.SaleItem;
import com.michias.threadims.sale.SaleRepository;
import com.michias.threadims.sale.SaleService;
import com.michias.threadims.sale.dto.SaleResponse;
import com.michias.threadims.common.ApprovalStatus;
import com.michias.threadims.user.Role;
import com.michias.threadims.user.User;
import com.michias.threadims.user.UserRepository;
import com.michias.threadims.user.UserService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EmployeeMonitoringService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final SaleRepository saleRepository;
    private final SaleService saleService;
    private final ReturnRepository returnRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final InventoryBalanceRepository inventoryBalanceRepository;
    private final DailyClosingRepository dailyClosingRepository;
    private final ClosingService closingService;
    private final AuditLogService auditLogService;

    public EmployeeMonitoringService(
            UserRepository userRepository,
            UserService userService,
            SaleRepository saleRepository,
            SaleService saleService,
            ReturnRepository returnRepository,
            StockMovementRepository stockMovementRepository,
            StockAdjustmentRepository stockAdjustmentRepository,
            InventoryBalanceRepository inventoryBalanceRepository,
            DailyClosingRepository dailyClosingRepository,
            ClosingService closingService,
            AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.saleRepository = saleRepository;
        this.saleService = saleService;
        this.returnRepository = returnRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.stockAdjustmentRepository = stockAdjustmentRepository;
        this.inventoryBalanceRepository = inventoryBalanceRepository;
        this.dailyClosingRepository = dailyClosingRepository;
        this.closingService = closingService;
        this.auditLogService = auditLogService;
    }

    public List<EmployeeSummaryResponse> findAllSummaries() {
        return userRepository.findByRole(Role.SALESPERSON).stream()
                .map(this::toSummary)
                .toList();
    }

    public EmployeeSummaryResponse getSummary(UUID userId) {
        return toSummary(getUser(userId));
    }

    public ClosingPreviewResponse getInventoryAccountability(UUID userId) {
        Location location = userService
                .findActiveLocation(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "No location assigned to this employee"));
        return closingService.preview(location.getId());
    }

    public List<SaleResponse> getSalesHistory(UUID userId) {
        return saleService.findAll(null, userId);
    }

    public EmployeePerformanceResponse getPerformance(UUID userId, Instant from, Instant to) {
        List<Sale> sales = saleRepository.findCompletedByUserInRange(
                userId, DateRanges.orPast(from), DateRanges.orFuture(to));

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

        Map<String, ProductAccumulator> byVariant = new LinkedHashMap<>();
        Map<java.time.LocalDate, DailyAccumulator> byDay = new LinkedHashMap<>();
        for (Sale sale : sales) {
            java.time.LocalDate day = sale.getSaleDate().atZone(ZoneOffset.UTC).toLocalDate();
            DailyAccumulator dayAcc = byDay.computeIfAbsent(day, d -> new DailyAccumulator());
            dayAcc.revenue = dayAcc.revenue.add(sale.getTotalAmount());
            dayAcc.transactions++;

            for (SaleItem item : sale.getItems()) {
                String key = item.getProductVariant().getId().toString();
                ProductAccumulator acc = byVariant.computeIfAbsent(key, k -> new ProductAccumulator(item));
                acc.quantity = acc.quantity.add(item.getQuantity());
                acc.revenue = acc.revenue.add(item.getLineTotal());
            }
        }

        List<ProductSalesRow> bestSelling = byVariant.values().stream()
                .sorted(Comparator.comparing((ProductAccumulator a) -> a.quantity).reversed())
                .limit(5)
                .map(a -> new ProductSalesRow(a.productName, a.sku, a.colorName, a.quantity, a.revenue))
                .toList();

        List<DailyRevenueRow> dailyRevenue = byDay.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new DailyRevenueRow(e.getKey(), e.getValue().revenue, e.getValue().transactions))
                .toList();

        return new EmployeePerformanceResponse(
                totalRevenue, totalTransactions, average, revenueByMethod, bestSelling, dailyRevenue);
    }

    public Page<StockMovementResponse> getStockMovements(UUID userId, Pageable pageable) {
        return stockMovementRepository
                .findByPerformedByUserId(userId, pageable)
                .map(m -> new StockMovementResponse(
                        m.getId(),
                        m.getLocation().getId(),
                        m.getLocation().getName(),
                        m.getProductVariant().getId(),
                        m.getProductVariant().getProduct().getName(),
                        m.getProductVariant().getSku(),
                        m.getMovementType(),
                        m.getQuantityDelta(),
                        m.getUnitCost(),
                        m.getReferenceType(),
                        m.getReferenceId(),
                        m.getPerformedByUserId(),
                        m.getNote(),
                        m.getCreatedAt()));
    }

    public Page<AuditLogResponse> getActivities(UUID userId, Pageable pageable) {
        return auditLogService.search(userId, null, null, null, null, null, null, pageable);
    }

    public List<EmployeeComparisonRow> getPerformanceComparison() {
        return userRepository.findByRole(Role.SALESPERSON).stream()
                .map(user -> {
                    BigDecimal revenue = nz(saleRepository.sumRevenueByUser(user.getId(), DateRanges.FAR_PAST, DateRanges.FAR_FUTURE));
                    long transactions = saleRepository.countCompletedByUser(user.getId(), DateRanges.FAR_PAST, DateRanges.FAR_FUTURE);
                    BigDecimal qtySold = nz(saleRepository.findCompletedByUserInRange(user.getId(), DateRanges.FAR_PAST, DateRanges.FAR_FUTURE)
                            .stream()
                            .flatMap(s -> s.getItems().stream())
                            .map(SaleItem::getQuantity)
                            .reduce(BigDecimal.ZERO, BigDecimal::add));
                    BigDecimal average = transactions == 0
                            ? BigDecimal.ZERO
                            : revenue.divide(BigDecimal.valueOf(transactions), 2, RoundingMode.HALF_UP);
                    long pendingReturns = returnRepository.countByProcessedByAndStatus(
                            user.getId(), ApprovalStatus.PENDING);
                    long discrepancies = dailyClosingRepository.countDiscrepanciesByUser(user.getId());
                    String locationName = userService
                            .findActiveLocation(user.getId())
                            .map(Location::getName)
                            .orElse(null);
                    return new EmployeeComparisonRow(
                            user.getId(),
                            user.getUsername(),
                            user.getFullName(),
                            locationName,
                            revenue,
                            transactions,
                            qtySold,
                            average,
                            pendingReturns,
                            discrepancies);
                })
                .toList();
    }

    private EmployeeSummaryResponse toSummary(User user) {
        Location location = userService.findActiveLocation(user.getId()).orElse(null);
        BigDecimal received = nz(stockMovementRepository.sumReceivedQuantityByUser(user.getId()));
        BigDecimal sold = nz(saleRepository.findCompletedByUserInRange(user.getId(), DateRanges.FAR_PAST, DateRanges.FAR_FUTURE).stream()
                .flatMap(s -> s.getItems().stream())
                .map(SaleItem::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        BigDecimal returned = nz(returnRepository.sumApprovedReturnedQuantityByUser(user.getId()));
        BigDecimal currentStock = location == null ? BigDecimal.ZERO : nz(
                inventoryBalanceRepository.sumQuantityByLocation(location.getId()));
        BigDecimal revenue = nz(saleRepository.sumRevenueByUser(user.getId(), DateRanges.FAR_PAST, DateRanges.FAR_FUTURE));
        long transactions = saleRepository.countCompletedByUser(user.getId(), DateRanges.FAR_PAST, DateRanges.FAR_FUTURE);
        long pendingReturns = returnRepository.countByProcessedByAndStatus(user.getId(), ApprovalStatus.PENDING);
        long pendingAdjustments =
                stockAdjustmentRepository.countByRequestedByAndStatus(user.getId(), ApprovalStatus.PENDING);
        Instant lastActivityLogAt = auditLogService.findLastActivity(user.getId());

        return new EmployeeSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                location != null ? location.getId() : null,
                location != null ? location.getName() : null,
                user.isActive(),
                user.getLastLoginAt(),
                user.getLastActivityAt(),
                lastActivityLogAt,
                received,
                sold,
                returned,
                currentStock,
                revenue,
                transactions,
                pendingReturns,
                pendingAdjustments);
    }

    private User getUser(UUID id) {
        return userRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found: " + id));
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static final class ProductAccumulator {
        final String productName;
        final String sku;
        final String colorName;
        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal revenue = BigDecimal.ZERO;

        ProductAccumulator(SaleItem item) {
            this.productName = item.getProductVariant().getProduct().getName();
            this.sku = item.getProductVariant().getSku();
            this.colorName = item.getProductVariant().getColorName();
        }
    }

    private static final class DailyAccumulator {
        BigDecimal revenue = BigDecimal.ZERO;
        long transactions = 0;
    }
}
