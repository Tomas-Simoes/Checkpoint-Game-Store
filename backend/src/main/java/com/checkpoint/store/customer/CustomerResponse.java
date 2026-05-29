package com.checkpoint.store.customer;

import com.checkpoint.store.domain.Customer;
import com.checkpoint.store.domain.Role;

import java.time.Instant;

public record CustomerResponse(
        Long id,
        String name,
        String email,
        String phone,
        String address,
        Role role,
        boolean enabled,
        Instant createdAt
) {

    public static CustomerResponse from(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getAddress(),
                customer.getRole(),
                customer.isEnabled(),
                customer.getCreatedAt()
        );
    }
}
