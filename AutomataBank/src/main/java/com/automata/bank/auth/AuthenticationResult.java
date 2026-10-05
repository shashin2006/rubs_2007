package com.automata.bank.auth;
import java.util.List;
public record AuthenticationResult(boolean success, AuthenticationState finalState, int failedAttempts, String message, List<String> stateTrace) {}
