/**
 * Daily stock reconciliation: expected quantity is derived directly from
 * the inventory ledger (opening balance + the period's movements), never
 * from a separately maintained running total, then compared against what
 * the salesperson physically counts.
 */
package com.michias.threadims.closing;
