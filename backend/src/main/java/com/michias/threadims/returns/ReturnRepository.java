package com.michias.threadims.returns;

import com.michias.threadims.common.ApprovalStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReturnRepository extends JpaRepository<Return, UUID> {

    @EntityGraph(attributePaths = {
        "items", "items.saleItem", "items.saleItem.productVariant", "items.saleItem.productVariant.product",
        "originalSale"
    })
    @Query(
            """
            select r from Return r
            where (:locationId is null or r.originalSale.location.id = :locationId)
                and (:status is null or r.status = :status)
            order by r.returnDate desc
            """)
    List<Return> search(@Param("locationId") UUID locationId, @Param("status") ApprovalStatus status);

    @EntityGraph(attributePaths = {
        "items", "items.saleItem", "items.saleItem.productVariant", "items.saleItem.productVariant.product",
        "originalSale"
    })
    @Query("select r from Return r where r.id = :id")
    Optional<Return> findWithItemsById(@Param("id") UUID id);

    @Query(
            """
            select coalesce(sum(ri.quantity), 0) from ReturnItem ri
            where ri.saleItem.id = :saleItemId and ri.returnRequest.status = 'APPROVED'
            """)
    BigDecimal sumApprovedReturnedQuantity(@Param("saleItemId") UUID saleItemId);

    @Query(
            """
            select coalesce(sum(ri.quantity), 0) from ReturnItem ri
            where ri.returnRequest.processedBy = :userId and ri.returnRequest.status = 'APPROVED'
            """)
    BigDecimal sumApprovedReturnedQuantityByUser(@Param("userId") UUID userId);

    long countByProcessedByAndStatus(UUID processedBy, ApprovalStatus status);
}
