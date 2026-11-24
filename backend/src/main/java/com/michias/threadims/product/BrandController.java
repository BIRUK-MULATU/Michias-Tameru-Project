package com.michias.threadims.product;

import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.product.dto.BrandRequest;
import com.michias.threadims.product.dto.BrandResponse;
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
@RequestMapping("/api/brands")
public class BrandController {

    private final BrandService brandService;

    public BrandController(BrandService brandService) {
        this.brandService = brandService;
    }

    @GetMapping
    public ApiResponse<List<BrandResponse>> list() {
        return ApiResponse.ok(brandService.findAll());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BrandResponse> create(@Valid @RequestBody BrandRequest request) {
        return ApiResponse.ok(brandService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BrandResponse> update(@PathVariable UUID id, @Valid @RequestBody BrandRequest request) {
        return ApiResponse.ok(brandService.update(id, request));
    }
}
