package com.michias.threadims.product;

import com.michias.threadims.audit.AuditActions;
import com.michias.threadims.audit.AuditService;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.product.dto.ProductRequest;
import com.michias.threadims.product.dto.ProductResponse;
import com.michias.threadims.product.dto.ProductVariantRequest;
import com.michias.threadims.product.dto.ProductVariantResponse;
import com.michias.threadims.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final AuditService auditService;

    public ProductController(ProductService productService, AuditService auditService) {
        this.productService = productService;
        this.auditService = auditService;
    }

    @GetMapping
    public ApiResponse<List<ProductResponse>> list() {
        return ApiResponse.ok(productService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> get(@PathVariable UUID id) {
        return ApiResponse.ok(productService.getResponseById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductResponse> create(
            @Valid @RequestBody ProductRequest request,
            @AuthenticationPrincipal UserPrincipal actor,
            HttpServletRequest httpRequest) {
        ProductResponse created = productService.create(request);
        audit(actor, AuditActions.PRODUCT_CREATED, "Created product " + created.name(), created.id(), httpRequest);
        return ApiResponse.ok(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody ProductRequest request,
            @AuthenticationPrincipal UserPrincipal actor,
            HttpServletRequest httpRequest) {
        ProductResponse updated = productService.update(id, request);
        audit(actor, AuditActions.PRODUCT_UPDATED, "Updated product " + updated.name(), updated.id(), httpRequest);
        return ApiResponse.ok(updated);
    }

    @GetMapping("/variants")
    public ApiResponse<List<ProductVariantResponse>> searchVariants(
            @RequestParam(required = false) String search) {
        return ApiResponse.ok(productService.searchVariants(search));
    }

    @GetMapping("/{productId}/variants")
    public ApiResponse<List<ProductVariantResponse>> listVariants(@PathVariable UUID productId) {
        return ApiResponse.ok(productService.findVariantsByProduct(productId));
    }

    @PostMapping("/{productId}/variants")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductVariantResponse> createVariant(
            @PathVariable UUID productId,
            @Valid @RequestBody ProductVariantRequest request,
            @AuthenticationPrincipal UserPrincipal actor,
            HttpServletRequest httpRequest) {
        ProductVariantResponse created = productService.createVariant(productId, request);
        audit(
                actor,
                AuditActions.PRODUCT_VARIANT_CREATED,
                "Created variant " + created.sku() + " (" + created.colorName() + ")",
                created.id(),
                httpRequest);
        return ApiResponse.ok(created);
    }

    @PutMapping("/variants/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductVariantResponse> updateVariant(
            @PathVariable UUID id,
            @Valid @RequestBody ProductVariantRequest request,
            @AuthenticationPrincipal UserPrincipal actor,
            HttpServletRequest httpRequest) {
        ProductVariantResponse updated = productService.updateVariant(id, request);
        audit(
                actor,
                AuditActions.PRODUCT_VARIANT_UPDATED,
                "Updated variant " + updated.sku(),
                updated.id(),
                httpRequest);
        return ApiResponse.ok(updated);
    }

    private void audit(
            UserPrincipal actor, String action, String description, UUID entityId, HttpServletRequest httpRequest) {
        auditService.record(
                actor.getId(),
                actor.getUsername(),
                actor.getRole().name(),
                action,
                AuditActions.MODULE_PRODUCT,
                description,
                "Product",
                entityId,
                httpRequest.getRemoteAddr(),
                true);
    }
}
