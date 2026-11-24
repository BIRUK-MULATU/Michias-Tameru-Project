package com.michias.threadims.product;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.product.dto.BrandRequest;
import com.michias.threadims.product.dto.BrandResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BrandService {

    private final BrandRepository brandRepository;

    public BrandService(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    @Transactional(readOnly = true)
    public List<BrandResponse> findAll() {
        return brandRepository.findAll().stream().map(this::toResponse).toList();
    }

    public BrandResponse create(BrandRequest request) {
        if (brandRepository.existsByNameIgnoreCase(request.name())) {
            throw new ApiException(HttpStatus.CONFLICT, "Brand already exists: " + request.name());
        }
        Brand brand = new Brand();
        brand.setName(request.name());
        brand.setActive(request.active() == null || request.active());
        return toResponse(brandRepository.save(brand));
    }

    public BrandResponse update(UUID id, BrandRequest request) {
        Brand brand = getById(id);
        brand.setName(request.name());
        if (request.active() != null) {
            brand.setActive(request.active());
        }
        return toResponse(brandRepository.save(brand));
    }

    @Transactional(readOnly = true)
    public Brand getById(UUID id) {
        return brandRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Brand not found: " + id));
    }

    private BrandResponse toResponse(Brand brand) {
        return new BrandResponse(brand.getId(), brand.getName(), brand.isActive());
    }
}
