package com.optistock.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.optistock.entity.Role;
import com.optistock.entity.User;
import com.optistock.repository.UserRepository;

@Component
public class DataInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (userRepository.count() > 0) {
			log.info("Users already present; skipping test user seed");
			return;
		}

		userRepository.save(new User("Test Manager", "manager@optistock.com",
				passwordEncoder.encode("manager123"), Role.MANAGER));
		userRepository.save(new User("Test Cashier", "cashier@optistock.com",
				passwordEncoder.encode("cashier123"), Role.CASHIER));
		log.info("Created test manager and cashier users");
	}
}
