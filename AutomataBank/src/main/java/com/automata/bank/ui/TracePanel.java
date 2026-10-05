package com.automata.bank.ui;
import javax.swing.*;
import javax.swing.border.TitledBorder;
import java.awt.*;
import java.util.List;
public class TracePanel extends JPanel {
    private final JTextArea area = new JTextArea();
    public TracePanel(){ setLayout(new BorderLayout()); setBorder(new TitledBorder("Automata / FSM Transition Trace")); area.setEditable(false); area.setFont(new Font("Monospaced",Font.PLAIN,12)); add(new JScrollPane(area),BorderLayout.CENTER); }
    public void showTrace(List<String> trace){ area.setText(String.join("\n",trace)); }
    public void clear(){ area.setText(""); }
}
