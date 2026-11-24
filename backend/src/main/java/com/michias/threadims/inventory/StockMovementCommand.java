package com.michias.threadims.inventory;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * The single entry point every module uses to touch inventory: purchases,
 * transfers, sales, returns and adjustments all build one of these and pass
 * it to {@link InventoryService#applyMovement}. Never mutate
 * {@link InventoryBalance} directly from another module.
 *
 * @param quantityDelta signed — positive adds stock, negative removes it
 * @param unitCost required only for {@link StockMovementType#isReceipt()} types;
 *     ignored otherwise (the ledger records the balance's current average cost)
 */
public record StockMovementCommand(
        UUID productVariantId,
        UUID locationId,
        StockMovementType movementType,
        BigDecimal quantityDelta,
        BigDecimal unitCost,
        String referenceType,
        UUID referenceId,
        UUID performedByUserId,
        String note) {
}
