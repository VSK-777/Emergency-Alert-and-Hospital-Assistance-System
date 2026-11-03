package net.vvit.csp.emergency.service;

import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class NeonDatabaseMigrationTest {

    @Test
    public void testNeonPostgresConnection() {
        String jdbcUrl = System.getenv("SPRING_DATASOURCE_URL");
        String user = System.getenv("SPRING_DATASOURCE_USERNAME");
        String pass = System.getenv("SPRING_DATASOURCE_PASSWORD");

        if (jdbcUrl == null || user == null || pass == null) {
            // Environment variables not present in CI/local test environment; verify JDBC driver registration
            assertDoesNotThrow(() -> Class.forName("org.postgresql.Driver"), "PostgreSQL Driver should be loadable");
            return;
        }

        assertDoesNotThrow(() -> {
            try (Connection conn = DriverManager.getConnection(jdbcUrl, user, pass);
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT current_database(), current_user, version()")) {
                assertTrue(rs.next(), "Should retrieve Neon database metadata");
            }
        });
    }
}
