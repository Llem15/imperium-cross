package com.imperiumcross.backend.products;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductQueryService {

    private static final String FIND_ALL_SQL = """
            SELECT p.id_producto,
                   p.nombre_producto,
                   p.descripcion_producto,
                   p.precio,
                   p.categoria,
                   COALESCE(i.stock, 0) AS stock,
                   COALESCE(i.stock_minimo, 0) AS stock_minimo,
                   p.estado
            FROM dbo.Producto p
            LEFT JOIN dbo.Inventario i ON i.id_producto = p.id_producto
            ORDER BY p.estado DESC, p.nombre_producto
            """;

    private final JdbcTemplate jdbcTemplate;

    public ProductQueryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ProductSummary> findAll() {
        return jdbcTemplate.query(FIND_ALL_SQL, (rs, rowNum) -> new ProductSummary(
                rs.getInt("id_producto"),
                rs.getString("nombre_producto"),
                rs.getString("descripcion_producto"),
                rs.getBigDecimal("precio"),
                rs.getString("categoria"),
                rs.getInt("stock"),
                rs.getInt("stock_minimo"),
                rs.getBoolean("estado")));
    }

    @Transactional
    public void create(ProductRequest request) {
        try {
            Integer productId = jdbcTemplate.queryForObject("""
                    INSERT INTO dbo.Producto
                        (nombre_producto, descripcion_producto, precio, categoria, estado)
                    OUTPUT INSERTED.id_producto
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    Integer.class,
                    request.nombreProducto().trim(),
                    nullableDescription(request.descripcionProducto()),
                    request.precio(),
                    request.categoria().trim(),
                    request.activo());
            if (productId == null) {
                throw new IllegalStateException("SQL Server no devolvió el identificador del producto.");
            }
            jdbcTemplate.update("""
                    INSERT INTO dbo.Inventario (id_producto, stock, stock_minimo)
                    VALUES (?, ?, ?)
                    """,
                    productId,
                    request.stock(),
                    request.stockMinimo());
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un producto con ese nombre o sus datos no cumplen las restricciones.",
                    exception);
        }
    }

    @Transactional
    public void update(int productId, ProductRequest request) {
        try {
            int updatedProducts = jdbcTemplate.update("""
                    UPDATE dbo.Producto
                    SET nombre_producto = ?,
                        descripcion_producto = ?,
                        precio = ?,
                        categoria = ?,
                        estado = ?
                    WHERE id_producto = ?
                    """,
                    request.nombreProducto().trim(),
                    nullableDescription(request.descripcionProducto()),
                    request.precio(),
                    request.categoria().trim(),
                    request.activo(),
                    productId);
            if (updatedProducts == 0) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el producto.");
            }

            int updatedInventory = jdbcTemplate.update("""
                    UPDATE dbo.Inventario
                    SET stock = ?, stock_minimo = ?, fecha_actualizacion = GETDATE()
                    WHERE id_producto = ?
                    """,
                    request.stock(),
                    request.stockMinimo(),
                    productId);
            if (updatedInventory == 0) {
                jdbcTemplate.update("""
                        INSERT INTO dbo.Inventario (id_producto, stock, stock_minimo)
                        VALUES (?, ?, ?)
                        """,
                        productId,
                        request.stock(),
                        request.stockMinimo());
            }
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un producto con ese nombre o sus datos no cumplen las restricciones.",
                    exception);
        }
    }

    @Transactional
    public void deactivate(int productId) {
        int updatedProducts = jdbcTemplate.update(
                "UPDATE dbo.Producto SET estado = 0 WHERE id_producto = ?",
                productId);
        if (updatedProducts == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el producto.");
        }
    }

    private static String nullableDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }
}
