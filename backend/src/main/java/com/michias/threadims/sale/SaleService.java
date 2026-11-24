package com.michias.threadims.sale;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.customer.Customer;
import com.michias.threadims.customer.CustomerRepository;
import com.michias.threadims.inventory.InventoryService;
import com.michias.threadims.inventory.StockMovement;
import com.michias.threadims.inventory.StockMovementCommand;
import com.michias.threadims.inventory.StockMovementType;
import com.michias.threadims.location.Location;
import com.michias.threadims.location.LocationRepository;
import com.michias.threadims.payment.Payment;
import com.michias.threadims.payment.dto.PaymentRequest;
import com.michias.threadims.payment.dto.PaymentResponse;
import com.michias.threadims.product.ProductVariant;
import com.michias.threadims.product.ProductVariantRepository;
import com.michias.threadims.sale.dto.SaleCreateRequest;
import com.michias.threadims.sale.dto.SaleItemRequest;
import com.michias.threadims.sale.dto.SaleItemResponse;
import com.michias.threadims.sale.dto.SaleResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SaleService {

    private final SaleRepository saleRepository;
    private final LocationRepository locationRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CustomerRepository customerRepository;
    private final InventoryService inventoryService;

    public SaleService(
            SaleRepository saleRepository,
            LocationRepository locationRepository,
            ProductVariantRepository productVariantRepository,
            CustomerRepository customerRepository,
            InventoryService inventoryService) {
        this.saleRepository = saleRepository;
        this.locationRepository = locationRepository;
        this.productVariantRepository = productVariantRepository;
        this.customerRepository = customerRepository;
        this.inventoryService = inventoryService;
    }

    public SaleResponse create(UUID locationId, SaleCreateRequest request, UUID salespersonUserId) {
        Location location = locationRepository
                .findById(locationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Location not found: " + locationId));

        Sale sale = new Sale();
        sale.setSaleNumber(generateSaleNumber());
        sale.setLocation(location);
        sale.setSalespersonUserId(salespersonUserId);
        sale.setStatus(SaleStatus.COMPLETED);
        if (request.customerId() != null) {
            Customer customer = customerRepository
                    .findById(request.customerId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Customer not found"));
            sale.setCustomer(customer);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;

        for (SaleItemRequest itemRequest : request.items()) {
            ProductVariant variant = productVariantRepository
                    .findById(itemRequest.productVariantId())
                    .orElseThrow(() -> new ApiException(
                            HttpStatus.NOT_FOUND, "Product variant not found: " + itemRequest.productVariantId()));

            BigDecimal lineSubtotal = variant.getDefaultSalePrice().multiply(itemRequest.quantity());
            BigDecimal discount = itemRequest.discountAmount() != null ? itemRequest.discountAmount() : BigDecimal.ZERO;
            if (discount.compareTo(lineSubtotal) > 0) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST, "Discount exceeds line total for " + variant.getSku());
            }

            SaleItem item = new SaleItem();
            item.setSale(sale);
            item.setProductVariant(variant);
            item.setQuantity(itemRequest.quantity());
            item.setUnitPrice(variant.getDefaultSalePrice());
            item.setDiscountAmount(discount);
            item.setLineTotal(lineSubtotal.subtract(discount));
            sale.getItems().add(item);

            subtotal = subtotal.add(lineSubtotal);
            totalDiscount = totalDiscount.add(discount);
        }

        BigDecimal totalAmount = subtotal.subtract(totalDiscount);
        sale.setSubtotal(subtotal);
        sale.setDiscountAmount(totalDiscount);
        sale.setTotalAmount(totalAmount);

        BigDecimal paidAmount = request.payments().stream()
                .map(PaymentRequest::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (paidAmount.compareTo(totalAmount) != 0) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Payments (" + paidAmount + ") do not match the sale total (" + totalAmount + ")");
        }
        for (PaymentRequest paymentRequest : request.payments()) {
            Payment payment = new Payment();
            payment.setSale(sale);
            payment.setMethod(paymentRequest.method());
            payment.setAmount(paymentRequest.amount());
            payment.setReferenceNo(paymentRequest.referenceNo());
            sale.getPayments().add(payment);
        }

        sale = saleRepository.save(sale);

        for (SaleItem item : sale.getItems()) {
            StockMovement movement = inventoryService.applyMovement(new StockMovementCommand(
                    item.getProductVariant().getId(),
                    sale.getLocation().getId(),
                    StockMovementType.SALE,
                    item.getQuantity().negate(),
                    null,
                    "Sale",
                    sale.getId(),
                    salespersonUserId,
                    "Sale " + sale.getSaleNumber()));
            item.setUnitCostAtSale(movement.getUnitCost());
        }

        return toResponse(saleRepository.save(sale));
    }

    public SaleResponse reverse(UUID saleId, UUID reversedByUserId) {
        Sale sale = getWithDetails(saleId);
        if (sale.getStatus() != SaleStatus.COMPLETED) {
            throw new ApiException(HttpStatus.CONFLICT, "Sale is already " + sale.getStatus());
        }

        for (SaleItem item : sale.getItems()) {
            inventoryService.applyMovement(new StockMovementCommand(
                    item.getProductVariant().getId(),
                    sale.getLocation().getId(),
                    StockMovementType.SALE_REVERSAL,
                    item.getQuantity(),
                    null,
                    "Sale",
                    sale.getId(),
                    reversedByUserId,
                    "Reversal of " + sale.getSaleNumber()));
        }

        sale.setStatus(SaleStatus.REVERSED);
        sale.setReversedBy(reversedByUserId);
        sale.setReversedAt(Instant.now());
        return toResponse(saleRepository.save(sale));
    }

    @Transactional(readOnly = true)
    public List<SaleResponse> findAll(UUID locationId, UUID salespersonUserId) {
        return saleRepository.search(locationId, salespersonUserId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Sale getWithDetails(UUID id) {
        return saleRepository
                .findWithDetailsById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sale not found: " + id));
    }

    @Transactional(readOnly = true)
    public SaleResponse getResponseById(UUID id) {
        return toResponse(getWithDetails(id));
    }

    private String generateSaleNumber() {
        long seq = saleRepository.nextSaleNumberSequence();
        return "SALE-%06d".formatted(seq);
    }

    private SaleResponse toResponse(Sale sale) {
        List<SaleItemResponse> items =
                sale.getItems().stream().map(this::toItemResponse).toList();
        List<PaymentResponse> payments = sale.getPayments().stream()
                .map(p -> new PaymentResponse(p.getId(), p.getMethod(), p.getAmount(), p.getReferenceNo(), p.getPaidAt()))
                .toList();
        return new SaleResponse(
                sale.getId(),
                sale.getSaleNumber(),
                sale.getLocation().getId(),
                sale.getLocation().getName(),
                sale.getCustomer() != null ? sale.getCustomer().getId() : null,
                sale.getCustomer() != null ? sale.getCustomer().getName() : null,
                sale.getSalespersonUserId(),
                sale.getSaleDate(),
                sale.getStatus(),
                sale.getSubtotal(),
                sale.getDiscountAmount(),
                sale.getTotalAmount(),
                sale.getReversedBy(),
                sale.getReversedAt(),
                items,
                payments);
    }

    private SaleItemResponse toItemResponse(SaleItem item) {
        ProductVariant variant = item.getProductVariant();
        return new SaleItemResponse(
                item.getId(),
                variant.getId(),
                variant.getProduct().getName(),
                variant.getSku(),
                variant.getColorName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getDiscountAmount(),
                item.getLineTotal(),
                item.getUnitCostAtSale());
    }
}
