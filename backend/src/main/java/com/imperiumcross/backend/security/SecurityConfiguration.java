package com.imperiumcross.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfiguration {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new LegacyAwareBcryptPasswordEncoder();
    }

    @Bean
    AuthenticationProvider databaseAuthenticationProvider(
            DatabaseUserDetailsService userDetailsService,
            DatabaseUserDetailsPasswordService passwordService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        provider.setUserDetailsPasswordService(passwordService);
        return provider;
    }

    @Bean
    SecurityFilterChain apiSecurityFilterChain(
            HttpSecurity http,
            AuthenticationProvider databaseAuthenticationProvider) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .authenticationProvider(databaseAuthenticationProvider)
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/ejercicios")
                        .hasAnyRole("ADMIN", "RECEPTION", "TRAINER", "MEMBER")
                        .requestMatchers(HttpMethod.GET, "/api/planes", "/api/productos")
                        .hasAnyRole("ADMIN", "RECEPTION", "TRAINER", "MEMBER")
                        .requestMatchers(HttpMethod.POST, "/api/planes", "/api/productos")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/planes/**", "/api/productos/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/productos/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/clientes/**")
                        .hasRole("ADMIN")
                        .requestMatchers("/api/clientes", "/api/clientes/**")
                        .hasAnyRole("ADMIN", "RECEPTION")
                        .requestMatchers("/api/membresias", "/api/membresias/**", "/api/pagos/**")
                        .hasAnyRole("ADMIN", "RECEPTION")
                        .requestMatchers("/api/asistencias", "/api/asistencias/**")
                        .hasAnyRole("ADMIN", "RECEPTION")
                        .requestMatchers(HttpMethod.GET, "/api/rutinas")
                        .hasAnyRole("ADMIN", "TRAINER")
                        .requestMatchers("/api/rutinas", "/api/rutinas/**")
                        .hasAnyRole("ADMIN", "TRAINER")
                        .requestMatchers("/api/horarios/entrenadores", "/api/horarios/entrenadores/**")
                        .hasRole("ADMIN")
                        .requestMatchers("/api/reservas", "/api/reservas/**")
                        .hasRole("ADMIN")
                        .anyRequest().denyAll())
                .httpBasic(basic -> basic.realmName("Imperium Cross API"));

        return http.build();
    }
}
