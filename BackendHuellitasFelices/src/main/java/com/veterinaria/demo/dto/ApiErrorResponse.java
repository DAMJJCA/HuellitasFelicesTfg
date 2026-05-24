package com.veterinaria.demo.dto;

import java.time.LocalDateTime;

public class ApiErrorResponse {

    private final String message;
    private final String detail;
    private final int status;
    private final String path;
    private final LocalDateTime timestamp;

    public ApiErrorResponse(String message, String detail, int status, String path) {
        this.message = message;
        this.detail = detail;
        this.status = status;
        this.path = path;
        this.timestamp = LocalDateTime.now();
    }

    public String getMessage() {
        return message;
    }

    public String getDetail() {
        return detail;
    }

    public int getStatus() {
        return status;
    }

    public String getPath() {
        return path;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}
