-- Limpiar registro de migraciones incompletas
DELETE FROM __EFMigrationsHistory WHERE MigrationId LIKE '202604%' OR MigrationId LIKE '202606%';

-- Insertar las migraciones que ya existen en la BD
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260416041143_init')
INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260416041143_init', '7.0.0');

IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20260603021608_UpdatePersonaModel')
INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260603021608_UpdatePersonaModel', '7.0.0');
