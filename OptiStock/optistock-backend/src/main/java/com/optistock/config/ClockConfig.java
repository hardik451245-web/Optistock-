package com.optistock.config;

import java.time.Clock;
import java.time.ZoneId;
import java.util.TimeZone;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ClockConfig {

	public static final ZoneId ZONE_ID = ZoneId.of("Asia/Kolkata");

	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone(ZONE_ID));
	}

	@Bean
	public Clock clock() {
		return Clock.system(ZONE_ID);
	}
}
