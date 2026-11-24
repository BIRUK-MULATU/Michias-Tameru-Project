package com.michias.threadims.expense;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.expense.dto.ExpenseRequest;
import com.michias.threadims.expense.dto.ExpenseResponse;
import com.michias.threadims.location.Location;
import com.michias.threadims.location.LocationRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final LocationRepository locationRepository;

    public ExpenseService(ExpenseRepository expenseRepository, LocationRepository locationRepository) {
        this.expenseRepository = expenseRepository;
        this.locationRepository = locationRepository;
    }

    public ExpenseResponse create(ExpenseRequest request, UUID recordedByUserId) {
        Expense expense = new Expense();
        if (request.locationId() != null) {
            Location location = locationRepository
                    .findById(request.locationId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Location not found"));
            expense.setLocation(location);
        }
        expense.setCategory(request.category());
        expense.setAmount(request.amount());
        expense.setDescription(request.description());
        expense.setRecordedBy(recordedByUserId);
        return toResponse(expenseRepository.save(expense));
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> findAll(UUID locationId) {
        return expenseRepository.search(locationId).stream().map(this::toResponse).toList();
    }

    private ExpenseResponse toResponse(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getLocation() != null ? expense.getLocation().getId() : null,
                expense.getLocation() != null ? expense.getLocation().getName() : null,
                expense.getCategory(),
                expense.getAmount(),
                expense.getDescription(),
                expense.getExpenseDate(),
                expense.getRecordedBy());
    }
}
