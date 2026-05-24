package com.veterinaria.demo.security;

import java.io.IOException;
import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class ApiSecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            org.springframework.security.core.AuthenticationException authException) throws IOException {
        write(response, HttpStatus.UNAUTHORIZED, "Sesión no válida", "Inicia sesión de nuevo.", request.getRequestURI());
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException, ServletException {
        write(response, HttpStatus.FORBIDDEN, "No tienes permisos para acceder a este recurso",
                accessDeniedException.getMessage(), request.getRequestURI());
    }

    private void write(HttpServletResponse response, HttpStatus status, String message, String detail, String path) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("""
                {"message":"%s","detail":"%s","status":%d,"path":"%s","timestamp":"%s"}
                """.formatted(
                escape(message),
                escape(detail),
                status.value(),
                escape(path),
                LocalDateTime.now()));
    }

    private String escape(String value) {
        return String.valueOf(value)
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", " ")
                .replace("\r", " ");
    }
}
