/**
 * Stock transfers between locations: create (draft) → dispatch (deducts
 * source stock) → receive, with support for partial receiving across
 * multiple calls and a close step that locks in any discrepancy.
 */
package com.michias.threadims.transfer;
