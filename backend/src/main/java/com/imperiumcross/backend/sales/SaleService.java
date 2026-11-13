package com.imperiumcross.backend.sales;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Types;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlParameterValue;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SaleService {

    private static final String BOLETA_SERIE = "B001";

    private record ProductStock(BigDecimal precio, int stock) {
    }

    private final JdbcTemplate jdbcTemplate;

    public SaleService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public SaleReceipt create(SaleRequest request) {
        try {
            Map<Integer, Integer> quantities = new LinkedHashMap<>();
            for (SaleRequest.Line line : request.lineas()) {
                quantities.merge(line.idProducto(), line.cantidad(), Integer::sum);
            }

            Map<Integer, BigDecimal> prices = new LinkedHashMap<>();
            BigDecimal total = BigDecimal.ZERO;
            for (Map.Entry<Integer, Integer> entry : quantities.entrySet()) {
                List<ProductStock> rows = jdbcTemplate.query("""
                        SELECT p.precio, COALESCE(i.stock, 0) AS stock
                        FROM dbo.Producto p
                        LEFT JOIN dbo.Inventario i ON i.id_producto = p.id_producto
                        WHERE p.id_producto = ? AND p.estado = 1
                        """,
                        (rs, rowNum) -> new ProductStock(rs.getBigDecimal("precio"), rs.getInt("stock")),
                        entry.getKey());
                if (rows.isEmpty()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Uno de los productos ya no está disponible.");
                }
                ProductStock product = rows.get(0);
                if (product.stock() < entry.getValue()) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT, "No hay stock suficiente para completar la venta.");
                }
                prices.put(entry.getKey(), product.precio());
                total = total.add(product.precio().multiply(BigDecimal.valueOf(entry.getValue())));
            }
            total = total.setScale(2, RoundingMode.HALF_UP);

            List<Integer> sellers = jdbcTemplate.query("""
                    SELECT TOP 1 u.id_usuario
                    FROM dbo.Usuario u
                    INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol
                    WHERE u.estado = 1 AND r.nombre_rol IN ('Recepcionista', 'Administrador')
                    ORDER BY CASE r.nombre_rol WHEN 'Recepcionista' THEN 0 ELSE 1 END, u.id_usuario
                    """,
                    (rs, rowNum) -> rs.getInt("id_usuario"));
            if (sellers.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "No hay un usuario de recepción activo para registrar la venta.");
            }

            Integer saleId = jdbcTemplate.queryForObject("""
                    INSERT INTO dbo.Venta (id_cliente, id_usuario, fecha_venta, total, metodo_pago)
                    OUTPUT INSERTED.id_venta
                    VALUES (?, ?, GETDATE(), ?, ?)
                    """,
                    Integer.class,
                    new SqlParameterValue(Types.INTEGER, request.idCliente()),
                    sellers.get(0),
                    total,
                    request.metodoPago().trim());
            if (saleId == null) {
                throw new IllegalStateException("SQL Server no devolvió el identificador de la venta.");
            }

            for (Map.Entry<Integer, Integer> entry : quantities.entrySet()) {
                BigDecimal price = prices.get(entry.getKey());
                BigDecimal subtotal = price
                        .multiply(BigDecimal.valueOf(entry.getValue()))
                        .setScale(2, RoundingMode.HALF_UP);
                jdbcTemplate.update("""
                        INSERT INTO dbo.DetalleVenta
                            (id_venta, id_producto, cantidad, precio_unitario, subtotal)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        saleId, entry.getKey(), entry.getValue(), price, subtotal);
                int updated = jdbcTemplate.update("""
                        UPDATE dbo.Inventario
                        SET stock = stock - ?, fecha_actualizacion = GETDATE()
                        WHERE id_producto = ? AND stock >= ?
                        """,
                        entry.getValue(), entry.getKey(), entry.getValue());
                if (updated == 0) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT, "No hay stock suficiente para completar la venta.");
                }
            }

            Integer number = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(numero), 0) + 1 FROM dbo.Boleta WHERE serie = ?",
                    Integer.class,
                    BOLETA_SERIE);
            if (number == null) {
                throw new IllegalStateException("No se pudo calcular el número de boleta.");
            }
            jdbcTemplate.update("""
                    INSERT INTO dbo.Boleta (id_venta, serie, numero, fecha_emision, subtotal, total)
                    VALUES (?, ?, ?, GETDATE(), ?, ?)
                    """,
                    saleId, BOLETA_SERIE, number, total, total);

            return new SaleReceipt(saleId, BOLETA_SERIE, number, total);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se pudo registrar la venta. Revisa los datos e inténtalo de nuevo.",
                    exception);
        }
    }
}