package com.checkpoint.store.config;

import com.checkpoint.store.domain.Category;
import com.checkpoint.store.domain.Customer;
import com.checkpoint.store.domain.Product;
import com.checkpoint.store.domain.Role;
import com.checkpoint.store.repository.CategoryRepository;
import com.checkpoint.store.repository.CustomerRepository;
import com.checkpoint.store.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Map;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (categoryRepository.count() == 0) {
                categoryRepository.save(new Category("Jogos Digitais", "Jogos em formato digital para PC e consola."));
                categoryRepository.save(new Category("Jogos Físicos", "Edições físicas, novas e usadas."));
                categoryRepository.save(new Category("Retrogaming", "Jogos clássicos e colecionáveis."));
                categoryRepository.save(new Category("Acessórios", "Comandos, headsets e periféricos para jogar."));
            }

            Map<String, Category> categories = Map.of(
                    "digital", categoryRepository.findByNameIgnoreCase("Jogos Digitais").orElseThrow(),
                    "physical", categoryRepository.findByNameIgnoreCase("Jogos Físicos").orElseThrow(),
                    "retro", categoryRepository.findByNameIgnoreCase("Retrogaming").orElseThrow(),
                    "accessories", categoryRepository.findByNameIgnoreCase("Acessórios").orElseThrow()
            );

            if (productRepository.count() == 0) {
                productRepository.save(new Product("PEAK", "Jogo cooperativo de escalada com amigos e quedas caóticas.", new BigDecimal("19.99"), 35, "cover-peak", categories.get("digital")));
                productRepository.save(new Product("R.E.P.O.", "Horror cooperativo com física, sustos e voz por proximidade.", new BigDecimal("14.99"), 42, "cover-repo", categories.get("digital")));
                productRepository.save(new Product("Content Warning", "Filma criaturas assustadoras com amigos e tenta ficar famoso.", new BigDecimal("9.99"), 25, "cover-content", categories.get("digital")));
                productRepository.save(new Product("Comando Wireless Pro", "Comando sem fios compatível com PC e consola.", new BigDecimal("49.90"), 18, "controller-pro", categories.get("accessories")));
                productRepository.save(new Product("Pacote Retro 16-bit", "Coleção física inspirada em clássicos de 16-bit.", new BigDecimal("34.90"), 8, "retro-pack", categories.get("retro")));
            }

            if (!customerRepository.existsByEmailIgnoreCase("admin@checkpoint.local")) {
                customerRepository.save(new Customer(
                        "Administrador Checkpoint",
                        "admin@checkpoint.local",
                        passwordEncoder.encode("Admin123!"),
                        "210000000",
                        "Loja Checkpoint",
                        Role.ADMIN
                ));
            }

            if (!customerRepository.existsByEmailIgnoreCase("cliente@checkpoint.local")) {
                customerRepository.save(new Customer(
                        "Cliente Demo",
                        "cliente@checkpoint.local",
                        passwordEncoder.encode("Cliente123!"),
                        "910000000",
                        "Rua Demo, 1",
                        Role.CUSTOMER
                ));
            }
        };
    }
}
