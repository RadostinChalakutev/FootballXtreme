package com.footballxtreme;

import com.footballxtreme.settings.LegacySchemaBaselineGuard;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FlywayLegacyBaselineTest {

    private DataSource dataSource;
    private String schema;
    private boolean schemaCreated;

    @BeforeEach
    void createIsolatedTestSchema() throws SQLException {
        String suffix = UUID.randomUUID().toString().replace("-", "");
        dataSource = new DriverManagerDataSource(
                System.getenv().getOrDefault("TEST_DB_URL",
                        "jdbc:h2:mem:migration_" + suffix + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1"),
                System.getenv().getOrDefault("TEST_DB_USER", "sa"),
                System.getenv().getOrDefault("TEST_DB_PASSWORD", ""));
        schema = "fx_migration_" + suffix;
        try (Connection connection = dataSource.getConnection(); var statement = connection.createStatement()) {
            statement.execute("CREATE SCHEMA " + schema);
            schemaCreated = true;
        }
    }

    @AfterEach
    void removeOnlyTheTestSchema() throws SQLException {
        if (schemaCreated && schema.matches("fx_migration_[a-f0-9]{32}")) {
            try (Connection connection = dataSource.getConnection(); var statement = connection.createStatement()) {
                statement.execute("DROP SCHEMA " + schema + " CASCADE");
            }
        }
    }

    @Test
    void upgradesLegacyDataAndAddsIndexesMissingFromHibernateSchema() throws Exception {
        createLegacySchema();
        assertThat(indexExists("reservations", "idx_reservations_pitch_date")).isFalse();
        assertThat(indexExists("blocked_times", "idx_blocked_times_pitch_date")).isFalse();

        Flyway flyway = flyway(true);
        flyway.migrate();

        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("3");
        assertThat(queryLong("SELECT COUNT(*) FROM flyway_schema_history WHERE type = 'BASELINE' AND version = '1'"))
                .isEqualTo(1);
        assertThat(queryLong("SELECT COUNT(*) FROM pitches WHERE id = 10 AND name = 'Legacy pitch' AND has_lighting = TRUE"))
                .isEqualTo(1);
        assertThat(queryLong("SELECT COUNT(*) FROM reservations WHERE pitch_id = 10 AND customer_name = 'Legacy customer' AND reference IS NULL"))
                .isEqualTo(2);
        assertThat(queryLong("SELECT COUNT(*) FROM working_hours WHERE day_of_week = 'MONDAY' AND closed = FALSE"))
                .isEqualTo(1);
        assertThat(queryLong("SELECT COUNT(*) FROM blocked_times WHERE pitch_id = 10 AND reason = 'Maintenance'"))
                .isEqualTo(1);
        assertThat(indexExists("reservations", "idx_reservations_pitch_date")).isTrue();
        assertThat(indexExists("blocked_times", "idx_blocked_times_pitch_date")).isTrue();
        assertThat(indexExists("reservations", "ux_reservations_reference")).isTrue();

        // Subsequent deployments use the existing history, even after opting out of baselining.
        assertThat(flyway(false).migrate().migrationsExecuted).isZero();
        assertThat(queryLong("SELECT COUNT(*) FROM reservations")).isEqualTo(2);
    }

    @Test
    void emptyDatabaseExecutesAllMigrationsWithoutBaselineMarker() {
        Flyway flyway = flyway(true);
        assertThat(flyway.migrate().migrationsExecuted).isEqualTo(3);
        assertThat(queryLong("SELECT COUNT(*) FROM flyway_schema_history WHERE type = 'BASELINE'")).isZero();
        assertThat(queryLong("SELECT COUNT(*) FROM pitches")).isZero();
    }

    @Test
    void existingFlywayInstallationAppliesNewMigrationNormally() {
        Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .target("2").load().migrate();

        assertThat(flyway(true).migrate().migrationsExecuted).isEqualTo(1);
        assertThat(queryLong("SELECT COUNT(*) FROM flyway_schema_history WHERE type = 'BASELINE'")).isZero();
    }

    @Test
    void refusesUnrelatedSchemaBeforeCreatingBaselineHistory() throws SQLException {
        execute("CREATE TABLE unrelated_data (id INTEGER PRIMARY KEY)",
                "INSERT INTO unrelated_data (id) VALUES (42)");

        assertThatThrownBy(() -> flyway(true).migrate())
                .isInstanceOf(FlywayException.class)
                .hasMessageContaining("unrecognized database schema");
        assertThat(queryLong("SELECT id FROM unrelated_data")).isEqualTo(42);
        assertThat(tableExists("flyway_schema_history")).isFalse();
    }

    @Test
    void refusesIncompleteLegacySchema() throws Exception {
        createLegacySchema();
        execute("DROP TABLE blocked_times");

        assertThatThrownBy(() -> flyway(true).migrate())
                .isInstanceOf(FlywayException.class)
                .hasMessageContaining("unrecognized database schema");
        assertThat(queryLong("SELECT COUNT(*) FROM reservations")).isEqualTo(2);
        assertThat(tableExists("flyway_schema_history")).isFalse();
    }

    @Test
    void refusesPartiallyUpgradedSchema() throws Exception {
        createLegacySchema();
        execute("ALTER TABLE pitches ADD COLUMN description VARCHAR(500)");

        assertThatThrownBy(() -> flyway(true).migrate())
                .isInstanceOf(FlywayException.class)
                .hasMessageContaining("unrecognized database schema");
        assertThat(queryLong("SELECT COUNT(*) FROM reservations")).isEqualTo(2);
        assertThat(tableExists("flyway_schema_history")).isFalse();
    }

    @Test
    void explicitOptOutKeepsFlywayNonEmptySchemaProtection() throws Exception {
        createLegacySchema();

        assertThatThrownBy(() -> flyway(false).migrate())
                .isInstanceOf(FlywayException.class)
                .hasMessageContaining("non-empty schema");
        assertThat(queryLong("SELECT COUNT(*) FROM reservations")).isEqualTo(2);
    }

    private Flyway flyway(boolean baseline) {
        return Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                .baselineOnMigrate(baseline).baselineVersion("1")
                .callbacks(new LegacySchemaBaselineGuard()).load();
    }

    private void createLegacySchema() throws Exception {
        try (Connection connection = connection()) {
            ScriptUtils.executeSqlScript(connection, new ClassPathResource("db/migration/V1__baseline_schema.sql"));
        }
        // Old Hibernate deployments had no V1 indexes and no Flyway history.
        execute("DROP INDEX idx_reservations_pitch_date", "DROP INDEX idx_blocked_times_pitch_date",
                "INSERT INTO pitches (id, name, active) VALUES (10, 'Legacy pitch', TRUE)",
                "INSERT INTO working_hours (day_of_week, opening_time, closing_time, closed) VALUES ('MONDAY', '09:00', '23:00', FALSE)",
                "INSERT INTO blocked_times (pitch_id, date, start_time, end_time, reason) VALUES (10, '2026-12-01', '09:00', '10:00', 'Maintenance')",
                "INSERT INTO reservations (pitch_id, date, start_time, duration_minutes, customer_name, customer_email, customer_phone, status) " +
                        "VALUES (10, '2026-12-01', '12:00', 60, 'Legacy customer', 'test@example.com', '0888123456', 'CONFIRMED'), " +
                        "(10, '2026-12-01', '13:00', 60, 'Legacy customer', 'test@example.com', '0888123456', 'CONFIRMED')");
    }

    private Connection connection() throws SQLException {
        Connection connection = dataSource.getConnection();
        connection.setSchema(schema);
        return connection;
    }

    private void execute(String... sql) throws SQLException {
        try (Connection connection = connection(); var statement = connection.createStatement()) {
            for (String command : sql) {
                statement.execute(command);
            }
        }
    }

    private long queryLong(String sql) {
        try (Connection connection = connection(); var statement = connection.createStatement();
             ResultSet result = statement.executeQuery(sql)) {
            assertThat(result.next()).isTrue();
            return result.getLong(1);
        } catch (SQLException exception) {
            throw new AssertionError(exception);
        }
    }

    private boolean tableExists(String table) throws SQLException {
        try (Connection connection = connection();
             ResultSet tables = connection.getMetaData().getTables(connection.getCatalog(), schema, table, null)) {
            while (tables.next()) {
                if (schema.equals(tables.getString("TABLE_SCHEM")) && table.equals(tables.getString("TABLE_NAME"))) {
                    return true;
                }
            }
            return false;
        }
    }

    private boolean indexExists(String table, String index) throws SQLException {
        try (Connection connection = connection();
             ResultSet indexes = connection.getMetaData().getIndexInfo(connection.getCatalog(), schema, table, false, false)) {
            while (indexes.next()) {
                if (index.equalsIgnoreCase(indexes.getString("INDEX_NAME"))) {
                    return true;
                }
            }
            return false;
        }
    }
}
