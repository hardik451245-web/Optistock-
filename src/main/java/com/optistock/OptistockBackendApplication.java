package com.optistock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OptistockBackendApplication {

	public static void main(String[] args) {
		java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone(java.time.ZoneId.of("Asia/Kolkata")));
		SpringApplication.run(OptistockBackendApplication.class, args);
	}

}
