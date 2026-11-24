package com.michias.threadims.supplier;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.supplier.dto.SupplierRequest;
import com.michias.threadims.supplier.dto.SupplierResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> findAll() {
        return supplierRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Supplier getById(UUID id) {
        return supplierRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Supplier not found: " + id));
    }

    public SupplierResponse create(SupplierRequest request) {
        Supplier supplier = new Supplier();
        applyRequest(supplier, request);
        return toResponse(supplierRepository.save(supplier));
    }

    public SupplierResponse update(UUID id, SupplierRequest request) {
        Supplier supplier = getById(id);
        applyRequest(supplier, request);
        return toResponse(supplierRepository.save(supplier));
    }

    private void applyRequest(Supplier supplier, SupplierRequest request) {
        supplier.setName(request.name());
        supplier.setPhone(request.phone());
        supplier.setEmail(request.email());
        supplier.setAddress(request.address());
        if (request.active() != null) {
            supplier.setActive(request.active());
        }
    }

    private SupplierResponse toResponse(Supplier supplier) {
        return new SupplierResponse(
                supplier.getId(),
                supplier.getName(),
                supplier.getPhone(),
                supplier.getEmail(),
                supplier.getAddress(),
                supplier.isActive());
    }
}
