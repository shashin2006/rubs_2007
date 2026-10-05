# Suggested Test Cases

1. CSE1234 -> ID DFA accepts.
2. CSX1234 -> ID DFA rejects.
3. CSE123 -> ID DFA rejects.
4. 1234 -> PIN DFA accepts.
5. 123 -> PIN DFA rejects.
6. Six digits -> OTP DFA accepts.
7. Five digits -> OTP DFA rejects.
8. CSE1234 + 1234 + generated OTP -> AUTHENTICATED.
9. Wrong PIN -> REJECTED.
10. Wrong OTP -> REJECTED.
11. Three consecutive failures -> LOCKED.
