package com.footballxtreme.settings;

import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.callback.Callback;
import org.flywaydb.core.api.callback.Context;
import org.flywaydb.core.api.callback.Event;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Prevents automatic V1 baselining of unrelated or partially upgraded databases. */
@Component
public class LegacySchemaBaselineGuard implements Callback {

    private static final Map<String, Set<String>> LEGACY_COLUMNS = Map.of(
            "pitches", Set.of("id", "name", "active"),
            "working_hours", Set.of("id", "day_of_week", "opening_time", "closing_time", "closed"),
            "reservations", Set.of("id", "pitch_id", "date", "start_time", "duration_minutes",
                    "customer_name", "customer_email", "customer_phone", "status"),
            "blocked_times", Set.of("id", "pitch_id", "date", "start_time", "end_time", "reason")
    );

    @Override
    public boolean supports(Event event, Context context) {
        return event == Event.BEFORE_BASELINE;
    }

    @Override
    public boolean canHandleInTransaction(Event event, Context context) {
        return true;
    }

    @Override
    public void handle(Event event, Context context) {
        if (!MigrationVersion.fromVersion("1").equals(context.getConfiguration().getBaselineVersion())) {
            throw new FlywayException("FootballXtreme legacy databases must be baselined at version 1.");
        }

        try {
            Connection connection = context.getConnection();
            String schema = context.getConfiguration().getDefaultSchema();
            if (schema == null) {
                String[] schemas = context.getConfiguration().getSchemas();
                schema = schemas.length > 0 ? schemas[0] : connection.getSchema();
            }
            if (schema == null || !readColumns(connection, schema).equals(LEGACY_COLUMNS)) {
                throw new FlywayException("Refusing to baseline an unrecognized database schema. " +
                        "Expected the four legacy FootballXtreme tables and their original columns. " +
                        "Check DB_URL and the schema before upgrading; do not delete existing data.");
            }
        } catch (SQLException exception) {
            throw new FlywayException("Could not verify the legacy FootballXtreme schema.", exception);
        }
    }

    private Map<String, Set<String>> readColumns(Connection connection, String schema) throws SQLException {
        var metadata = connection.getMetaData();
        Map<String, Set<String>> columns = new HashMap<>();
        // Filter exact schema names as JDBC patterns treat underscores as wildcards.
        try (ResultSet tables = metadata.getTables(connection.getCatalog(), null, "%",
                new String[]{"TABLE", "BASE TABLE", "VIEW"})) {
            while (tables.next()) {
                if (schema.equals(tables.getString("TABLE_SCHEM"))) {
                    columns.put(tables.getString("TABLE_NAME").toLowerCase(Locale.ROOT), new HashSet<>());
                }
            }
        }
        try (ResultSet fields = metadata.getColumns(connection.getCatalog(), null, "%", "%")) {
            while (fields.next()) {
                if (schema.equals(fields.getString("TABLE_SCHEM"))) {
                    Set<String> names = columns.get(fields.getString("TABLE_NAME").toLowerCase(Locale.ROOT));
                    if (names != null) {
                        names.add(fields.getString("COLUMN_NAME").toLowerCase(Locale.ROOT));
                    }
                }
            }
        }
        return columns;
    }

    @Override
    public String getCallbackName() {
        return "verify-legacy-footballxtreme-schema";
    }
}
