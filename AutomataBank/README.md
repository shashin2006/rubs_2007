# Automata-Based Bank Authentication System

College-level Theory of Computation mini-project implemented in Java Swing with SQLite/JDBC.

## TOC concepts
- Deterministic Finite Automata (DFA)
- Alphabet, input strings and regular languages
- States, initial state and accepting state
- Transition functions and trap/dead states
- Authentication modeled as a finite-state machine
- Failed-attempt transitions and account locking

## Demo credentials
Customer ID: `CSE1234`
PIN: `1234`

After valid ID/PIN, the application generates a six-digit demo OTP and displays it in the UI. Enter that OTP to complete authentication.

## Requirements
- JDK 17 or later
- Maven 3.9+ recommended

## Run
```bash
mvn clean compile
mvn exec:java
```
Or run `com.automata.bank.Main` from an IDE after Maven resolves the SQLite JDBC dependency.

This is an educational simulation, not a production banking system.
