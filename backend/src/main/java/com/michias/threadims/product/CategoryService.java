package com.michias.threadims.product;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.product.dto.CategoryRequest;
import com.michias.threadims.product.dto.CategoryResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    public CategoryResponse create(CategoryRequest request) {
        Category category = new Category();
        applyRequest(category, request);
        return toResponse(categoryRepository.save(category));
    }

    public CategoryResponse update(UUID id, CategoryRequest request) {
        Category category = getById(id);
        if (request.parentCategoryId() != null && request.parentCategoryId().equals(id)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A category cannot be its own parent");
        }
        applyRequest(category, request);
        return toResponse(categoryRepository.save(category));
    }

    @Transactional(readOnly = true)
    public Category getById(UUID id) {
        return categoryRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found: " + id));
    }

    private void applyRequest(Category category, CategoryRequest request) {
        category.setName(request.name());
        if (request.parentCategoryId() != null) {
            category.setParentCategory(getById(request.parentCategoryId()));
        } else {
            category.setParentCategory(null);
        }
        if (request.active() != null) {
            category.setActive(request.active());
        }
    }

    private CategoryResponse toResponse(Category category) {
        Category parent = category.getParentCategory();
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                parent != null ? parent.getId() : null,
                parent != null ? parent.getName() : null,
                category.isActive());
    }
}
