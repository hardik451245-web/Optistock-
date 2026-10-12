package com.optistock.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@Component
@Order(10)
public class EndpointLogger implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(EndpointLogger.class);

	private final RequestMappingHandlerMapping handlerMapping;

	public EndpointLogger(RequestMappingHandlerMapping handlerMapping) {
		this.handlerMapping = handlerMapping;
	}

	@Override
	public void run(ApplicationArguments args) {
		log.info("=== Mapped Endpoints ===");
		handlerMapping.getHandlerMethods().forEach((info, method) -> {
			log.info("{} -> {}", info, method);
		});
		log.info("=== End Mapped Endpoints ===");
	}
}
