package com.imperiumcross.backend.security;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public final class DatabaseUserPrincipal implements UserDetails {

    private final int userId;
    private final String email;
    private final String passwordHash;
    private final String role;
    private final boolean enabled;

    public DatabaseUserPrincipal(
            int userId,
            String email,
            String passwordHash,
            String role,
            boolean enabled) {
        this.userId = userId;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.enabled = enabled;
    }

    public int userId() {
        return userId;
    }

    public String role() {
        return role;
    }

    public DatabaseUserPrincipal withPassword(String encodedPassword) {
        return new DatabaseUserPrincipal(userId, email, encodedPassword, role, enabled);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return java.util.List.of(new SimpleGrantedAuthority(role));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}
