package com.michias.threadims.closing;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DailyClosingRepository extends JpaRepository<DailyClosing, UUID> {

    @Query(
            "select c from DailyClosing c where c.location.id = :locationId order by c.periodEnd desc limit 1")
    Optional<DailyClosing> findLatestForLocation(@Param("locationId") UUID locationId);

    @EntityGraph(attributePaths = {"items", "items.productVariant", "items.productVariant.product"})
    @Query(
            "select c from DailyClosing c where (:locationId is null or c.location.id = :locationId)"
                    + " order by c.periodEnd desc")
    List<DailyClosing> search(@Param("locationId") UUID locationId);

    @EntityGraph(attributePaths = {"items", "items.productVariant", "items.productVariant.product"})
    @Query("select c from DailyClosing c where c.id = :id")
    Optional<DailyClosing> findWithItemsById(@Param("id") UUID id);

    @Query(
            "select count(i) from DailyClosingItem i"
                    + " where i.closing.submittedBy = :userId and i.discrepancyQty <> 0")
    long countDiscrepanciesByUser(@Param("userId") UUID userId);
}
