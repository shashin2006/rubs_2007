package com.automata.bank.auth;
public enum AuthenticationState { START, CUSTOMER_ID_VALIDATION, PIN_VALIDATION, OTP_VALIDATION, AUTHENTICATED, REJECTED, LOCKED }
