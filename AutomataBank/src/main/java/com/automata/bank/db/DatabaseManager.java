package com.automata.bank.db;

import com.automata.bank.model.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public final class DatabaseManager {
    private static final String URL = "jdbc:sqlite:data/bank.db";
    private DatabaseManager() {}

    public static void initialize() {
        try (Connection c = connect(); Statement s = c.createStatement()) {
            s.executeUpdate("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id TEXT UNIQUE NOT NULL, pin_hash TEXT NOT NULL, locked INTEGER NOT NULL DEFAULT 0)");
            s.executeUpdate("CREATE TABLE IF NOT EXISTS login_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id TEXT NOT NULL, success INTEGER NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL)");
            s.executeUpdate("CREATE TABLE IF NOT EXISTS otp_store (customer_id TEXT PRIMARY KEY, otp TEXT NOT NULL, expires_at TEXT NOT NULL)");
            try (PreparedStatement p = c.prepareStatement("INSERT OR IGNORE INTO users(customer_id,pin_hash,locked) VALUES(?,?,0)")) {
                p.setString(1, "CSE1234"); p.setString(2, sha256("1234")); p.executeUpdate();
            }
        } catch (SQLException e) { throw new RuntimeException("Database initialization failed", e); }
    }

    private static Connection connect() throws SQLException { return DriverManager.getConnection(URL); }

    public static User findUser(String customerId) {
        try (Connection c = connect(); PreparedStatement p = c.prepareStatement("SELECT id,customer_id,pin_hash,locked FROM users WHERE customer_id=?")) {
            p.setString(1, customerId);
            try (ResultSet r = p.executeQuery()) {
                if (r.next()) return new User(r.getInt(1), r.getString(2), r.getString(3), r.getInt(4) == 1);
            }
        } catch (SQLException e) { throw new RuntimeException("Unable to read user", e); }
        return null;
    }

    public static boolean verifyPin(User u, String pin) { return u != null && u.pinHash().equals(sha256(pin)); }

    public static int getFailedAttempts(String customerId) {
        String sql = "SELECT COUNT(*) FROM login_attempts WHERE customer_id=? AND success=0 AND id > COALESCE((SELECT MAX(id) FROM login_attempts WHERE customer_id=? AND success=1),0)";
        try (Connection c = connect(); PreparedStatement p = c.prepareStatement(sql)) {
            p.setString(1, customerId); p.setString(2, customerId);
            try (ResultSet r = p.executeQuery()) { return r.next() ? r.getInt(1) : 0; }
        } catch (SQLException e) { throw new RuntimeException("Unable to read attempt count", e); }
    }

    public static void lockUser(String customerId) { update("UPDATE users SET locked=1 WHERE customer_id=?", customerId); }

    public static void unlockUser(String customerId) { update("UPDATE users SET locked=0 WHERE customer_id=?", customerId); }

    /**
     * Resets the fixed educational demo account. This clears its lock state,
     * previous failed-attempt history, and any outstanding OTP.
     */

    public static void resetDemoAccount() {
        try (Connection c = connect()) {
            try (PreparedStatement p = c.prepareStatement("UPDATE users SET locked=0 WHERE customer_id=?")) {
                p.setString(1, "CSE1234");
                p.executeUpdate();
            }
            try (PreparedStatement p = c.prepareStatement("DELETE FROM login_attempts WHERE customer_id=?")) {
                p.setString(1, "CSE1234");
                p.executeUpdate();
            }
            try (PreparedStatement p = c.prepareStatement("DELETE FROM otp_store WHERE customer_id=?")) {
                p.setString(1, "CSE1234");
                p.executeUpdate();
            }
        } catch (SQLException e) {
            throw new RuntimeException("Unable to reset demo account", e);
        }
    }

    private static void update(String sql, String value) {
        try (Connection c = connect(); PreparedStatement p = c.prepareStatement(sql)) { p.setString(1, value); p.executeUpdate(); }
        catch (SQLException e) { throw new RuntimeException("Database update failed", e); }
    }

    public static void recordLogin(String customerId, boolean success, String message) {
        String sql = "INSERT INTO login_attempts(customer_id,success,message,created_at) VALUES(?,?,?,?)";
        try (Connection c = connect(); PreparedStatement p = c.prepareStatement(sql)) {
            p.setString(1, customerId); p.setInt(2, success ? 1 : 0); p.setString(3, message); p.setString(4, LocalDateTime.now().toString()); p.executeUpdate();
        } catch (SQLException e) { throw new RuntimeException("Unable to record login", e); }
    }

    public static void saveOtp(String customerId, String otp, LocalDateTime expiresAt) {
        String sql = "INSERT INTO otp_store(customer_id,otp,expires_at) VALUES(?,?,?) ON CONFLICT(customer_id) DO UPDATE SET otp=excluded.otp,expires_at=excluded.expires_at";
        try (Connection c = connect(); PreparedStatement p = c.prepareStatement(sql)) {
            p.setString(1, customerId); p.setString(2, otp); p.setString(3, expiresAt.toString()); p.executeUpdate();
        } catch (SQLException e) { throw new RuntimeException("Unable to save OTP", e); }
    }

    public static boolean verifyOtp(String customerId, String otp) {
        try (Connection c = connect(); PreparedStatement p = c.prepareStatement("SELECT otp,expires_at FROM otp_store WHERE customer_id=?")) {
            p.setString(1, customerId);
            try (ResultSet r = p.executeQuery()) {
                if (!r.next()) return false;
                return r.getString(1).equals(otp) && LocalDateTime.now().isBefore(LocalDateTime.parse(r.getString(2)));
            }
        } catch (SQLException e) { throw new RuntimeException("Unable to verify OTP", e); }
    }

    public static void consumeOtp(String customerId) {
        try (Connection c = connect(); PreparedStatement p = c.prepareStatement("DELETE FROM otp_store WHERE customer_id=?")) {
            p.setString(1, customerId);
            p.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Unable to consume OTP", e);
        }
    }

    private static String sha256(String value) {
        try {
            byte[] bytes = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder s = new StringBuilder();
            for (byte b : bytes) s.append(String.format("%02x", b));
            return s.toString();
        } catch (Exception e) { throw new IllegalStateException("SHA-256 unavailable", e); }
    }

    public static List<String[]> getRecentLogs() {
        List<String[]> result = new ArrayList<>();
        try (Connection c = connect(); PreparedStatement p = c.prepareStatement("SELECT customer_id,success,message,created_at FROM login_attempts ORDER BY id DESC LIMIT 20"); ResultSet r = p.executeQuery()) {
            while (r.next()) result.add(new String[]{r.getString(1), r.getInt(2)==1?"SUCCESS":"FAILED", r.getString(3), r.getString(4)});
        } catch (SQLException e) { throw new RuntimeException("Unable to read logs", e); }
        return result;
    }
}
