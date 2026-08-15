package pl.babastudiobe.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
class WebConfig implements WebMvcConfigurer {

	private final Path uploadsRoot;
	private final String[] allowedOrigins;

	WebConfig(
			@Value("${app.uploads-dir:../uploads}") String uploadsDir,
			@Value("${app.cors.allowed-origins:http://localhost:4200}") String[] allowedOrigins
	) {
		this.uploadsRoot = Paths.get(uploadsDir).toAbsolutePath().normalize();
		this.allowedOrigins = allowedOrigins;
	}

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry
				.addResourceHandler("/uploads/**")
				.addResourceLocations(uploadsRoot.toUri().toString());
	}

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry
				.addMapping("/**")
				.allowedOrigins(allowedOrigins)
				.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
				.allowedHeaders("*");
	}
}
