package com.michias.threadims.inventory;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryBalanceRepository extends JpaRepository<InventoryBalance, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
            "select b from InventoryBalance b where b.location.id = :locationId"
                    + " and b.productVariant.id = :productVariantId")
    Optional<InventoryBalance> lockByLocationAndVariant(
            @Param("locationId") UUID locationId, @Param("productVariantId") UUID productVariantId);

    @Query(
            """
            select b from InventoryBalance b
            join fetch b.productVariant v
            join fetch v.product p
            where b.location.id = :locationId
                and (:search = ''
                    or lower(p.name) like lower(concat('%', :search, '%'))
                    or lower(v.sku) like lower(concat('%', :search, '%'))
                    or lower(v.colorName) like lower(concat('%', :search, '%')))
            order by p.name, v.colorName
            """)
    List<InventoryBalance> findByLocation(@Param("locationId") UUID locationId, @Param("search") String search);

    @Query("select coalesce(sum(b.quantity), 0) from InventoryBalance b where b.location.id = :locationId")
    BigDecimal sumQuantityByLocation(@Param("locationId") UUID locationId);
}
