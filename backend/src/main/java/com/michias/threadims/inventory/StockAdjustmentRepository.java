package com.michias.threadims.inventory;

import com.michias.threadims.common.ApprovalStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, UUID> {

    @Query(
            "select a from StockAdjustment a where (:locationId is null or a.location.id = :locationId)"
                    + " order by a.createdAt desc")
    List<StockAdjustment> findByLocation(@Param("locationId") UUID locationId);

    long countByRequestedByAndStatus(UUID requestedBy, ApprovalStatus status);
}
