package com.michias.threadims.audit;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    // username uses '' as "no filter" (not null) and from/to are always concrete
    // — see DateRanges for why a bare null Instant/String bound inside an
    // "is null" check makes PostgreSQL unable to infer the parameter's type.
    @Query(
            """
            select a from AuditLog a
            where (:userId is null or a.userId = :userId)
                and (:username = ''
                    or lower(a.username) like lower(concat('%', :username, '%')))
                and (:module is null or a.module = :module)
                and (:actionType is null or a.actionType = :actionType)
                and (:success is null or a.success = :success)
                and a.createdAt >= :from
                and a.createdAt < :to
            order by a.createdAt desc
            """)
    Page<AuditLog> search(
            @Param("userId") UUID userId,
            @Param("username") String username,
            @Param("module") String module,
            @Param("actionType") String actionType,
            @Param("success") Boolean success,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable);

    Optional<AuditLog> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);
}
