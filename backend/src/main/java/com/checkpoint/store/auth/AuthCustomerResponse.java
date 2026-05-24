package com.checkpoint.store.auth;

import com.checkpoint.store.domain.Customer;
import com.checkpoint.store.domain.Role;

public record AuthCustomerResponse(
        Long id,
        String name,
        String email,
        Role role
) {

    public static AuthCustomerResponse from(Customer customer) {
        return new AuthCustomerResponse(customer.getId(), customer.getName(), customer.getEmail(), customer.getRole());
    }
}
