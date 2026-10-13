package com.optistock.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.optistock.entity.Role;
import com.optistock.entity.User;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
public class SecurityIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AuthTokenService authTokenService;

	@Test
	@DisplayName("Cashier receives 403 Forbidden when creating a product")
	void testCashierCannotCreateProduct() throws Exception {
		User cashier = new User("Cashier", "csh@test.com", "pass", Role.CASHIER);
		cashier.setId(101L);
		String token = authTokenService.issueToken(new AppUserDetails(cashier));

		String payload = """
				{
					"name": "Unauthorized Snack",
					"brand": "Brand",
					"category": "Snacks",
					"costPrice": 10.00,
					"sellingPrice": 20.00,
					"stockQuantity": 50,
					"reorderThreshold": 10
				}
				""";

		mockMvc.perform(post("/api/products")
						.header("Authorization", "Bearer " + token)
						.contentType(MediaType.APPLICATION_JSON)
						.content(payload))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("Manager receives 201 Created when creating a product")
	void testManagerCanCreateProduct() throws Exception {
		User manager = new User("Manager", "mgr@test.com", "pass", Role.MANAGER);
		manager.setId(102L);
		String token = authTokenService.issueToken(new AppUserDetails(manager));

		String payload = """
				{
					"name": "Manager Approved Tea",
					"brand": "GoodBrand",
					"category": "Beverages",
					"costPrice": 40.00,
					"sellingPrice": 70.00,
					"stockQuantity": 30,
					"reorderThreshold": 5
				}
				""";

		mockMvc.perform(post("/api/products")
						.header("Authorization", "Bearer " + token)
						.contentType(MediaType.APPLICATION_JSON)
						.content(payload))
				.andExpect(status().isCreated());
	}

	@Test
	@DisplayName("Cashier receives 403 Forbidden on manager analytics endpoints")
	void testCashierCannotAccessManagerEndpoints() throws Exception {
		User cashier = new User("Cashier", "csh2@test.com", "pass", Role.CASHIER);
		cashier.setId(103L);
		String token = authTokenService.issueToken(new AppUserDetails(cashier));

		mockMvc.perform(get("/api/manager/forecast")
						.header("Authorization", "Bearer " + token))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("Unauthenticated request to protected endpoint receives 401 Unauthorized")
	void testUnauthenticatedGets401() throws Exception {
		mockMvc.perform(get("/api/products"))
				.andExpect(status().isUnauthorized());
	}
}
