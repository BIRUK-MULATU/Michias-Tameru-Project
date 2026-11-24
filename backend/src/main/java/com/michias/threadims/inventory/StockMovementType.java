package com.michias.threadims.inventory;

public enum StockMovementType {
    PURCHASE_RECEIPT,
    TRANSFER_DISPATCH,
    TRANSFER_RECEIPT,
    SALE,
    SALE_REVERSAL,
    RETURN_SELLABLE,
    DAMAGE,
    ADJUSTMENT_INCREASE,
    ADJUSTMENT_DECREASE,
    RECONCILIATION_VARIANCE;

    /**
     * Only true cost-bearing receipts recalculate the location's weighted-average
     * cost. A manual adjustment has no purchase price behind it, so it values
     * the quantity change at the balance's current average cost instead of
     * letting a guessed cost skew COGS.
     */
    public boolean isReceipt() {
        return this == PURCHASE_RECEIPT || this == TRANSFER_RECEIPT;
    }
}
