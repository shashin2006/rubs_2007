package com.automata.bank.model;
public record User(int id, String customerId, String pinHash, boolean locked) {}
