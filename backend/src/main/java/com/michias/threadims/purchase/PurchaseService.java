package com.michias.threadims.purchase;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.inventory.InventoryService;
import com.michias.threadims.inventory.StockMovementCommand;
import com.michias.threadims.inventory.StockMovementType;
import com.michias.threadims.location.Location;
import com.michias.threadims.location.LocationRepository;
import com.michias.threadims.product.ProductVariant;
import com.michias.threadims.product.ProductVariantRepository;
import com.michias.threadims.purchase.dto.PurchaseCreateRequest;
import com.michias.threadims.purchase.dto.PurchaseItemRequest;
import com.michias.threadims.purchase.dto.PurchaseItemResponse;
import com.michias.threadims.purchase.dto.PurchaseResponse;
import com.michias.threadims.supplier.Supplier;
import com.michias.threadims.supplier.SupplierRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final SupplierRepository supplierRepository;
    private final LocationRepository locationRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryService inventoryService;

    public PurchaseService(
            PurchaseRepository purchaseRepository,
            SupplierRepository supplierRepository,
            LocationRepository locationRepository,
            ProductVariantRepository productVariantRepository,
            InventoryService inventoryService) {
        this.purchaseRepository = purchaseRepository;
        this.supplierRepository = supplierRepository;
        this.locationRepository = locationRepository;
        this.productVariantRepository = productVariantRepository;
        this.inventoryService = inventoryService;
    }

    public PurchaseResponse create(PurchaseCreateRequest request, UUID createdByUserId) {
        Supplier supplier = supplierRepository
                .findById(request.supplierId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Supplier not found"));
        Location location = locationRepository
                .findById(request.locationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Location not found"));

        Purchase purchase = new Purchase();
        purchase.setSupplier(supplier);
        purchase.setLocation(location);
        purchase.setCreatedBy(createdByUserId);
        purchase.setStatus(PurchaseStatus.DRAFT);

        BigDecimal total = BigDecimal.ZERO;
        for (PurchaseItemRequest itemRequest : request.items()) {
            ProductVariant variant = productVariantRepository
                    .findById(itemRequest.productVariantId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product variant not found"));

            PurchaseItem item = new PurchaseItem();
            item.setPurchase(purchase);
            item.setProductVariant(variant);
            item.setQuantity(itemRequest.quantity());
            item.setUnitCost(itemRequest.unitCost());
            BigDecimal lineTotal = itemRequest.quantity().multiply(itemRequest.unitCost());
            item.setLineTotal(lineTotal);
            purchase.getItems().add(item);
            total = total.add(lineTotal);
        }
        purchase.setTotalAmount(total);

        return toResponse(purchaseRepository.save(purchase));
    }

    public PurchaseResponse receive(UUID purchaseId, UUID receivedByUserId) {
        Purchase purchase = getWithItems(purchaseId);
        if (purchase.getStatus() != PurchaseStatus.DRAFT) {
            throw new ApiException(HttpStatus.CONFLICT, "Purchase is not in DRAFT status");
        }

        for (PurchaseItem item : purchase.getItems()) {
            inventoryService.applyMovement(new StockMovementCommand(
                    item.getProductVariant().getId(),
                    purchase.getLocation().getId(),
                    StockMovementType.PURCHASE_RECEIPT,
                    item.getQuantity(),
                    item.getUnitCost(),
                    "Purchase",
                    purchase.getId(),
                    receivedByUserId,
                    "Purchase from " + purchase.getSupplier().getName()));
        }

        purchase.setStatus(PurchaseStatus.RECEIVED);
        purchase.setReceivedBy(receivedByUserId);
        purchase.setReceivedAt(Instant.now());
        return toResponse(purchaseRepository.save(purchase));
    }

    public PurchaseResponse cancel(UUID purchaseId) {
        Purchase purchase = getWithItems(purchaseId);
        if (purchase.getStatus() != PurchaseStatus.DRAFT) {
            throw new ApiException(HttpStatus.CONFLICT, "Only a DRAFT purchase can be cancelled");
        }
        purchase.setStatus(PurchaseStatus.CANCELLED);
        return toResponse(purchaseRepository.save(purchase));
    }

    @Transactional(readOnly = true)
    public List<PurchaseResponse> findAll(UUID locationId, PurchaseStatus status) {
        return purchaseRepository.search(locationId, status).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Purchase getWithItems(UUID id) {
        return purchaseRepository
                .findWithItemsById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Purchase not found: " + id));
    }

    @Transactional(readOnly = true)
    public PurchaseResponse getResponseById(UUID id) {
        return toResponse(getWithItems(id));
    }

    private PurchaseResponse toResponse(Purchase purchase) {
        List<PurchaseItemResponse> items =
                purchase.getItems().stream().map(this::toItemResponse).toList();
        return new PurchaseResponse(
                purchase.getId(),
                purchase.getSupplier().getId(),
                purchase.getSupplier().getName(),
                purchase.getLocation().getId(),
                purchase.getLocation().getName(),
                purchase.getPurchaseDate(),
                purchase.getStatus(),
                purchase.getTotalAmount(),
                purchase.getCreatedBy(),
                purchase.getReceivedBy(),
                purchase.getReceivedAt(),
                items);
    }

    private PurchaseItemResponse toItemResponse(PurchaseItem item) {
        ProductVariant variant = item.getProductVariant();
        return new PurchaseItemResponse(
                item.getId(),
                variant.getId(),
                variant.getProduct().getName(),
                variant.getSku(),
                variant.getColorName(),
                item.getQuantity(),
                item.getUnitCost(),
                item.getLineTotal());
    }
}
