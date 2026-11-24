/**
 * Inventory ledger: per-location stock balances and the immutable stock
 * movement history that drives them, plus the admin-approved stock
 * adjustment workflow. {@link com.michias.threadims.inventory.InventoryService#applyMovement}
 * is the single entry point every other module uses to change stock.
 */
package com.michias.threadims.inventory;
