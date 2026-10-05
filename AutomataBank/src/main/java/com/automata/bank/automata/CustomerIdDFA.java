package com.automata.bank.automata;

public class CustomerIdDFA extends DFA {
    public CustomerIdDFA() {
        startState = "q0";
        for (int i = 0; i <= 7; i++) states.add("q" + i);
        states.add(trapState);
        acceptingStates.add("q7");
        addTransition("q0", 'C', "q1");
        addTransition("q1", 'S', "q2");
        addTransition("q2", 'E', "q3");
        addDigits("q3", "q4");
        addDigits("q4", "q5");
        addDigits("q5", "q6");
        addDigits("q6", "q7");
    }
}
