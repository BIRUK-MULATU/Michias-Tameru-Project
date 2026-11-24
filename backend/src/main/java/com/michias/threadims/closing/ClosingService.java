package com.michias.threadims.closing;

import com.michias.threadims.closing.dto.ClosingCountedItem;
import com.michias.threadims.closing.dto.ClosingItemPreview;
import com.michias.threadims.closing.dto.ClosingItemResponse;
import com.michias.threadims.closing.dto.ClosingPreviewResponse;
import com.michias.threadims.closing.dto.ClosingResponse;
import com.michias.threadims.closing.dto.ClosingSubmitRequest;
import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.inventory.InventoryBalanceRepository;
import com.michias.threadims.inventory.StockMovement;
import com.michias.threadims.inventory.StockMovementRepository;
import com.michias.threadims.inventory.StockMovementType;
import com.michias.threadims.location.Location;
import com.michias.threadims.location.LocationRepository;
import com.michias.threadims.product.ProductVariant;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ClosingService {

    private static final Set<StockMovementType> RECEIVED_TYPES =
            Set.of(StockMovementType.PURCHASE_RECEIPT, StockMovementType.TRANSFER_RECEIPT);
    private static final Set<StockMovementType> SOLD_TYPES =
            Set.of(StockMovementType.SALE, StockMovementType.SALE_REVERSAL);
    private static final Set<StockMovementType> ADJUSTMENT_TYPES =
            Set.of(StockMovementType.ADJUSTMENT_INCREASE, StockMovementType.ADJUSTMENT_DECREASE);

    private final DailyClosingRepository closingRepository;
    private final LocationRepository locationRepository;
    private final InventoryBalanceRepository inventoryBalanceRepository;
    private final StockMovementRepository stockMovementRepository;

    public ClosingService(
            DailyClosingRepository closingRepository,
            LocationRepository locationRepository,
            InventoryBalanceRepository inventoryBalanceRepository,
            StockMovementRepository stockMovementRepository) {
        this.closingRepository = closingRepository;
        this.locationRepository = locationRepository;
        this.inventoryBalanceRepository = inventoryBalanceRepository;
        this.stockMovementRepository = stockMovementRepository;
    }

    @Transactional(readOnly = true)
    public ClosingPreviewResponse preview(UUID locationId) {
        Location location = getLocation(locationId);
        Instant periodStart = resolvePeriodStart(locationId, location);
        Instant periodEnd = Instant.now();

        List<ClosingItemPreview> items = computeBreakdown(locationId, periodStart, periodEnd).values().stream()
                .toList();
        return new ClosingPreviewResponse(locationId, location.getName(), periodStart, periodEnd, items);
    }

    public ClosingResponse submit(ClosingSubmitRequest request, UUID locationId, UUID submittedByUserId) {
        Location location = getLocation(locationId);
        Instant periodStart = resolvePeriodStart(locationId, location);
        Instant periodEnd = Instant.now();

        Map<UUID, Breakdown> breakdowns = computeBreakdownInternal(locationId, periodStart, periodEnd);
        Map<UUID, BigDecimal> countedByVariant = request.items().stream()
                .collect(Collectors.toMap(ClosingCountedItem::productVariantId, ClosingCountedItem::countedQty));

        DailyClosing closing = new DailyClosing();
        closing.setLocation(location);
        closing.setSubmittedBy(submittedByUserId);
        closing.setPeriodStart(periodStart);
        closing.setPeriodEnd(periodEnd);
        closing.setStatus(ClosingStatus.SUBMITTED);

        for (Map.Entry<UUID, BigDecimal> entry : countedByVariant.entrySet()) {
            Breakdown breakdown = breakdowns.get(entry.getKey());
            if (breakdown == null) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST, "No stock history for product variant " + entry.getKey()
                                + " at this location");
            }
            DailyClosingItem item = new DailyClosingItem();
            item.setClosing(closing);
            item.setProductVariant(breakdown.variant());
            item.setOpeningQty(breakdown.opening());
            item.setReceivedQty(breakdown.received());
            item.setSoldQty(breakdown.sold());
            item.setSellableReturnQty(breakdown.sellableReturn());
            item.setApprovedAdjustmentQty(breakdown.approvedAdjustment());
            item.setExpectedQty(breakdown.expected());
            item.setCountedQty(entry.getValue());
            item.setDiscrepancyQty(entry.getValue().subtract(breakdown.expected()));
            closing.getItems().add(item);
        }

        return toResponse(closingRepository.save(closing));
    }

    public ClosingResponse review(UUID closingId, UUID reviewedByUserId) {
        DailyClosing closing = getWithItems(closingId);
        if (closing.getStatus() != ClosingStatus.SUBMITTED) {
            throw new ApiException(HttpStatus.CONFLICT, "Closing is already reviewed");
        }
        closing.setStatus(ClosingStatus.REVIEWED);
        closing.setReviewedBy(reviewedByUserId);
        closing.setReviewedAt(Instant.now());
        return toResponse(closingRepository.save(closing));
    }

    @Transactional(readOnly = true)
    public List<ClosingResponse> findAll(UUID locationId) {
        return closingRepository.search(locationId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DailyClosing getWithItems(UUID id) {
        return closingRepository
                .findWithItemsById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Closing not found: " + id));
    }

    @Transactional(readOnly = true)
    public ClosingResponse getResponseById(UUID id) {
        return toResponse(getWithItems(id));
    }

    private Instant resolvePeriodStart(UUID locationId, Location location) {
        return closingRepository
                .findLatestForLocation(locationId)
                .map(DailyClosing::getPeriodEnd)
                .orElse(location.getCreatedAt());
    }

    private Map<UUID, ClosingItemPreview> computeBreakdown(UUID locationId, Instant periodStart, Instant periodEnd) {
        Map<UUID, ClosingItemPreview> result = new LinkedHashMap<>();
        computeBreakdownInternal(locationId, periodStart, periodEnd)
                .forEach((variantId, b) -> result.put(
                        variantId,
                        new ClosingItemPreview(
                                variantId,
                                b.variant().getProduct().getName(),
                                b.variant().getSku(),
                                b.variant().getColorName(),
                                b.opening(),
                                b.received(),
                                b.sold(),
                                b.sellableReturn(),
                                b.approvedAdjustment(),
                                b.expected())));
        return result;
    }

    private Map<UUID, Breakdown> computeBreakdownInternal(UUID locationId, Instant periodStart, Instant periodEnd) {
        List<ProductVariant> candidateVariants = inventoryBalanceRepository.findByLocation(locationId, "").stream()
                .map(balance -> balance.getProductVariant())
                .toList();

        List<StockMovement> history = stockMovementRepository.findByLocationIdAndCreatedAtBefore(locationId, periodEnd);
        Map<UUID, List<StockMovement>> byVariant =
                history.stream().collect(Collectors.groupingBy(m -> m.getProductVariant().getId()));

        Map<UUID, Breakdown> result = new LinkedHashMap<>();
        for (ProductVariant variant : candidateVariants) {
            List<StockMovement> movements = byVariant.getOrDefault(variant.getId(), List.of());

            BigDecimal opening = sumDeltas(movements, m -> m.getCreatedAt().isBefore(periodStart), null);
            List<StockMovement> inPeriod = movements.stream()
                    .filter(m -> !m.getCreatedAt().isBefore(periodStart) && m.getCreatedAt().isBefore(periodEnd))
                    .toList();

            BigDecimal received = sumDeltas(inPeriod, m -> true, RECEIVED_TYPES);
            BigDecimal soldNet = sumDeltas(inPeriod, m -> true, SOLD_TYPES).negate();
            BigDecimal sellableReturn = sumDeltas(inPeriod, m -> true, Set.of(StockMovementType.RETURN_SELLABLE));
            BigDecimal approvedAdjustment = sumDeltas(inPeriod, m -> true, ADJUSTMENT_TYPES);
            BigDecimal totalPeriodDelta = inPeriod.stream()
                    .map(StockMovement::getQuantityDelta)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal expected = opening.add(totalPeriodDelta);

            result.put(
                    variant.getId(),
                    new Breakdown(variant, opening, received, soldNet, sellableReturn, approvedAdjustment, expected));
        }
        return result;
    }

    private BigDecimal sumDeltas(
            List<StockMovement> movements, java.util.function.Predicate<StockMovement> filter, Set<StockMovementType> types) {
        return movements.stream()
                .filter(filter)
                .filter(m -> types == null || types.contains(m.getMovementType()))
                .map(StockMovement::getQuantityDelta)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Location getLocation(UUID id) {
        return locationRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Location not found: " + id));
    }

    private ClosingResponse toResponse(DailyClosing closing) {
        List<ClosingItemResponse> items = closing.getItems().stream()
                .map(item -> new ClosingItemResponse(
                        item.getProductVariant().getId(),
                        item.getProductVariant().getProduct().getName(),
                        item.getProductVariant().getSku(),
                        item.getProductVariant().getColorName(),
                        item.getOpeningQty(),
                        item.getReceivedQty(),
                        item.getSoldQty(),
                        item.getSellableReturnQty(),
                        item.getApprovedAdjustmentQty(),
                        item.getExpectedQty(),
                        item.getCountedQty(),
                        item.getDiscrepancyQty()))
                .toList();
        return new ClosingResponse(
                closing.getId(),
                closing.getLocation().getId(),
                closing.getLocation().getName(),
                closing.getSubmittedBy(),
                closing.getPeriodStart(),
                closing.getPeriodEnd(),
                closing.getStatus(),
                closing.getReviewedBy(),
                closing.getReviewedAt(),
                items);
    }

    private record Breakdown(
            ProductVariant variant,
            BigDecimal opening,
            BigDecimal received,
            BigDecimal sold,
            BigDecimal sellableReturn,
            BigDecimal approvedAdjustment,
            BigDecimal expected) {}
}
