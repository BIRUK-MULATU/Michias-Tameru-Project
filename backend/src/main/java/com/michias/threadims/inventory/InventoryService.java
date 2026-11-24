package com.michias.threadims.inventory;

import com.michias.threadims.common.ApprovalStatus;
import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.inventory.dto.InventoryBalanceResponse;
import com.michias.threadims.inventory.dto.StockAdjustmentRequestDto;
import com.michias.threadims.inventory.dto.StockAdjustmentResponse;
import com.michias.threadims.inventory.dto.StockMovementResponse;
import com.michias.threadims.location.Location;
import com.michias.threadims.location.LocationRepository;
import com.michias.threadims.product.ProductVariant;
import com.michias.threadims.product.ProductVariantRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class InventoryService {

    private static final int COST_SCALE = 4;
    private static final int QUANTITY_SCALE = 3;

    private final InventoryBalanceRepository inventoryBalanceRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final LocationRepository locationRepository;
    private final ProductVariantRepository productVariantRepository;

    public InventoryService(
            InventoryBalanceRepository inventoryBalanceRepository,
            StockMovementRepository stockMovementRepository,
            StockAdjustmentRepository stockAdjustmentRepository,
            LocationRepository locationRepository,
            ProductVariantRepository productVariantRepository) {
        this.inventoryBalanceRepository = inventoryBalanceRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.stockAdjustmentRepository = stockAdjustmentRepository;
        this.locationRepository = locationRepository;
        this.productVariantRepository = productVariantRepository;
    }

    /**
     * The single choke point for every stock-affecting operation. Row-locks the
     * balance, validates the result never goes negative, updates it, and
     * inserts the immutable ledger row — all in one transaction.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public StockMovement applyMovement(StockMovementCommand command) {
        InventoryBalance balance = lockOrCreateBalance(command.locationId(), command.productVariantId());

        BigDecimal newQuantity = balance.getQuantity().add(command.quantityDelta());
        if (newQuantity.signum() < 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Insufficient stock: location has " + balance.getQuantity() + ", requested change "
                            + command.quantityDelta());
        }

        BigDecimal movementUnitCost;
        if (command.movementType().isReceipt()) {
            BigDecimal unitCost = command.unitCost() != null ? command.unitCost() : BigDecimal.ZERO;
            balance.setAverageUnitCost(recalculateAverageCost(balance, command.quantityDelta(), unitCost, newQuantity));
            movementUnitCost = unitCost;
        } else {
            movementUnitCost = balance.getAverageUnitCost();
        }
        balance.setQuantity(newQuantity);
        inventoryBalanceRepository.save(balance);

        StockMovement movement = new StockMovement();
        movement.setProductVariant(balance.getProductVariant());
        movement.setLocation(balance.getLocation());
        movement.setMovementType(command.movementType());
        movement.setQuantityDelta(command.quantityDelta());
        movement.setUnitCost(movementUnitCost);
        movement.setReferenceType(command.referenceType());
        movement.setReferenceId(command.referenceId());
        movement.setPerformedByUserId(command.performedByUserId());
        movement.setNote(command.note());
        return stockMovementRepository.save(movement);
    }

    private BigDecimal recalculateAverageCost(
            InventoryBalance balance, BigDecimal receivedQty, BigDecimal receivedUnitCost, BigDecimal newQuantity) {
        if (newQuantity.signum() == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal existingValue = balance.getQuantity().multiply(balance.getAverageUnitCost());
        BigDecimal receivedValue = receivedQty.multiply(receivedUnitCost);
        return existingValue.add(receivedValue).divide(newQuantity, COST_SCALE, RoundingMode.HALF_UP);
    }

    private InventoryBalance lockOrCreateBalance(UUID locationId, UUID productVariantId) {
        return inventoryBalanceRepository
                .lockByLocationAndVariant(locationId, productVariantId)
                .orElseGet(() -> createZeroBalance(locationId, productVariantId));
    }

    private InventoryBalance createZeroBalance(UUID locationId, UUID productVariantId) {
        Location location = locationRepository
                .findById(locationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Location not found: " + locationId));
        ProductVariant variant = productVariantRepository
                .findById(productVariantId)
                .orElseThrow(
                        () -> new ApiException(HttpStatus.NOT_FOUND, "Product variant not found: " + productVariantId));

        InventoryBalance balance = new InventoryBalance();
        balance.setLocation(location);
        balance.setProductVariant(variant);
        balance.setQuantity(BigDecimal.ZERO.setScale(QUANTITY_SCALE));
        balance.setAverageUnitCost(BigDecimal.ZERO.setScale(COST_SCALE));
        try {
            inventoryBalanceRepository.saveAndFlush(balance);
            return balance;
        } catch (DataIntegrityViolationException raceLost) {
            // A concurrent transaction created the row first; lock and use theirs.
            return inventoryBalanceRepository
                    .lockByLocationAndVariant(locationId, productVariantId)
                    .orElseThrow(() -> raceLost);
        }
    }

    @Transactional(readOnly = true)
    public List<InventoryBalanceResponse> findBalances(UUID locationId, String search) {
        return inventoryBalanceRepository.findByLocation(locationId, search == null ? "" : search).stream()
                .map(this::toBalanceResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<StockMovementResponse> findMovements(UUID locationId, UUID productVariantId, Pageable pageable) {
        return stockMovementRepository
                .search(locationId, productVariantId, pageable)
                .map(this::toMovementResponse);
    }

    public StockAdjustmentResponse requestAdjustment(StockAdjustmentRequestDto request, UUID requestedByUserId) {
        Location location = locationRepository
                .findById(request.locationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Location not found"));
        ProductVariant variant = productVariantRepository
                .findById(request.productVariantId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product variant not found"));

        StockAdjustment adjustment = new StockAdjustment();
        adjustment.setLocation(location);
        adjustment.setProductVariant(variant);
        adjustment.setQuantityDelta(request.quantityDelta());
        adjustment.setReason(request.reason());
        adjustment.setRequestedBy(requestedByUserId);
        adjustment.setStatus(ApprovalStatus.PENDING);
        return toAdjustmentResponse(stockAdjustmentRepository.save(adjustment));
    }

    public StockAdjustmentResponse approveAdjustment(UUID id, UUID approvedByUserId) {
        StockAdjustment adjustment = getAdjustmentOrThrow(id);
        if (adjustment.getStatus() != ApprovalStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Adjustment is already " + adjustment.getStatus());
        }

        StockMovementType movementType = adjustment.getQuantityDelta().signum() >= 0
                ? StockMovementType.ADJUSTMENT_INCREASE
                : StockMovementType.ADJUSTMENT_DECREASE;

        applyMovement(new StockMovementCommand(
                adjustment.getProductVariant().getId(),
                adjustment.getLocation().getId(),
                movementType,
                adjustment.getQuantityDelta(),
                null,
                "StockAdjustment",
                adjustment.getId(),
                approvedByUserId,
                adjustment.getReason()));

        adjustment.setStatus(ApprovalStatus.APPROVED);
        adjustment.setApprovedBy(approvedByUserId);
        adjustment.setApprovedAt(Instant.now());
        return toAdjustmentResponse(stockAdjustmentRepository.save(adjustment));
    }

    public StockAdjustmentResponse rejectAdjustment(UUID id, UUID approvedByUserId) {
        StockAdjustment adjustment = getAdjustmentOrThrow(id);
        if (adjustment.getStatus() != ApprovalStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Adjustment is already " + adjustment.getStatus());
        }
        adjustment.setStatus(ApprovalStatus.REJECTED);
        adjustment.setApprovedBy(approvedByUserId);
        adjustment.setApprovedAt(Instant.now());
        return toAdjustmentResponse(stockAdjustmentRepository.save(adjustment));
    }

    @Transactional(readOnly = true)
    public List<StockAdjustmentResponse> findAdjustments(UUID locationId) {
        return stockAdjustmentRepository.findByLocation(locationId).stream()
                .map(this::toAdjustmentResponse)
                .toList();
    }

    private StockAdjustment getAdjustmentOrThrow(UUID id) {
        return stockAdjustmentRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Stock adjustment not found: " + id));
    }

    private InventoryBalanceResponse toBalanceResponse(InventoryBalance balance) {
        ProductVariant variant = balance.getProductVariant();
        boolean belowReorder = balance.getQuantity().compareTo(variant.getReorderLevel()) < 0;
        return new InventoryBalanceResponse(
                balance.getLocation().getId(),
                balance.getLocation().getName(),
                variant.getId(),
                variant.getProduct().getName(),
                variant.getSku(),
                variant.getColorName(),
                balance.getQuantity(),
                balance.getAverageUnitCost(),
                variant.getReorderLevel(),
                belowReorder);
    }

    private StockMovementResponse toMovementResponse(StockMovement movement) {
        ProductVariant variant = movement.getProductVariant();
        return new StockMovementResponse(
                movement.getId(),
                movement.getLocation().getId(),
                movement.getLocation().getName(),
                variant.getId(),
                variant.getProduct().getName(),
                variant.getSku(),
                movement.getMovementType(),
                movement.getQuantityDelta(),
                movement.getUnitCost(),
                movement.getReferenceType(),
                movement.getReferenceId(),
                movement.getPerformedByUserId(),
                movement.getNote(),
                movement.getCreatedAt());
    }

    private StockAdjustmentResponse toAdjustmentResponse(StockAdjustment adjustment) {
        return new StockAdjustmentResponse(
                adjustment.getId(),
                adjustment.getLocation().getId(),
                adjustment.getLocation().getName(),
                adjustment.getProductVariant().getId(),
                adjustment.getProductVariant().getProduct().getName(),
                adjustment.getProductVariant().getSku(),
                adjustment.getQuantityDelta(),
                adjustment.getReason(),
                adjustment.getRequestedBy(),
                adjustment.getStatus(),
                adjustment.getApprovedBy(),
                adjustment.getApprovedAt(),
                adjustment.getCreatedAt());
    }
}
