package com.michias.threadims.transfer;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockTransferRepository extends JpaRepository<StockTransfer, UUID> {

    @EntityGraph(attributePaths = {"items", "items.productVariant", "items.productVariant.product"})
    @Query(
            """
            select t from StockTransfer t
            where (:locationId is null or t.fromLocation.id = :locationId or t.toLocation.id = :locationId)
                and (:status is null or t.status = :status)
            order by t.createdAt desc
            """)
    List<StockTransfer> search(@Param("locationId") UUID locationId, @Param("status") TransferStatus status);

    @EntityGraph(attributePaths = {"items", "items.productVariant", "items.productVariant.product"})
    @Query("select t from StockTransfer t where t.id = :id")
    Optional<StockTransfer> findWithItemsById(@Param("id") UUID id);
}
