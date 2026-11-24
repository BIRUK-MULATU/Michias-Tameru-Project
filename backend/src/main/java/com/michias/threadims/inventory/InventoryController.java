package com.michias.threadims.inventory;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.inventory.dto.InventoryBalanceResponse;
import com.michias.threadims.inventory.dto.StockMovementResponse;
import com.michias.threadims.security.LocationAccessGuard;
import com.michias.threadims.security.UserPrincipal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;
    private final LocationAccessGuard locationAccessGuard;

    public InventoryController(InventoryService inventoryService, LocationAccessGuard locationAccessGuard) {
        this.inventoryService = inventoryService;
        this.locationAccessGuard = locationAccessGuard;
    }

    @GetMapping
    public ApiResponse<List<InventoryBalanceResponse>> balances(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) String search) {
        UUID resolvedLocationId = requireLocation(locationAccessGuard.resolve(principal, locationId));
        return ApiResponse.ok(inventoryService.findBalances(resolvedLocationId, search));
    }

    @GetMapping("/movements")
    public ApiResponse<Page<StockMovementResponse>> movements(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) UUID productVariantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID resolvedLocationId = requireLocation(locationAccessGuard.resolve(principal, locationId));
        return ApiResponse.ok(
                inventoryService.findMovements(resolvedLocationId, productVariantId, PageRequest.of(page, size)));
    }

    private UUID requireLocation(UUID locationId) {
        if (locationId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "locationId is required");
        }
        return locationId;
    }
}
