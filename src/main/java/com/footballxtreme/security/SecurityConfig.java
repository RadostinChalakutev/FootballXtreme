package com.footballxtreme.security;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
@Configuration
public class SecurityConfig {
    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/", "/index.html", "/style.css", "/app.js", "/csrf.js", "/favicon.ico", "/admin-login.html", "/admin-login.css", "/error").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/csrf", "/api/config", "/api/pitches", "/api/working-hours", "/api/working-hours/*", "/api/reservations/pitch/*", "/api/blocked-times/pitch/*").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/reservations").permitAll()
            .anyRequest().hasRole("ADMIN"))
            .exceptionHandling(e -> e.defaultAuthenticationEntryPointFor(
                (request,response,exception) -> response.sendError(401), new AntPathRequestMatcher("/api/**")))
            .formLogin(form -> form.loginPage("/admin-login.html").loginProcessingUrl("/login")
                .defaultSuccessUrl("/admin.html",true).failureUrl("/admin-login.html?error=true").permitAll())
            .logout(logout -> logout.logoutSuccessUrl("/admin-login.html").permitAll());
        return http.build();
    }
    @Bean UserDetailsService userDetailsService(PasswordEncoder encoder,
        @Value("${app.admin.username:admin}") String username,
        @Value("${app.admin.password}") String password) {
        if (password.length() < 16 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
            throw new IllegalArgumentException("ADMIN_PASSWORD must contain 16–72 UTF-8 bytes (at least 16 characters).");
        return new InMemoryUserDetailsManager(User.withUsername(username).password(encoder.encode(password)).roles("ADMIN").build());
    }
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
}
