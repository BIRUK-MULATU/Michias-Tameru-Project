package com.michias.threadims.purchase;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PurchaseRepository extends JpaRepository<Purchase, UUID> {

    @EntityGraph(attributePaths = {"items", "items.productVariant", "items.productVariant.product"})
    @Query(
            """
            select p from Purchase p
            where (:locationId is null or p.location.id = :locationId)
                and (:status is null or p.status = :status)
            order by p.purchaseDate desc
            """)
    List<Purchase> search(@Param("locationId") UUID locationId, @Param("status") PurchaseStatus status);

    @EntityGraph(attributePaths = {"items", "items.productVariant", "items.productVariant.product"})
    @Query("select p from Purchase p where p.id = :id")
    Optional<Purchase> findWithItemsById(@Param("id") UUID id);
}
