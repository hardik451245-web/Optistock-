package com.optistock.config;

import java.net.URI;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

@Configuration
public class DatabaseConfig {

	private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

	@Bean
	@Primary
	public DataSource dataSource(Environment env) {
		String databaseUrl = System.getenv("DATABASE_URL");
		if (databaseUrl == null || databaseUrl.trim().isEmpty()) {
			databaseUrl = env.getProperty("DATABASE_URL");
		}

		// Support Render / Cloud PostgreSQL URL format (postgres:// or postgresql://)
		if (databaseUrl != null && (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))) {
			log.info("Detected Render PostgreSQL DATABASE_URL. Configuring PostgreSQL DataSource...");
			try {
				URI uri = new URI(databaseUrl);
				String host = uri.getHost();
				int port = uri.getPort() > 0 ? uri.getPort() : 5432;
				String path = uri.getPath();
				String dbName = (path != null && path.startsWith("/")) ? path.substring(1) : path;
				String userInfo = uri.getUserInfo();
				String username = "";
				String password = "";
				if (userInfo != null && userInfo.contains(":")) {
					String[] parts = userInfo.split(":", 2);
					username = parts[0];
					password = parts[1];
				}

				String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + dbName;
				log.info("Connecting to PostgreSQL at {}:{} on database {}", host, port, dbName);

				return DataSourceBuilder.create()
						.driverClassName("org.postgresql.Driver")
						.url(jdbcUrl)
						.username(username)
						.password(password)
						.build();
			} catch (Exception e) {
				log.error("Failed to parse PostgreSQL DATABASE_URL, falling back to standard config: {}", e.getMessage());
			}
		}

		// Fallback to standard spring.datasource properties (MySQL or H2)
		String jdbcUrl = env.getProperty("spring.datasource.url");
		String username = env.getProperty("spring.datasource.username");
		String password = env.getProperty("spring.datasource.password", "");
		String driver = env.getProperty("spring.datasource.driver-class-name");

		DataSourceBuilder<?> builder = DataSourceBuilder.create()
				.url(jdbcUrl)
				.username(username)
				.password(password);

		if (driver != null && !driver.trim().isEmpty()) {
			builder.driverClassName(driver);
		}

		return builder.build();
	}
}
