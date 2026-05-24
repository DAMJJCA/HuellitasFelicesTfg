package com.veterinaria.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.veterinaria.demo.model.Cita;
import com.veterinaria.demo.model.Cliente;

@Service
public class ExternalNotificationService {

    private final boolean smsEnabled;
    private final boolean whatsappEnabled;
    private final String smsProviderUrl;
    private final String whatsappProviderUrl;
    private final NotificationTemplateService templateService;

    public ExternalNotificationService(
            @Value("${app.notifications.sms.enabled:false}") boolean smsEnabled,
            @Value("${app.notifications.whatsapp.enabled:false}") boolean whatsappEnabled,
            @Value("${app.notifications.sms.provider-url:}") String smsProviderUrl,
            @Value("${app.notifications.whatsapp.provider-url:}") String whatsappProviderUrl,
            NotificationTemplateService templateService) {
        this.smsEnabled = smsEnabled;
        this.whatsappEnabled = whatsappEnabled;
        this.smsProviderUrl = smsProviderUrl;
        this.whatsappProviderUrl = whatsappProviderUrl;
        this.templateService = templateService;
    }

    public NotificationPlan contactPlan(Cita cita, Cliente cliente) {
        String telefono = cliente != null ? cliente.getTelefono() : null;
        String mensaje = templateService.citaReminderCorto(cita);
        return new NotificationPlan(
                telefono,
                mensaje,
                smsEnabled && hasText(telefono) && hasText(smsProviderUrl),
                whatsappEnabled && hasText(telefono) && hasText(whatsappProviderUrl));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public record NotificationPlan(String telefono, String mensaje, boolean smsDisponible, boolean whatsappDisponible) {
    }
}
