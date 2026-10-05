package com.automata.bank.automata;

public class OtpDFA extends DFA {
    public OtpDFA() {
        startState = "o0";
        for (int i = 0; i <= 6; i++) states.add("o" + i);
        states.add(trapState);
        acceptingStates.add("o6");
        for (int i = 0; i < 6; i++) addDigits("o" + i, "o" + (i + 1));
    }
}
