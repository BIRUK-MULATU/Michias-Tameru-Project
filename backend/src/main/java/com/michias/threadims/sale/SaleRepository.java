package com.michias.threadims.sale;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SaleRepository extends JpaRepository<Sale, UUID> {

    // Only one List ("bag") association can be join-fetched per query — Hibernate
    // rejects fetching items and payments together (MultipleBagFetchException).
    // Items are eagerly fetched here; payments lazy-load within the same
    // transaction when the response mapper reads them.
    @EntityGraph(attributePaths = {"items", "items.productVariant", "items.productVariant.product"})
    @Query(
            """
            select s from Sale s
            where (:locationId is null or s.location.id = :locationId)
                and (:salespersonUserId is null or s.salespersonUserId = :salespersonUserId)
            order by s.saleDate desc
            """)
    List<Sale> search(
            @Param("locationId") UUID locationId, @Param("salespersonUserId") UUID salespersonUserId);

    @EntityGraph(attributePaths = {"items", "items.productVariant", "items.productVariant.product"})
    @Query("select s from Sale s where s.id = :id")
    Optional<Sale> findWithDetailsById(@Param("id") UUID id);

    @Query(value = "select nextval('sale_number_seq')", nativeQuery = true)
    long nextSaleNumberSequence();

    // from/to must always be concrete (never null) — PostgreSQL cannot infer a
    // type for a bare null Instant parameter used only in an "is null" check,
    // and throws "could not determine data type of parameter". Callers
    // substitute sentinel unbounded dates instead of passing null.
    @Query(
            "select coalesce(sum(s.totalAmount), 0) from Sale s"
                    + " where s.salespersonUserId = :userId and s.status = 'COMPLETED'"
                    + " and s.saleDate >= :from and s.saleDate < :to")
    BigDecimal sumRevenueByUser(@Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);

    @Query(
            "select count(s) from Sale s where s.salespersonUserId = :userId and s.status = 'COMPLETED'"
                    + " and s.saleDate >= :from and s.saleDate < :to")
    long countCompletedByUser(@Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);

    @EntityGraph(attributePaths = {"items", "items.productVariant", "items.productVariant.product"})
    @Query(
            """
            select s from Sale s
            where s.salespersonUserId = :userId and s.status = 'COMPLETED'
                and s.saleDate >= :from and s.saleDate < :to
            order by s.saleDate desc
            """)
    List<Sale> findCompletedByUserInRange(
            @Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);

    @EntityGraph(attributePaths = {"items", "items.productVariant", "items.productVariant.product"})
    @Query(
            """
            select s from Sale s
            where s.status = 'COMPLETED'
                and (:locationId is null or s.location.id = :locationId)
                and s.saleDate >= :from and s.saleDate < :to
            order by s.saleDate desc
            """)
    List<Sale> findCompletedForReport(
            @Param("locationId") UUID locationId, @Param("from") Instant from, @Param("to") Instant to);
}
