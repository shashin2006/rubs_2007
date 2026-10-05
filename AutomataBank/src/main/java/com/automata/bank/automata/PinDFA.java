package com.automata.bank.automata;

public class PinDFA extends DFA {
    public PinDFA() {
        startState = "p0";
        for (int i = 0; i <= 4; i++) states.add("p" + i);
        states.add(trapState);
        acceptingStates.add("p4");
        for (int i = 0; i < 4; i++) addDigits("p" + i, "p" + (i + 1));
    }
}
