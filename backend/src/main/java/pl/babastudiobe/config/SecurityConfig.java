package pl.babastudiobe.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

@Configuration
class SecurityConfig {

	private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);
	private static final String DEFAULT_PASSWORD = "admin";
	private static final String ADMIN_ROLE = "ADMIN";

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		return http
				// Panel korzysta z uwierzytelniania bezstanowego (nagłówek Authorization),
				// więc nie ma sesji ani ciasteczka, które CSRF miałby chronić.
				.csrf(AbstractHttpConfigurer::disable)
				.cors(Customizer.withDefaults())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(authorize -> authorize
						// Preflight musi przejść bez danych logowania.
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						.requestMatchers("/api/admin/**").hasRole(ADMIN_ROLE)
						.anyRequest().permitAll())
				.httpBasic(Customizer.withDefaults())
				// Bez tego Spring odpowiadałby 302 na formularz logowania, co w kliencie
				// wygląda jak dziwny błąd CORS zamiast czytelnego 401.
				.exceptionHandling(exceptions -> exceptions
						.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
				.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	UserDetailsService adminUserDetailsService(
			@Value("${app.admin.username:admin}") String username,
			@Value("${app.admin.password:" + DEFAULT_PASSWORD + "}") String password,
			PasswordEncoder passwordEncoder
	) {
		if (DEFAULT_PASSWORD.equals(password)) {
			log.warn("""
					!!! Panel admina działa na domyślnym haśle "{}". \
					Ustaw ADMIN_PASSWORD przed wystawieniem aplikacji publicznie.""", DEFAULT_PASSWORD);
		}

		return new InMemoryUserDetailsManager(User
				.withUsername(username)
				.password(passwordEncoder.encode(password))
				.roles(ADMIN_ROLE)
				.build());
	}
}
