package com.michias.threadims.product;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {

    boolean existsBySkuIgnoreCase(String sku);

    List<ProductVariant> findByProductId(UUID productId);

    @Query(
            """
            select v from ProductVariant v
            join v.product p
            where (:search = ''
                or lower(p.name) like lower(concat('%', :search, '%'))
                or lower(v.sku) like lower(concat('%', :search, '%'))
                or lower(v.colorName) like lower(concat('%', :search, '%')))
            order by p.name, v.colorName
            """)
    List<ProductVariant> search(@Param("search") String search);
}
