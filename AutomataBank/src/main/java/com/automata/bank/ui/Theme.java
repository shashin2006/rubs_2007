package com.automata.bank.ui;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
public final class Theme {
    public static final Font TITLE = new Font("SansSerif", Font.BOLD, 26);
    public static final Font SUBTITLE = new Font("SansSerif", Font.PLAIN, 14);
    public static final Font LABEL = new Font("SansSerif", Font.BOLD, 13);
    public static final Font BODY = new Font("SansSerif", Font.PLAIN, 13);
    public static final Color NAVY = new Color(25,45,75);
    private Theme() {}
    public static JPanel panel(int p) { JPanel x=new JPanel(); x.setBorder(new EmptyBorder(p,p,p,p)); x.setBackground(Color.WHITE); return x; }
    public static void styleButton(JButton b) { b.setFont(LABEL); b.setFocusPainted(false); b.setBackground(NAVY); b.setForeground(Color.WHITE); b.setBorder(new EmptyBorder(10,18,10,18)); }
}
