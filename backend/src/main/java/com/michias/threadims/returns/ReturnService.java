package com.michias.threadims.returns;

import com.michias.threadims.common.ApprovalStatus;
import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.inventory.InventoryService;
import com.michias.threadims.inventory.StockMovementCommand;
import com.michias.threadims.inventory.StockMovementType;
import com.michias.threadims.returns.dto.ReturnCreateRequest;
import com.michias.threadims.returns.dto.ReturnItemRequest;
import com.michias.threadims.returns.dto.ReturnItemResponse;
import com.michias.threadims.returns.dto.ReturnResponse;
import com.michias.threadims.sale.Sale;
import com.michias.threadims.sale.SaleItem;
import com.michias.threadims.sale.SaleRepository;
import java.math.BigDecimal;
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
public class ReturnService {

    private final ReturnRepository returnRepository;
    private final SaleRepository saleRepository;
    private final InventoryService inventoryService;

    public ReturnService(
            ReturnRepository returnRepository, SaleRepository saleRepository, InventoryService inventoryService) {
        this.returnRepository = returnRepository;
        this.saleRepository = saleRepository;
        this.inventoryService = inventoryService;
    }

    public ReturnResponse create(ReturnCreateRequest request, UUID processedByUserId) {
        Sale sale = saleRepository
                .findWithDetailsById(request.saleId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sale not found: " + request.saleId()));

        Map<UUID, SaleItem> saleItemsById =
                sale.getItems().stream().collect(Collectors.toMap(SaleItem::getId, Function.identity()));

        Return returnRequest = new Return();
        returnRequest.setOriginalSale(sale);
        returnRequest.setProcessedBy(processedByUserId);
        returnRequest.setStatus(ApprovalStatus.PENDING);

        for (ReturnItemRequest itemRequest : request.items()) {
            SaleItem saleItem = saleItemsById.get(itemRequest.saleItemId());
            if (saleItem == null) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST, "Sale item not found on this sale: " + itemRequest.saleItemId());
            }
            if (itemRequest.quantity().compareTo(saleItem.getQuantity()) > 0) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Return quantity exceeds quantity sold for " + saleItem.getProductVariant().getSku());
            }
            ReturnItem item = new ReturnItem();
            item.setReturnRequest(returnRequest);
            item.setSaleItem(saleItem);
            item.setQuantity(itemRequest.quantity());
            item.setCondition(itemRequest.condition());
            returnRequest.getItems().add(item);
        }

        return toResponse(returnRepository.save(returnRequest));
    }

    public ReturnResponse approve(UUID returnId, UUID approvedByUserId) {
        Return returnRequest = getWithItems(returnId);
        if (returnRequest.getStatus() != ApprovalStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Return is already " + returnRequest.getStatus());
        }

        for (ReturnItem item : returnRequest.getItems()) {
            SaleItem saleItem = item.getSaleItem();
            BigDecimal alreadyReturned = returnRepository.sumApprovedReturnedQuantity(saleItem.getId());
            BigDecimal remaining = saleItem.getQuantity().subtract(alreadyReturned);
            if (item.getQuantity().compareTo(remaining) > 0) {
                throw new ApiException(
                        HttpStatus.CONFLICT,
                        "Only " + remaining + " of " + saleItem.getProductVariant().getSku()
                                + " remains returnable");
            }
            if (item.getCondition() == ReturnCondition.SELLABLE) {
                inventoryService.applyMovement(new StockMovementCommand(
                        saleItem.getProductVariant().getId(),
                        returnRequest.getOriginalSale().getLocation().getId(),
                        StockMovementType.RETURN_SELLABLE,
                        item.getQuantity(),
                        null,
                        "Return",
                        returnRequest.getId(),
                        approvedByUserId,
                        "Sellable return against " + returnRequest.getOriginalSale().getSaleNumber()));
            }
            // DAMAGED items are not restocked — the approved ReturnItem row itself is the
            // permanent record; no stock_movement exists because no balance changes.
        }

        returnRequest.setStatus(ApprovalStatus.APPROVED);
        returnRequest.setApprovedBy(approvedByUserId);
        return toResponse(returnRepository.save(returnRequest));
    }

    public ReturnResponse reject(UUID returnId, UUID decidedByUserId) {
        Return returnRequest = getWithItems(returnId);
        if (returnRequest.getStatus() != ApprovalStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Return is already " + returnRequest.getStatus());
        }
        returnRequest.setStatus(ApprovalStatus.REJECTED);
        returnRequest.setApprovedBy(decidedByUserId);
        return toResponse(returnRepository.save(returnRequest));
    }

    @Transactional(readOnly = true)
    public List<ReturnResponse> findAll(UUID locationId, ApprovalStatus status) {
        return returnRepository.search(locationId, status).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Return getWithItems(UUID id) {
        return returnRepository
                .findWithItemsById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Return not found: " + id));
    }

    @Transactional(readOnly = true)
    public ReturnResponse getResponseById(UUID id) {
        return toResponse(getWithItems(id));
    }

    private ReturnResponse toResponse(Return returnRequest) {
        List<ReturnItemResponse> items =
                returnRequest.getItems().stream().map(this::toItemResponse).toList();
        Sale sale = returnRequest.getOriginalSale();
        return new ReturnResponse(
                returnRequest.getId(),
                sale.getId(),
                sale.getSaleNumber(),
                sale.getLocation().getId(),
                sale.getLocation().getName(),
                returnRequest.getProcessedBy(),
                returnRequest.getApprovedBy(),
                returnRequest.getStatus(),
                returnRequest.getReturnDate(),
                items);
    }

    private ReturnItemResponse toItemResponse(ReturnItem item) {
        SaleItem saleItem = item.getSaleItem();
        return new ReturnItemResponse(
                item.getId(),
                saleItem.getId(),
                saleItem.getProductVariant().getProduct().getName(),
                saleItem.getProductVariant().getSku(),
                saleItem.getProductVariant().getColorName(),
                item.getQuantity(),
                item.getCondition());
    }
}
