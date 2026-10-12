package com.optistock;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.optistock.repository.UserRepository;

@SpringBootTest
@ActiveProfiles("demo")
public class UserTableTest {

	@Autowired
	private UserRepository userRepository;

	@Test
	void printUsersTable() {
		System.out.println("--- USERS TABLE QUERY ---");
		userRepository.findAll().forEach(user -> {
			int hashLength = user.getPassword() != null ? user.getPassword().length() : 0;
			System.out.println("USER_ROW: email=" + user.getEmail() + " | role=" + user.getRole() + " | hashLength=" + hashLength);
		});
		System.out.println("--- END USERS TABLE ---");
	}
}
