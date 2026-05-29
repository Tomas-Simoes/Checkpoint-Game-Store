package com.checkpoint.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiEndpointFeatureTest {

    private static final String ADMIN_EMAIL = "admin@checkpoint.local";
    private static final String ADMIN_PASSWORD = "Admin123!";
    private static final String CUSTOMER_EMAIL = "cliente@checkpoint.local";
    private static final String CUSTOMER_PASSWORD = "Cliente123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String customerToken;

    @Test
    void authEndpointsSupportRegisterLoginSessionAndLogout() throws Exception {
        String email = uniqueEmail("auth");

        MvcResult register = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "name", "Cliente Teste",
                                "email", email,
                                "password", "Cliente123!",
                                "address", "Rua Teste 1"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.customer.email").value(email))
                .andReturn();

        String token = read(register).path("accessToken").asText();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", "Cliente123!"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customer.role").value("CUSTOMER"));

        mockMvc.perform(get("/api/auth/session"))
                .andExpect(status().is4xxClientError());

        mockMvc.perform(get("/api/auth/session").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customer.email").value(email));

        mockMvc.perform(post("/api/auth/logout").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNoContent());
    }

    @Test
    void productAndCategoryEndpointsExposePublicReadsAndProtectWrites() throws Exception {
        String admin = adminToken();
        String customer = customerToken();

        long existingCategoryId = read(mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andReturn()).get(0).path("id").asLong();

        mockMvc.perform(get("/api/categories/{id}", existingCategoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(existingCategoryId));

        long existingProductId = read(mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andReturn()).get(0).path("id").asLong();

        mockMvc.perform(get("/api/products/{id}", existingProductId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(existingProductId));

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(categoryPayload("Sem Auth"))))
                .andExpect(status().is4xxClientError());

        mockMvc.perform(post("/api/categories")
                        .header(HttpHeaders.AUTHORIZATION, bearer(customer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(categoryPayload("Cliente"))))
                .andExpect(status().isForbidden());

        long categoryId = createCategory(admin, "Feature " + suffix());

        mockMvc.perform(put("/api/categories/{id}", categoryId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(categoryPayload("Feature Atualizada " + suffix()))))
                .andExpect(status().isOk());

        long productId = createProduct(admin, categoryId, "Produto Feature " + suffix());

        mockMvc.perform(post("/api/products")
                        .header(HttpHeaders.AUTHORIZATION, bearer(customer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(productPayload(categoryId, "Produto Cliente"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/products/{id}", productId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(productPayload(categoryId, "Produto Feature Atualizado"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Produto Feature Atualizado"));

        mockMvc.perform(delete("/api/products/{id}", productId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isNoContent());

        long emptyCategoryId = createCategory(admin, "Vazia " + suffix());
        mockMvc.perform(delete("/api/categories/{id}", emptyCategoryId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isNoContent());
    }

    @Test
    void customerEndpointsProtectPrivateAndAdminOperations() throws Exception {
        String admin = adminToken();
        String customer = customerToken();
        JsonNode registered = registerCustomer("managed");
        long customerId = registered.path("customer").path("id").asLong();
        String registeredToken = registered.path("accessToken").asText();

        mockMvc.perform(get("/api/customers/me"))
                .andExpect(status().is4xxClientError());

        mockMvc.perform(get("/api/customers/me").header(HttpHeaders.AUTHORIZATION, bearer(customer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(CUSTOMER_EMAIL));

        mockMvc.perform(put("/api/customers/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(registeredToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "name", "Cliente Atualizado",
                                "phone", "910000001",
                                "address", "Rua Atualizada 2"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Cliente Atualizado"));

        mockMvc.perform(patch("/api/customers/me/password")
                        .header(HttpHeaders.AUTHORIZATION, bearer(registeredToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "currentPassword", "Cliente123!",
                                "newPassword", "Cliente456!"
                        ))))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/customers").header(HttpHeaders.AUTHORIZATION, bearer(customer)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/customers").header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/customers/{id}", customerId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(customerId));

        mockMvc.perform(delete("/api/customers/{id}", customerId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isNoContent());
    }

    @Test
    void salesInvoiceAndStatsEndpointsRespectRoles() throws Exception {
        String admin = adminToken();
        String customer = customerToken();
        long categoryId = createCategory(admin, "Vendas " + suffix());
        long productId = createProduct(admin, categoryId, "Produto Venda " + suffix());

        mockMvc.perform(post("/api/sales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(salePayload(productId, "Rua Entrega 1"))))
                .andExpect(status().is4xxClientError());

        MvcResult saleResult = mockMvc.perform(post("/api/sales")
                        .header(HttpHeaders.AUTHORIZATION, bearer(customer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(salePayload(productId, "Rua Entrega 1"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.items[0].productId").value(productId))
                .andReturn();

        long saleId = read(saleResult).path("id").asLong();

        mockMvc.perform(get("/api/sales/my").header(HttpHeaders.AUTHORIZATION, bearer(customer)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/sales").header(HttpHeaders.AUTHORIZATION, bearer(customer)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/sales").header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/sales/{id}", saleId).header(HttpHeaders.AUTHORIZATION, bearer(customer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saleId));

        mockMvc.perform(get("/api/invoices/sales/{saleId}", saleId).header(HttpHeaders.AUTHORIZATION, bearer(customer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saleId").value(saleId));

        mockMvc.perform(patch("/api/sales/{id}/status", saleId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(customer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("status", "DELIVERED"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/sales/{id}/status", saleId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("status", "DELIVERED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"));

        mockMvc.perform(get("/api/stats/products/top").header(HttpHeaders.AUTHORIZATION, bearer(customer)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/stats/products/top").header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/stats/products/least").header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/stats/customers/top").header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/stats/revenue")
                        .param("groupBy", "MONTH")
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isOk());
    }

    @Test
    void writableEndpointsRejectStoredAndEncodedXssPayloads() throws Exception {
        String admin = adminToken();
        String customer = customerToken();
        long categoryId = createCategory(admin, "XSS Safe " + suffix());
        long productId = createProduct(admin, categoryId, "Produto XSS Safe " + suffix());

        expectBadRequest(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "name", "<script>alert(1)</script>",
                        "email", uniqueEmail("xss"),
                        "password", "Cliente123!",
                        "address", "Rua Teste 1"
                ))));

        expectBadRequest(post("/api/categories")
                .header(HttpHeaders.AUTHORIZATION, bearer(admin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "name", "<img src=x onerror=alert(1)>",
                        "description", "Categoria segura"
                ))));

        expectBadRequest(post("/api/products")
                .header(HttpHeaders.AUTHORIZATION, bearer(admin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(productPayload(categoryId, "&#x3C;svg onload=alert(1)&#x3E;"))));

        Map<String, Object> productWithBadImage = productPayload(categoryId, "Produto Imagem XSS");
        productWithBadImage.put("imageUrl", "javascript:alert(1)");
        expectBadRequest(post("/api/products")
                .header(HttpHeaders.AUTHORIZATION, bearer(admin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(productWithBadImage)));

        expectBadRequest(get("/api/products").param("search", "%3Cscript%3Ealert(1)%3C/script%3E"));

        expectBadRequest(put("/api/customers/me")
                .header(HttpHeaders.AUTHORIZATION, bearer(customer))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "name", "<svg onload=alert(1)>",
                        "phone", "910000000",
                        "address", "Rua Segura 1"
                ))));

        expectBadRequest(post("/api/sales")
                .header(HttpHeaders.AUTHORIZATION, bearer(customer))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(salePayload(productId, "%3Cscript%3Ealert(1)%3C/script%3E"))));
    }

    private void expectBadRequest(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request) throws Exception {
        mockMvc.perform(request)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields").exists());
    }

    private JsonNode registerCustomer(String prefix) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "name", "Cliente " + prefix,
                                "email", uniqueEmail(prefix),
                                "password", "Cliente123!",
                                "address", "Rua " + prefix + " 1"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        return read(result);
    }

    private long createCategory(String token, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/categories")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(categoryPayload(name))))
                .andExpect(status().isCreated())
                .andReturn();

        return read(result).path("id").asLong();
    }

    private long createProduct(String token, long categoryId, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/products")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(productPayload(categoryId, name))))
                .andExpect(status().isCreated())
                .andReturn();

        return read(result).path("id").asLong();
    }

    private Map<String, Object> categoryPayload(String name) {
        return Map.of(
                "name", name,
                "description", "Categoria criada por teste automatizado"
        );
    }

    private Map<String, Object> productPayload(long categoryId, String name) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("name", name);
        payload.put("description", "Produto criado por teste automatizado");
        payload.put("price", "12.99");
        payload.put("stock", 20);
        payload.put("imageUrl", "cover-test");
        payload.put("categoryId", categoryId);
        payload.put("active", true);
        return payload;
    }

    private Map<String, Object> salePayload(long productId, String deliveryAddress) {
        return Map.of(
                "deliveryAddress", deliveryAddress,
                "items", java.util.List.of(Map.of(
                        "productId", productId,
                        "quantity", 1
                ))
        );
    }

    private String adminToken() throws Exception {
        if (adminToken == null) {
            adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        }
        return adminToken;
    }

    private String customerToken() throws Exception {
        if (customerToken == null) {
            customerToken = login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
        }
        return customerToken;
    }

    private String login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();

        return read(result).path("accessToken").asText();
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private JsonNode read(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsByteArray());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private String uniqueEmail(String prefix) {
        return prefix + "-" + suffix() + "@checkpoint.local";
    }

    private String suffix() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
}
