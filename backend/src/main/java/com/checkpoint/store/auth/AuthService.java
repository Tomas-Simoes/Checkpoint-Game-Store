package com.checkpoint.store.auth;

import com.checkpoint.store.common.BusinessException;
import com.checkpoint.store.domain.Customer;
import com.checkpoint.store.domain.Role;
import com.checkpoint.store.repository.CustomerRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CurrentUserService currentUserService;

    public AuthService(
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            CurrentUserService currentUserService
    ) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (customerRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Ja existe uma conta com esse email.");
        }

        Customer customer = new Customer(
                request.name().trim(),
                email,
                passwordEncoder.encode(request.password()),
                normalizeOptional(request.phone()),
                request.address().trim(),
                Role.CUSTOMER
        );
        customerRepository.save(customer);
        return buildResponse(customer);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password())
        );
        Customer customer = customerRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BusinessException("Credenciais invalidas."));
        return buildResponse(customer);
    }

    public AuthResponse session() {
        return buildResponse(currentUserService.getAuthenticatedCustomer());
    }

    private AuthResponse buildResponse(Customer customer) {
        return new AuthResponse(
                "Bearer",
                jwtService.generateToken(customer),
                jwtService.getExpirationSeconds(),
                AuthCustomerResponse.from(customer)
        );
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
