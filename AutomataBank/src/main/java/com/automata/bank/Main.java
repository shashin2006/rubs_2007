package com.automata.bank;

import com.automata.bank.db.DatabaseManager;
import com.automata.bank.ui.LoginFrame;
import javax.swing.SwingUtilities;

public class Main {
    public static void main(String[] args) {
        DatabaseManager.initialize();
        SwingUtilities.invokeLater(() -> new LoginFrame().setVisible(true));
    }
}
