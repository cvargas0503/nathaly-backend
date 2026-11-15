# Base de datos de demostración

`001-baseline.sql` representa la estructura de ejecución del sistema: 66 tablas,
781 columnas, 3 tipos de tabla, 31 módulos SQL, 268 claves foráneas y 106 índices.
No contiene filas comerciales, cuentas existentes, hashes de contraseñas reales,
inicios de sesión de SQL Server ni rutas de archivos de la instancia original.
Se excluyen los artefactos del diseñador de diagramas de SSMS.

El script se aplica **una vez a una base vacía** seleccionada por la conexión;
no crea ni selecciona la base, y no incluye instrucciones `USE` o de instancia.
La validación local aplicó 564 lotes a una base temporal aislada y comprobó las
tablas, módulos y claves foráneas creados. La base temporal se eliminó después.
La base de origen permaneció sin modificaciones.

## Inicialización

1. Crear una base vacía `NATHALY_DEMO`.
2. Aplicar `001-baseline.sql` separando los lotes por líneas `GO`.
3. Llamar `await seed(pool, process.env.DEMO_ADMIN_PASSWORD)` de
   `seed-demo.cjs`. La contraseña debe tener al menos doce caracteres.
4. Aplicar las migraciones del backend en orden de nombre.
5. Ejecutar nuevamente `seed` para asignar los permisos añadidos por las
   migraciones al usuario de demostración.
6. Crear una identidad SQL independiente con acceso a esta base para ejecutar
   la API. La API no debe utilizar la identidad administradora del inicializador.

El inicializador necesita permisos para crear los objetos, índices, tipos y
procedimientos del esquema. La creación de la base o de inicios de sesión es una
responsabilidad separada de la orquestación. En Azure SQL se utiliza el usuario
administrador de la base para el esquema y un usuario contenido para la API;
no se deben trasladar instrucciones `CREATE LOGIN` de instancia.

## Datos ficticios

El usuario es `demo.admin` y el hash se genera mediante bcrypt a partir de una
variable privada. No se escribe una contraseña predeterminada en el código.
El seed incorpora un rol de demostración, permisos, país/ciudad/sucursal y bodega
ficticios, un cliente, un empleado y un producto ficticio con veinte unidades y
precio de setenta y cinco. Los estados y tipos de movimiento respetan los
identificadores que utilizan los procedimientos heredados. Las operaciones de
reinicio no vuelven a aumentar las existencias consumidas por una demostración.

El módulo comprueba el nombre de la base y rechaza una conexión a una base de
negocio. Sólo admite `NATHALY_DEMO` o bases temporales con el prefijo
`NATHALY_DEPLOY_TEST_`. El valor predeterminado para `Permiso.IdRol` se configura
exclusivamente en la demostración para compatibilizar el esquema con las
migraciones que insertan permisos sin ese campo.

Los scripts `read-metadata.ps1` y `build-baseline.py` permiten reconstruir el
baseline desde metadatos de catálogo; no seleccionan filas de tablas de negocio.
`raw-metadata.json` documenta los metadatos utilizados. No debe confundirse el
baseline con un respaldo de datos ni con una migración incremental de una
instalación comercial existente.
