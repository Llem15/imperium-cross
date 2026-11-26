/*
  PROPUESTA de tablas para la sección Nutricional del socio.

  Este script NO se ha ejecutado. Es una propuesta para revisar, ajustar y ejecutar
  manualmente en SSMS. Si se cambian nombres de tablas o columnas, hay que actualizar
  también backend/src/main/java/com/imperiumcross/backend/nutrition/JdbcNutritionRepository.java,
  que concentra todo el SQL de la sección.

  - Las fechas se guardan en hora local de Perú (America/Lima); el backend envía
    fecha_analisis y fecha_registro explícitamente.
  - Eliminar una comida del historial es un borrado lógico (estado = 'Eliminado').
  - El permiso DELETE sobre dbo.RegistroComida solo se usa para limpiar los análisis
    'Pendiente' con más de 24 horas que el socio nunca guardó. Sus ingredientes se
    borran en cascada.
*/
USE [Imperiumcross-bd];
GO
CREATE TABLE dbo.RegistroComida (
    id_registro_comida INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RegistroComida PRIMARY KEY,
    id_cliente         INT            NOT NULL CONSTRAINT FK_RegistroComida_Cliente REFERENCES dbo.Cliente(id_cliente),
    nombre_plato       VARCHAR(120)   NOT NULL,
    porcion            VARCHAR(80)    NOT NULL,
    calorias           DECIMAL(7,1)   NOT NULL,
    proteinas_g        DECIMAL(6,1)   NOT NULL,
    carbohidratos_g    DECIMAL(6,1)   NOT NULL,
    grasas_g           DECIMAL(6,1)   NOT NULL,
    fibra_g            DECIMAL(6,1)   NOT NULL,
    sodio_mg           DECIMAL(7,1)   NOT NULL,
    consejo            VARCHAR(400)   NULL,
    imagen             VARBINARY(MAX) NULL,
    tipo_imagen        VARCHAR(30)    NULL,
    proveedor_ia       VARCHAR(30)    NOT NULL,
    estado             VARCHAR(15)    NOT NULL CONSTRAINT CK_RegistroComida_Estado
                       CHECK (estado IN ('Pendiente', 'Guardado', 'Eliminado')),
    fecha_analisis     DATETIME2(0)   NOT NULL CONSTRAINT DF_RegistroComida_FechaAnalisis DEFAULT SYSDATETIME(),
    fecha_registro     DATETIME2(0)   NULL
);
CREATE INDEX IX_RegistroComida_Cliente_Estado_Fecha
    ON dbo.RegistroComida (id_cliente, estado, fecha_registro DESC);

CREATE TABLE dbo.IngredienteComida (
    id_ingrediente_comida INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_IngredienteComida PRIMARY KEY,
    id_registro_comida    INT          NOT NULL CONSTRAINT FK_IngredienteComida_Registro
                          REFERENCES dbo.RegistroComida(id_registro_comida) ON DELETE CASCADE,
    nombre                VARCHAR(80)  NOT NULL,
    porcion               VARCHAR(60)  NOT NULL,
    calorias              DECIMAL(7,1) NOT NULL,
    orden                 TINYINT      NOT NULL
);
GO
GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.RegistroComida TO [ic_app];
GRANT SELECT, INSERT, DELETE ON OBJECT::dbo.IngredienteComida TO [ic_app];
GO
