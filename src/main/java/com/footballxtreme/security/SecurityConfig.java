package com.footballxtreme.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth

                        // =====================================
                        // PUBLIC FILES
                        // =====================================

                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/style.css",
                                "/app.js",
                                "/favicon.ico",
                                "/admin-login.html",
                                "/admin-login.css"
                        ).permitAll()


                        // =====================================
                        // PUBLIC CONFIG
                        // =====================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/config"
                        ).permitAll()


                        // =====================================
                        // PUBLIC PITCHES
                        // =====================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/pitches"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/pitches/*"
                        ).permitAll()


                        // =====================================
                        // PUBLIC BLOCKED TIMES
                        // Клиентът трябва да ги вижда
                        // =====================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/blocked-times"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/blocked-times/pitch/**"
                        ).permitAll()


                        // =====================================
                        // PUBLIC RESERVATIONS
                        // =====================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/reservations"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/reservations/*/cancel"
                        ).permitAll()


                        // =====================================
                        // PUBLIC AVAILABILITY
                        // =====================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reservations/pitch/**"
                        ).permitAll()


                        // =====================================
                        // ADMIN PITCHES
                        // =====================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/pitches/admin"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/pitches"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/pitches/*"
                        ).hasRole("ADMIN")


                        // =====================================
                        // ADMIN BLOCKED TIMES
                        // =====================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/blocked-times"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/blocked-times/*"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/blocked-times/*"
                        ).hasRole("ADMIN")


                        // =====================================
                        // ADMIN RESERVATIONS
                        // =====================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reservations"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reservations/date/**"
                        ).hasRole("ADMIN")


                        // =====================================
                        // ADMIN ACTIVATE / DEACTIVATE
                        // =====================================

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/pitches/*/activate"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/pitches/*/deactivate"
                        ).hasRole("ADMIN")


                        // =====================================
                        // EVERYTHING ELSE
                        // =====================================

                        .anyRequest().authenticated()
                )


                // =====================================
                // FORM LOGIN
                // =====================================

                .formLogin(form -> form
                        .loginPage("/admin-login.html")
                        .loginProcessingUrl("/login")
                        .defaultSuccessUrl("/admin.html", true)
                        .failureUrl("/admin-login.html?error=true")
                        .permitAll()
                )


                // =====================================
                // LOGOUT
                // =====================================

                .logout(logout -> logout
                        .logoutSuccessUrl("/admin-login.html")
                        .permitAll()
                );

        return http.build();
    }


    // =====================================
    // ADMIN USER
    // =====================================

    @Bean
    public UserDetailsService userDetailsService(
            PasswordEncoder passwordEncoder
    ) {

        UserDetails admin =
                User.builder()
                        .username("admin")
                        .password(
                                passwordEncoder.encode("admin123")
                        )
                        .roles("ADMIN")
                        .build();

        return new InMemoryUserDetailsManager(
                admin
        );
    }


    // =====================================
    // PASSWORD ENCODER
    // =====================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }
}