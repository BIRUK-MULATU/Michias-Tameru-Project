package com.michias.threadims.transfer;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.inventory.InventoryService;
import com.michias.threadims.inventory.StockMovement;
import com.michias.threadims.inventory.StockMovementCommand;
import com.michias.threadims.inventory.StockMovementType;
import com.michias.threadims.location.Location;
import com.michias.threadims.location.LocationRepository;
import com.michias.threadims.product.ProductVariant;
import com.michias.threadims.product.ProductVariantRepository;
import com.michias.threadims.transfer.dto.TransferCloseItemNote;
import com.michias.threadims.transfer.dto.TransferCloseRequest;
import com.michias.threadims.transfer.dto.TransferCreateRequest;
import com.michias.threadims.transfer.dto.TransferItemRequest;
import com.michias.threadims.transfer.dto.TransferItemResponse;
import com.michias.threadims.transfer.dto.TransferReceiveItemRequest;
import com.michias.threadims.transfer.dto.TransferReceiveRequest;
import com.michias.threadims.transfer.dto.TransferResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TransferService {

    private final StockTransferRepository transferRepository;
    private final LocationRepository locationRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryService inventoryService;

    public TransferService(
            StockTransferRepository transferRepository,
            LocationRepository locationRepository,
            ProductVariantRepository productVariantRepository,
            InventoryService inventoryService) {
        this.transferRepository = transferRepository;
        this.locationRepository = locationRepository;
        this.productVariantRepository = productVariantRepository;
        this.inventoryService = inventoryService;
    }

    public TransferResponse create(TransferCreateRequest request, UUID createdByUserId) {
        if (request.fromLocationId().equals(request.toLocationId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Source and destination locations must differ");
        }
        Location from = getLocation(request.fromLocationId());
        Location to = getLocation(request.toLocationId());

        StockTransfer transfer = new StockTransfer();
        transfer.setFromLocation(from);
        transfer.setToLocation(to);
        transfer.setCreatedBy(createdByUserId);
        transfer.setStatus(TransferStatus.DRAFT);

        for (TransferItemRequest itemRequest : request.items()) {
            StockTransferItem item = new StockTransferItem();
            item.setTransfer(transfer);
            item.setProductVariant(getVariant(itemRequest.productVariantId()));
            item.setQuantityDispatched(itemRequest.quantity());
            transfer.getItems().add(item);
        }
        return toResponse(transferRepository.save(transfer));
    }

    public TransferResponse dispatch(UUID transferId, UUID dispatchedByUserId) {
        StockTransfer transfer = getWithItems(transferId);
        if (transfer.getStatus() != TransferStatus.DRAFT) {
            throw new ApiException(HttpStatus.CONFLICT, "Transfer is not in DRAFT status");
        }

        for (StockTransferItem item : transfer.getItems()) {
            StockMovement movement = inventoryService.applyMovement(new StockMovementCommand(
                    item.getProductVariant().getId(),
                    transfer.getFromLocation().getId(),
                    StockMovementType.TRANSFER_DISPATCH,
                    item.getQuantityDispatched().negate(),
                    null,
                    "StockTransfer",
                    transfer.getId(),
                    dispatchedByUserId,
                    "Transfer dispatch to " + transfer.getToLocation().getName()));
            item.setUnitCostAtDispatch(movement.getUnitCost());
        }

        transfer.setStatus(TransferStatus.DISPATCHED);
        transfer.setDispatchedBy(dispatchedByUserId);
        transfer.setDispatchedAt(Instant.now());
        return toResponse(transferRepository.save(transfer));
    }

    public TransferResponse receive(UUID transferId, TransferReceiveRequest request, UUID receivedByUserId) {
        StockTransfer transfer = getWithItems(transferId);
        requireAwaitingReceipt(transfer);

        Map<UUID, StockTransferItem> itemsById = transfer.getItems().stream()
                .collect(Collectors.toMap(StockTransferItem::getId, Function.identity()));

        for (TransferReceiveItemRequest line : request.items()) {
            StockTransferItem item = itemsById.get(line.transferItemId());
            if (item == null) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST, "Transfer item not found on this transfer: " + line.transferItemId());
            }
            BigDecimal outstanding = item.outstandingQuantity();
            if (line.quantityReceived().compareTo(outstanding) > 0) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Cannot receive " + line.quantityReceived() + " — only " + outstanding
                                + " outstanding for " + item.getProductVariant().getSku());
            }

            inventoryService.applyMovement(new StockMovementCommand(
                    item.getProductVariant().getId(),
                    transfer.getToLocation().getId(),
                    StockMovementType.TRANSFER_RECEIPT,
                    line.quantityReceived(),
                    item.getUnitCostAtDispatch(),
                    "StockTransfer",
                    transfer.getId(),
                    receivedByUserId,
                    "Transfer receipt from " + transfer.getFromLocation().getName()));
            item.setQuantityReceived(item.getQuantityReceived().add(line.quantityReceived()));
        }

        finalizeReceivingStatus(transfer, receivedByUserId);
        return toResponse(transferRepository.save(transfer));
    }

    public TransferResponse close(UUID transferId, TransferCloseRequest request, UUID closedByUserId) {
        StockTransfer transfer = getWithItems(transferId);
        requireAwaitingReceipt(transfer);

        Map<UUID, String> notesByItemId = request.items() == null
                ? Map.of()
                : request.items().stream()
                        .collect(Collectors.toMap(TransferCloseItemNote::transferItemId, this::noteOrBlank));

        for (StockTransferItem item : transfer.getItems()) {
            BigDecimal outstanding = item.outstandingQuantity();
            String note = notesByItemId.get(item.getId());
            if (outstanding.signum() > 0) {
                item.setDiscrepancyNote(note != null && !note.isBlank() ? note : "Short by " + outstanding);
            } else if (note != null && !note.isBlank()) {
                item.setDiscrepancyNote(note);
            }
        }

        transfer.setStatus(TransferStatus.RECEIVED);
        transfer.setReceivedBy(closedByUserId);
        transfer.setReceivedAt(Instant.now());
        return toResponse(transferRepository.save(transfer));
    }

    public TransferResponse cancel(UUID transferId) {
        StockTransfer transfer = getWithItems(transferId);
        if (transfer.getStatus() != TransferStatus.DRAFT) {
            throw new ApiException(HttpStatus.CONFLICT, "Only a DRAFT transfer can be cancelled");
        }
        transfer.setStatus(TransferStatus.CANCELLED);
        return toResponse(transferRepository.save(transfer));
    }

    @Transactional(readOnly = true)
    public List<TransferResponse> findAll(UUID locationId, TransferStatus status) {
        return transferRepository.search(locationId, status).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public StockTransfer getWithItems(UUID id) {
        return transferRepository
                .findWithItemsById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transfer not found: " + id));
    }

    @Transactional(readOnly = true)
    public TransferResponse getResponseById(UUID id) {
        return toResponse(getWithItems(id));
    }

    private void requireAwaitingReceipt(StockTransfer transfer) {
        if (transfer.getStatus() != TransferStatus.DISPATCHED && transfer.getStatus() != TransferStatus.PARTIALLY_RECEIVED) {
            throw new ApiException(HttpStatus.CONFLICT, "Transfer is not awaiting receipt: " + transfer.getStatus());
        }
    }

    private void finalizeReceivingStatus(StockTransfer transfer, UUID receivedByUserId) {
        boolean allComplete =
                transfer.getItems().stream().allMatch(item -> item.outstandingQuantity().signum() == 0);
        if (allComplete) {
            transfer.setStatus(TransferStatus.RECEIVED);
            transfer.setReceivedBy(receivedByUserId);
            transfer.setReceivedAt(Instant.now());
        } else {
            transfer.setStatus(TransferStatus.PARTIALLY_RECEIVED);
        }
    }

    private String noteOrBlank(TransferCloseItemNote note) {
        return note.discrepancyNote() == null ? "" : note.discrepancyNote();
    }

    private Location getLocation(UUID id) {
        return locationRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Location not found: " + id));
    }

    private ProductVariant getVariant(UUID id) {
        return productVariantRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product variant not found: " + id));
    }

    private TransferResponse toResponse(StockTransfer transfer) {
        List<TransferItemResponse> items =
                transfer.getItems().stream().map(this::toItemResponse).toList();
        return new TransferResponse(
                transfer.getId(),
                transfer.getFromLocation().getId(),
                transfer.getFromLocation().getName(),
                transfer.getToLocation().getId(),
                transfer.getToLocation().getName(),
                transfer.getStatus(),
                transfer.getCreatedBy(),
                transfer.getDispatchedBy(),
                transfer.getDispatchedAt(),
                transfer.getReceivedBy(),
                transfer.getReceivedAt(),
                transfer.getCreatedAt(),
                items);
    }

    private TransferItemResponse toItemResponse(StockTransferItem item) {
        ProductVariant variant = item.getProductVariant();
        return new TransferItemResponse(
                item.getId(),
                variant.getId(),
                variant.getProduct().getName(),
                variant.getSku(),
                variant.getColorName(),
                item.getQuantityDispatched(),
                item.getQuantityReceived(),
                item.outstandingQuantity(),
                item.getUnitCostAtDispatch(),
                item.getDiscrepancyNote());
    }
}
