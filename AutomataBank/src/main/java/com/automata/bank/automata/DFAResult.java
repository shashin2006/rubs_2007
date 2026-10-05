package com.automata.bank.automata;
import java.util.List;
public record DFAResult(boolean accepted, String finalState, List<String> trace, String message) {}
