package com.michias.threadims.supplier;

import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.supplier.dto.SupplierRequest;
import com.michias.threadims.supplier.dto.SupplierResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/suppliers")
@PreAuthorize("hasRole('ADMIN')")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    public ApiResponse<List<SupplierResponse>> list() {
        return ApiResponse.ok(supplierService.findAll());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SupplierResponse> create(@Valid @RequestBody SupplierRequest request) {
        return ApiResponse.ok(supplierService.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<SupplierResponse> update(
            @PathVariable UUID id, @Valid @RequestBody SupplierRequest request) {
        return ApiResponse.ok(supplierService.update(id, request));
    }
}
