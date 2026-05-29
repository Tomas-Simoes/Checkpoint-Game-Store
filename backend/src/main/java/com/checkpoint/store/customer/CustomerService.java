package com.checkpoint.store.customer;

import com.checkpoint.store.auth.CurrentUserService;
import com.checkpoint.store.common.BusinessException;
import com.checkpoint.store.common.NotFoundException;
import com.checkpoint.store.domain.Customer;
import com.checkpoint.store.repository.CustomerRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CurrentUserService currentUserService;
    private final PasswordEncoder passwordEncoder;

    public CustomerService(
            CustomerRepository customerRepository,
            CurrentUserService currentUserService,
            PasswordEncoder passwordEncoder
    ) {
        this.customerRepository = customerRepository;
        this.currentUserService = currentUserService;
        this.passwordEncoder = passwordEncoder;
    }

    public CustomerResponse me() {
        return CustomerResponse.from(currentUserService.getAuthenticatedCustomer());
    }

    public List<CustomerResponse> findAll() {
        return customerRepository.findAll().stream()
                .map(CustomerResponse::from)
                .toList();
    }

    public CustomerResponse findById(Long id) {
        return CustomerResponse.from(getCustomer(id));
    }

    @Transactional
    public CustomerResponse updateMe(CustomerUpdateRequest request) {
        Customer customer = currentUserService.getAuthenticatedCustomer();
        customer.updateProfile(request.name().trim(), normalizeOptional(request.phone()), request.address().trim());
        return CustomerResponse.from(customer);
    }

    @Transactional
    public void changeMyPassword(CustomerPasswordRequest request) {
        Customer customer = currentUserService.getAuthenticatedCustomer();
        if (!passwordEncoder.matches(request.currentPassword(), customer.getPasswordHash())) {
            throw new BusinessException("A palavra-passe atual não está correta.");
        }
        customer.updatePassword(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public void disable(Long id) {
        Customer customer = getCustomer(id);
        customer.disable();
    }

    private Customer getCustomer(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Cliente não encontrado."));
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
