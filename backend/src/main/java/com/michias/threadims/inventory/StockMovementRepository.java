package com.michias.threadims.inventory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    @Query(
            """
            select m from StockMovement m
            join fetch m.productVariant v
            join fetch v.product p
            join fetch m.location l
            where (:locationId is null or l.id = :locationId)
                and (:productVariantId is null or v.id = :productVariantId)
            order by m.createdAt desc
            """)
    Page<StockMovement> search(
            @Param("locationId") UUID locationId,
            @Param("productVariantId") UUID productVariantId,
            Pageable pageable);

    // Used to compute a daily closing: everything up to periodEnd, so the caller
    // can derive both the opening balance (sum before periodStart) and the
    // period's own movement breakdown from one query.
    List<StockMovement> findByLocationIdAndCreatedAtBefore(UUID locationId, Instant periodEnd);

    @Query(
            "select coalesce(sum(m.quantityDelta), 0) from StockMovement m"
                    + " where m.performedByUserId = :userId"
                    + " and m.movementType in ('TRANSFER_RECEIPT', 'PURCHASE_RECEIPT')")
    BigDecimal sumReceivedQuantityByUser(@Param("userId") UUID userId);

    @Query(
            """
            select m from StockMovement m
            join fetch m.productVariant v
            join fetch v.product p
            join fetch m.location l
            where m.performedByUserId = :userId
            order by m.createdAt desc
            """)
    Page<StockMovement> findByPerformedByUserId(@Param("userId") UUID userId, Pageable pageable);
}
