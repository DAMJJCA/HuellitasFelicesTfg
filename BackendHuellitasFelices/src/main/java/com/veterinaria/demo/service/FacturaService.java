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

    private static final BigDecimal IVA = new BigDecimal("0.21");

    private final JdbcTemplate jdbcTemplate;

    public FacturaService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
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

        Totales totales = calcularTotales(request.lineas());
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            var ps = connection.prepareStatement("""
                    insert into facturas (id_cliente, id_cita, numero, fecha, estado, base_imponible, impuestos, total, notas)
                    values (?, ?, null, current_date, 'borrador', ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, request.idCliente());
            if (request.idCita() == null) {
                ps.setObject(2, null);
            } else {
                ps.setLong(2, request.idCita());
            }
            ps.setBigDecimal(3, totales.base());
            ps.setBigDecimal(4, totales.impuestos());
            ps.setBigDecimal(5, totales.total());
            ps.setString(6, request.notas());
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

        return obtener(idFactura);
    }

    @Transactional
    public FacturaResponse cambiarEstado(Long id, String estado) {
        String estadoNormalizado = estado == null ? "" : estado.trim().toLowerCase();
        if (!List.of("borrador", "emitida", "pagada", "cancelada").contains(estadoNormalizado)) {
            throw new IllegalArgumentException("Estado de factura no valido");
        }
        int updated = jdbcTemplate.update("update facturas set estado = ? where id_factura = ?", estadoNormalizado, id);
        if (updated == 0) {
            throw new IllegalArgumentException("La factura no existe");
        }
        return obtener(id);
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
                factura.baseImponible(),
                factura.impuestos(),
                factura.total(),
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
                rs.getBigDecimal("base_imponible"),
                rs.getBigDecimal("impuestos"),
                rs.getBigDecimal("total"),
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

    private Totales calcularTotales(List<FacturaLineaRequest> lineas) {
        BigDecimal base = lineas.stream()
                .map(linea -> {
                    BigDecimal cantidad = linea.cantidad() == null ? BigDecimal.ONE : linea.cantidad();
                    BigDecimal precio = linea.precioUnitario() == null ? BigDecimal.ZERO : linea.precioUnitario();
                    return cantidad.multiply(precio);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        base = normalizarImporte(base);
        BigDecimal impuestos = normalizarImporte(base.multiply(IVA));
        return new Totales(base, impuestos, normalizarImporte(base.add(impuestos)));
    }

    private BigDecimal normalizarImporte(BigDecimal importe) {
        return importe.setScale(2, RoundingMode.HALF_UP);
    }

    private record Totales(BigDecimal base, BigDecimal impuestos, BigDecimal total) {
    }
}
