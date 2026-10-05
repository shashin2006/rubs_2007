# Formal Automata Specification

## Customer ID DFA
Language: `L_ID = { CSE d1 d2 d3 d4 | di in {0,...,9} }`
- Start: q0
- Accepting: q7
- Trap: TRAP
- Pattern: CSE followed by exactly four digits

## PIN DFA
Language: `L_PIN = { d1 d2 d3 d4 | di in {0,...,9} }`
- Start: p0
- Accepting: p4
- Trap: TRAP

## OTP DFA
Language: `L_OTP = { d1 d2 d3 d4 d5 d6 | di in {0,...,9} }`
- Start: o0
- Accepting: o6
- Trap: TRAP

## Authentication FSM
START -> CUSTOMER_ID_VALIDATION -> PIN_VALIDATION -> OTP_VALIDATION -> AUTHENTICATED

Any invalid credential -> REJECTED. Three consecutive failures since the last successful login -> LOCKED.
