package com.veterinaria.demo.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.veterinaria.demo.dto.FacturaLineaRequest;
import com.veterinaria.demo.dto.FacturaLineaResponse;
import com.veterinaria.demo.dto.FacturaRequest;
import com.veterinaria.demo.dto.FacturaResponse;

@Service
public class FacturaService {

    private final JdbcTemplate jdbcTemplate;
    private final AuditoriaClinicaService auditoriaClinicaService;

    public FacturaService(JdbcTemplate jdbcTemplate, AuditoriaClinicaService auditoriaClinicaService) {
        this.jdbcTemplate = jdbcTemplate;
        this.auditoriaClinicaService = auditoriaClinicaService;
    }

    @Transactional(readOnly = true)
    public List<FacturaResponse> listar() {
        String sql = """
                select f.*, concat(c.nombre, ' ', c.apellidos) as cliente
                from facturas f
                join clientes c on c.id_cliente = f.id_cliente
                order by f.fecha desc, f.id_factura desc
                """;
        return jdbcTemplate.query(sql, facturaMapper(false));
    }

    @Transactional(readOnly = true)
    public FacturaResponse obtener(Long id) {
        String sql = """
                select f.*, concat(c.nombre, ' ', c.apellidos) as cliente
                from facturas f
                join clientes c on c.id_cliente = f.id_cliente
                where f.id_factura = ?
                """;
        FacturaResponse factura = jdbcTemplate.query(sql, facturaMapper(true), id)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("La factura no existe"));
        return withLineas(factura);
    }

    @Transactional
    public FacturaResponse crear(FacturaRequest request) {
        validar(request);

        Totales totales = calcularTotales(request);
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            var ps = connection.prepareStatement("""
                    insert into facturas (
                        id_cliente, id_cita, numero, fecha, estado,
                        impuesto_porcentaje, descuento_porcentaje, descuento,
                        base_imponible, impuestos, total, pago_estado, notas
                    )
                    values (?, ?, null, current_date, 'borrador', ?, ?, ?, ?, ?, ?, 'pendiente', ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, request.idCliente());
            if (request.idCita() == null) {
                ps.setObject(2, null);
            } else {
                ps.setLong(2, request.idCita());
            }
            ps.setBigDecimal(3, totales.impuestoPorcentaje());
            ps.setBigDecimal(4, totales.descuentoPorcentaje());
            ps.setBigDecimal(5, totales.descuento());
            ps.setBigDecimal(6, totales.base());
            ps.setBigDecimal(7, totales.impuestos());
            ps.setBigDecimal(8, totales.total());
            ps.setString(9, request.notas());
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("No se pudo crear la factura");
        }

        Long idFactura = key.longValue();
        for (FacturaLineaRequest linea : request.lineas()) {
            BigDecimal cantidad = normalizarImporte(linea.cantidad() == null ? BigDecimal.ONE : linea.cantidad());
            BigDecimal precio = normalizarImporte(linea.precioUnitario() == null ? BigDecimal.ZERO : linea.precioUnitario());
            jdbcTemplate.update("""
                    insert into factura_lineas (id_factura, concepto, cantidad, precio_unitario, total)
                    values (?, ?, ?, ?, ?)
                    """, idFactura, linea.concepto().trim(), cantidad, precio, normalizarImporte(cantidad.multiply(precio)));
        }

        String numero = "FAC-" + LocalDate.now().getYear() + "-" + String.format("%05d", idFactura);
        jdbcTemplate.update("update facturas set numero = ? where id_factura = ?", numero, idFactura);

        FacturaResponse factura = obtener(idFactura);
        auditoriaClinicaService.registrar("factura", idFactura, "crear", "Factura " + numero + " creada por " + factura.total() + " EUR");
        return factura;
    }

    @Transactional
    public FacturaResponse cambiarEstado(Long id, String estado) {
        String estadoNormalizado = estado == null ? "" : estado.trim().toLowerCase();
        if (!List.of("borrador", "emitida", "pagada", "cancelada").contains(estadoNormalizado)) {
            throw new IllegalArgumentException("Estado de factura no valido");
        }
        int updated = jdbcTemplate.update("""
                update facturas
                set estado = ?,
                    pago_estado = case
                        when ? = 'pagada' then 'pagado'
                        when ? = 'cancelada' then 'cancelado'
                        else pago_estado
                    end
                where id_factura = ?
                """, estadoNormalizado, estadoNormalizado, estadoNormalizado, id);
        if (updated == 0) {
            throw new IllegalArgumentException("La factura no existe");
        }
        FacturaResponse factura = obtener(id);
        auditoriaClinicaService.registrar("factura", id, "cambiar_estado", "Nuevo estado: " + estadoNormalizado);
        return factura;
    }

    private FacturaResponse withLineas(FacturaResponse factura) {
        List<FacturaLineaResponse> lineas = jdbcTemplate.query("""
                select id_linea, concepto, cantidad, precio_unitario, total
                from factura_lineas
                where id_factura = ?
                order by id_linea
                """, (rs, rowNum) -> new FacturaLineaResponse(
                rs.getLong("id_linea"),
                rs.getString("concepto"),
                rs.getBigDecimal("cantidad"),
                rs.getBigDecimal("precio_unitario"),
                rs.getBigDecimal("total")), factura.idFactura());

        return new FacturaResponse(
                factura.idFactura(),
                factura.idCliente(),
                factura.cliente(),
                factura.idCita(),
                factura.numero(),
                factura.fecha(),
                factura.estado(),
                factura.impuestoPorcentaje(),
                factura.descuentoPorcentaje(),
                factura.descuento(),
                factura.baseImponible(),
                factura.impuestos(),
                factura.total(),
                factura.pagoEstado(),
                factura.pagoProveedor(),
                factura.pagoReferencia(),
                factura.notas(),
                factura.creadoEn(),
                lineas);
    }

    private RowMapper<FacturaResponse> facturaMapper(boolean includeLineas) {
        return (rs, rowNum) -> mapFactura(rs, includeLineas ? List.of() : null);
    }

    private FacturaResponse mapFactura(ResultSet rs, List<FacturaLineaResponse> lineas) throws SQLException {
        Long idCita = rs.getObject("id_cita") == null ? null : rs.getLong("id_cita");
        return new FacturaResponse(
                rs.getLong("id_factura"),
                rs.getLong("id_cliente"),
                rs.getString("cliente"),
                idCita,
                rs.getString("numero"),
                rs.getObject("fecha", LocalDate.class),
                rs.getString("estado"),
                rs.getBigDecimal("impuesto_porcentaje"),
                rs.getBigDecimal("descuento_porcentaje"),
                rs.getBigDecimal("descuento"),
                rs.getBigDecimal("base_imponible"),
                rs.getBigDecimal("impuestos"),
                rs.getBigDecimal("total"),
                rs.getString("pago_estado"),
                rs.getString("pago_proveedor"),
                rs.getString("pago_referencia"),
                rs.getString("notas"),
                rs.getObject("creado_en", LocalDateTime.class),
                lineas);
    }

    private void validar(FacturaRequest request) {
        if (request == null || request.idCliente() == null) {
            throw new IllegalArgumentException("Debes indicar el cliente");
        }
        if (request.lineas() == null || request.lineas().isEmpty()) {
            throw new IllegalArgumentException("La factura debe tener al menos una linea");
        }
        for (FacturaLineaRequest linea : request.lineas()) {
            if (linea.concepto() == null || linea.concepto().isBlank()) {
                throw new IllegalArgumentException("Todas las lineas deben tener concepto");
            }
            BigDecimal cantidad = linea.cantidad() == null ? BigDecimal.ONE : linea.cantidad();
            BigDecimal precio = linea.precioUnitario() == null ? BigDecimal.ZERO : linea.precioUnitario();
            if (cantidad.compareTo(BigDecimal.ZERO) <= 0 || precio.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Las cantidades y precios deben ser validos");
            }
        }
    }

    private Totales calcularTotales(FacturaRequest request) {
        BigDecimal subtotal = request.lineas().stream()
                .map(linea -> {
                    BigDecimal cantidad = linea.cantidad() == null ? BigDecimal.ONE : linea.cantidad();
                    BigDecimal precio = linea.precioUnitario() == null ? BigDecimal.ZERO : linea.precioUnitario();
                    return cantidad.multiply(precio);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        subtotal = normalizarImporte(subtotal);

        BigDecimal impuestoPorcentaje = request.impuestoPorcentaje() == null ? new BigDecimal("21") : porcentaje(request.impuestoPorcentaje());
        BigDecimal descuentoPorcentaje = request.descuentoPorcentaje() == null ? BigDecimal.ZERO : porcentaje(request.descuentoPorcentaje());
        BigDecimal descuento = normalizarImporte(subtotal.multiply(descuentoPorcentaje).divide(new BigDecimal("100"), RoundingMode.HALF_UP));
        BigDecimal base = normalizarImporte(subtotal.subtract(descuento));
        BigDecimal impuestos = normalizarImporte(base.multiply(impuestoPorcentaje).divide(new BigDecimal("100"), RoundingMode.HALF_UP));
        return new Totales(base, impuestos, normalizarImporte(base.add(impuestos)), impuestoPorcentaje, descuentoPorcentaje, descuento);
    }

    private BigDecimal porcentaje(BigDecimal value) {
        BigDecimal normalized = normalizarImporte(value);
        if (normalized.compareTo(BigDecimal.ZERO) < 0 || normalized.compareTo(new BigDecimal("100")) > 0) {
            throw new IllegalArgumentException("Los porcentajes deben estar entre 0 y 100");
        }
        return normalized;
    }

    private BigDecimal normalizarImporte(BigDecimal importe) {
        return importe.setScale(2, RoundingMode.HALF_UP);
    }

    private record Totales(
            BigDecimal base,
            BigDecimal impuestos,
            BigDecimal total,
            BigDecimal impuestoPorcentaje,
            BigDecimal descuentoPorcentaje,
            BigDecimal descuento) {
    }
}
