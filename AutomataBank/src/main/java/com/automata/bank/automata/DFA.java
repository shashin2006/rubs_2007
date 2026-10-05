package com.automata.bank.automata;

import java.util.*;

public abstract class DFA {
    protected final Set<String> states = new LinkedHashSet<>();
    protected final Set<String> alphabet = new LinkedHashSet<>();
    protected final Map<String, Map<Character, String>> transitions = new LinkedHashMap<>();
    protected String startState;
    protected final Set<String> acceptingStates = new LinkedHashSet<>();
    protected String trapState = "TRAP";

    public DFAResult process(String input) {
        if (input == null) input = "";
        String current = startState;
        List<String> trace = new ArrayList<>();
        trace.add("START: " + current);
        for (char symbol : input.toCharArray()) {
            String next = transitions.getOrDefault(current, Collections.emptyMap()).get(symbol);
            if (next == null) next = trapState;
            trace.add(current + " --" + symbol + "--> " + next);
            current = next;
        }
        boolean accepted = acceptingStates.contains(current);
        trace.add("FINAL: " + current + (accepted ? " [ACCEPT]" : " [REJECT]"));
        return new DFAResult(accepted, current, trace, accepted ? "Input accepted by the DFA." : "Input rejected by the DFA.");
    }

    protected void addTransition(String from, char symbol, String to) {
        transitions.computeIfAbsent(from, k -> new LinkedHashMap<>()).put(symbol, to);
    }

    protected void addDigits(String from, String to) {
        for (char c = '0'; c <= '9'; c++) addTransition(from, c, to);
    }
}
