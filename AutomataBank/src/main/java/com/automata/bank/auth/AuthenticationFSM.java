package com.automata.bank.auth;

import com.automata.bank.automata.*;
import com.automata.bank.db.DatabaseManager;
import com.automata.bank.model.User;
import java.util.ArrayList;
import java.util.List;

public class AuthenticationFSM {
    public static final int MAX_ATTEMPTS = 3;
    private final CustomerIdDFA idDFA = new CustomerIdDFA();
    private final PinDFA pinDFA = new PinDFA();
    private final OtpDFA otpDFA = new OtpDFA();

    public AuthenticationResult authenticate(String customerId, String pin, String otp) {
        List<String> trace = new ArrayList<>();
        AuthenticationState state = AuthenticationState.START;
        trace.add(state.name());

        state = AuthenticationState.CUSTOMER_ID_VALIDATION; trace.add(state.name());
        DFAResult id = idDFA.process(customerId);
        User user = DatabaseManager.findUser(customerId);
        if (!id.accepted() || user == null) return reject(customerId, trace, "Invalid customer ID.");
        if (user.locked()) {
            trace.add(AuthenticationState.LOCKED.name());
            return new AuthenticationResult(false, AuthenticationState.LOCKED,
                    DatabaseManager.getFailedAttempts(customerId),
                    "Account is locked. Reset the demo account before trying again.", trace);
        }

        state = AuthenticationState.PIN_VALIDATION;
        trace.add(state.name());
        DFAResult pinFormat = pinDFA.process(pin);
        if (!pinFormat.accepted() || !DatabaseManager.verifyPin(user, pin)) return reject(customerId, trace, "Invalid PIN.");

        state = AuthenticationState.OTP_VALIDATION;
        trace.add(state.name());
        DFAResult otpFormat = otpDFA.process(otp);
        if (!otpFormat.accepted() || !DatabaseManager.verifyOtp(customerId, otp)) return reject(customerId, trace, "Invalid or expired OTP.");

        state = AuthenticationState.AUTHENTICATED;
        trace.add(state.name());
        DatabaseManager.recordLogin(customerId, true, "Authentication successful");
        DatabaseManager.consumeOtp(customerId);
        return new AuthenticationResult(true, state, 0, "Authentication successful.", trace);
    }

    private AuthenticationResult reject(String customerId, List<String> trace, String reason) {
        trace.add(AuthenticationState.REJECTED.name());

        int attempts = DatabaseManager.getFailedAttempts(customerId) + 1;
        DatabaseManager.recordLogin(customerId, false, reason);

        if (attempts >= MAX_ATTEMPTS) {
            DatabaseManager.lockUser(customerId);
            trace.add(AuthenticationState.LOCKED.name());
            return new AuthenticationResult(false, AuthenticationState.LOCKED, attempts, reason + " Maximum attempts reached. Account locked.", trace);
        }
        return new AuthenticationResult(false, AuthenticationState.REJECTED, attempts, reason + " Failed attempts: " + attempts + "/" + MAX_ATTEMPTS, trace);
    }
}
