package com.michias.threadims.customer;

import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.customer.dto.CustomerRequest;
import com.michias.threadims.customer.dto.CustomerResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> findAll() {
        return customerRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Customer getById(UUID id) {
        return customerRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Customer not found: " + id));
    }

    public CustomerResponse create(CustomerRequest request) {
        Customer customer = new Customer();
        applyRequest(customer, request);
        return toResponse(customerRepository.save(customer));
    }

    public CustomerResponse update(UUID id, CustomerRequest request) {
        Customer customer = getById(id);
        applyRequest(customer, request);
        return toResponse(customerRepository.save(customer));
    }

    private void applyRequest(Customer customer, CustomerRequest request) {
        customer.setName(request.name());
        customer.setPhone(request.phone());
        if (request.active() != null) {
            customer.setActive(request.active());
        }
    }

    private CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(customer.getId(), customer.getName(), customer.getPhone(), customer.isActive());
    }
}
