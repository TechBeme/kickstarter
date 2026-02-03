# Cómo sincronizar la vista de Supabase con Google Sheets (Apps Script)

Guía paso a paso en español para exponer solo los campos necesarios al cliente a través de Google Sheets, usando una vista de solo lectura + Apps Script.

## 1) Crear la vista en Supabase
1. Abra el Editor SQL de Supabase.
2. Pegue el contenido de `supabase/views/customer_contacts_view.sql`.
3. Ejecute el SQL para crear/actualizar la vista.
4. Asegúrese de que las políticas (RLS) permitan `SELECT` en esta vista para la clave de lectura (ideal: `anon` o un usuario/rol de lectura dedicado).

## 2) Preparar la hoja de cálculo del cliente
1. Cree/abra la hoja de cálculo en Google Sheets.
2. Anote el `SPREADSHEET_ID` (de la URL).
3. Vaya a Extensiones → Apps Script.

## 3) Configurar Apps Script
1. Cree un nuevo proyecto y reemplace el código con el contenido de `scripts/google-appscript-sync.js`.
2. Vaya a Configuración del proyecto → Propiedades del script:
   - Agregue `SUPABASE_URL` con la URL de su proyecto (ej.: `https://<project>.supabase.co`).
   - Agregue `SUPABASE_KEY` con la clave de lectura (no use service role).
   - Opcional: `SUPABASE_VIEW` (predeterminado: `customer_contacts_view`).
   - Opcional: `SHEET_NAME` (predeterminado: `Data`).
3. Guarde las propiedades.

## 4) Ejecutar y autorizar
1. En Apps Script, seleccione la función `syncSupabaseToSheet` y haga clic en Ejecutar.
2. Autorice el script con la cuenta de Google de la hoja de cálculo.
3. Después de la primera ejecución, verifique si la pestaña `Data` se llenó.

## 5) Programar actualizaciones automáticas
1. En Apps Script, ejecute la función `createTrigger` una vez.
2. Esto crea un activador basado en tiempo (1x/hora). Ajuste en el panel de activadores si desea una frecuencia diferente.

## 6) Seguridad y mejores prácticas
- Use una clave de lectura limitada a través de la vista (RLS) para evitar exponer datos sensibles.
- No incluya el service role en el script.
- La vista solo debe contener columnas permitidas para el cliente.

## 7) Resumen de archivos
- Vista SQL: `supabase/views/customer_contacts_view.sql`
- Código Apps Script: `scripts/google-appscript-sync.js`
