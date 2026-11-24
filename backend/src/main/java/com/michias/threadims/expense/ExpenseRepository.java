package com.michias.threadims.expense;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    @Query(
            "select e from Expense e where (:locationId is null or e.location.id = :locationId)"
                    + " order by e.expenseDate desc")
    List<Expense> search(@Param("locationId") UUID locationId);
}
