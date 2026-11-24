package com.michias.threadims.product;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.product.dto.ProductRequest;
import com.michias.threadims.product.dto.ProductResponse;
import com.michias.threadims.product.dto.ProductVariantRequest;
import com.michias.threadims.product.dto.ProductVariantResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final BrandService brandService;
    private final CategoryService categoryService;

    public ProductService(
            ProductRepository productRepository,
            ProductVariantRepository productVariantRepository,
            BrandService brandService,
            CategoryService categoryService) {
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
        this.brandService = brandService;
        this.categoryService = categoryService;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> findAll() {
        return productRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Product getById(UUID id) {
        return productRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found: " + id));
    }

    @Transactional(readOnly = true)
    public ProductResponse getResponseById(UUID id) {
        return toResponse(getById(id));
    }

    public ProductResponse create(ProductRequest request) {
        Product product = new Product();
        applyRequest(product, request);
        return toResponse(productRepository.save(product));
    }

    public ProductResponse update(UUID id, ProductRequest request) {
        Product product = getById(id);
        applyRequest(product, request);
        return toResponse(productRepository.save(product));
    }

    private void applyRequest(Product product, ProductRequest request) {
        product.setName(request.name());
        product.setBrand(request.brandId() != null ? brandService.getById(request.brandId()) : null);
        product.setCategory(request.categoryId() != null ? categoryService.getById(request.categoryId()) : null);
        product.setUnitOfMeasure(request.unitOfMeasure());
        product.setDescription(request.description());
        if (request.active() != null) {
            product.setActive(request.active());
        }
    }

    @Transactional(readOnly = true)
    public List<ProductVariantResponse> findVariantsByProduct(UUID productId) {
        return productVariantRepository.findByProductId(productId).stream()
                .map(this::toVariantResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductVariantResponse> searchVariants(String search) {
        return productVariantRepository.search(search == null ? "" : search).stream()
                .map(this::toVariantResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductVariant getVariantById(UUID id) {
        return productVariantRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product variant not found: " + id));
    }

    public ProductVariantResponse createVariant(UUID productId, ProductVariantRequest request) {
        Product product = getById(productId);
        if (productVariantRepository.existsBySkuIgnoreCase(request.sku())) {
            throw new ApiException(HttpStatus.CONFLICT, "SKU already in use: " + request.sku());
        }
        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        applyVariantRequest(variant, request);
        return toVariantResponse(productVariantRepository.save(variant));
    }

    public ProductVariantResponse updateVariant(UUID id, ProductVariantRequest request) {
        ProductVariant variant = getVariantById(id);
        if (!variant.getSku().equalsIgnoreCase(request.sku())
                && productVariantRepository.existsBySkuIgnoreCase(request.sku())) {
            throw new ApiException(HttpStatus.CONFLICT, "SKU already in use: " + request.sku());
        }
        applyVariantRequest(variant, request);
        return toVariantResponse(productVariantRepository.save(variant));
    }

    private void applyVariantRequest(ProductVariant variant, ProductVariantRequest request) {
        variant.setSku(request.sku());
        variant.setColorName(request.colorName());
        variant.setShadeCode(request.shadeCode());
        variant.setDefaultSalePrice(request.defaultSalePrice());
        if (request.reorderLevel() != null) {
            variant.setReorderLevel(request.reorderLevel());
        }
        if (request.active() != null) {
            variant.setActive(request.active());
        }
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getBrand() != null ? product.getBrand().getId() : null,
                product.getBrand() != null ? product.getBrand().getName() : null,
                product.getCategory() != null ? product.getCategory().getId() : null,
                product.getCategory() != null ? product.getCategory().getName() : null,
                product.getUnitOfMeasure(),
                product.getDescription(),
                product.isActive());
    }

    private ProductVariantResponse toVariantResponse(ProductVariant variant) {
        Product product = variant.getProduct();
        return new ProductVariantResponse(
                variant.getId(),
                product.getId(),
                product.getName(),
                product.getBrand() != null ? product.getBrand().getName() : null,
                variant.getSku(),
                variant.getColorName(),
                variant.getShadeCode(),
                variant.getDefaultSalePrice(),
                variant.getReorderLevel(),
                variant.isActive());
    }
}
