package com.imperiumcross.backend.products;

import java.sql.Types;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlParameterValue;
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
                   p.estado,
                   CASE WHEN p.imagen IS NULL THEN 0 ELSE 1 END AS tiene_imagen
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
                rs.getBoolean("estado"),
                rs.getBoolean("tiene_imagen")));
    }

    @Transactional
    public void create(ProductRequest request) {
        try {
            ParsedImage image = parseImage(request.imagen());
            Integer productId = jdbcTemplate.queryForObject("""
                    INSERT INTO dbo.Producto
                        (nombre_producto, descripcion_producto, precio, categoria, estado, imagen, tipo_imagen)
                    OUTPUT INSERTED.id_producto
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    Integer.class,
                    request.nombreProducto().trim(),
                    nullableDescription(request.descripcionProducto()),
                    request.precio(),
                    request.categoria().trim(),
                    request.activo(),
                    new SqlParameterValue(Types.VARBINARY, image.data()),
                    new SqlParameterValue(Types.VARCHAR, image.type()));
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

            if (request.imagen() != null) {
                ParsedImage image = parseImage(request.imagen());
                jdbcTemplate.update(
                        "UPDATE dbo.Producto SET imagen = ?, tipo_imagen = ? WHERE id_producto = ?",
                        new SqlParameterValue(Types.VARBINARY, image.data()),
                        new SqlParameterValue(Types.VARCHAR, image.type()),
                        productId);
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

    private static final java.util.Set<String> ALLOWED_IMAGE_TYPES =
            java.util.Set.of("image/png", "image/jpeg", "image/webp", "image/gif");
    private static final int MAX_IMAGE_BYTES = 5 * 1024 * 1024;

    public record ProductImage(byte[] data, String type) {
    }

    private record ParsedImage(byte[] data, String type) {
    }

    public ProductImage findImage(int productId) {
        List<ProductImage> rows = jdbcTemplate.query("""
                SELECT imagen, tipo_imagen
                FROM dbo.Producto
                WHERE id_producto = ? AND imagen IS NOT NULL
                """,
                (rs, rowNum) -> new ProductImage(rs.getBytes("imagen"), rs.getString("tipo_imagen")),
                productId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El producto no tiene imagen.");
        }
        return rows.get(0);
    }

    private static ParsedImage parseImage(String raw) {
        if (raw == null || raw.isBlank()) return new ParsedImage(null, null);
        String value = raw.trim();
        int separator = value.indexOf(";base64,");
        if (!value.startsWith("data:") || separator < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "La imagen no tiene un formato válido.");
        }
        String type = value.substring(5, separator);
        if (!ALLOWED_IMAGE_TYPES.contains(type)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "La imagen debe ser PNG, JPG, WebP o GIF.");
        }
        byte[] data;
        try {
            data = java.util.Base64.getDecoder().decode(value.substring(separator + 8));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "La imagen no se pudo leer.", exception);
        }
        if (data.length > MAX_IMAGE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La imagen supera los 5 MB.");
        }
        return new ParsedImage(data, type);
    }

    private static String nullableDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }
}
