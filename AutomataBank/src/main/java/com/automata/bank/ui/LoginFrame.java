package com.automata.bank.ui;

import com.automata.bank.automata.CustomerIdDFA;
import com.automata.bank.automata.DFAResult;
import com.automata.bank.auth.AuthenticationFSM;
import com.automata.bank.auth.AuthenticationResult;
import com.automata.bank.db.DatabaseManager;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.security.SecureRandom;
import java.time.LocalDateTime;

public class LoginFrame extends JFrame {
    private final JTextField customerId = new JTextField();
    private final JPasswordField pin = new JPasswordField();
    private final JTextField otp = new JTextField();
    private final JLabel otpInfo = new JLabel("OTP will be generated after valid ID and PIN.");
    private final JLabel status = new JLabel(" ");
    private final TracePanel trace = new TracePanel();
    private final AuthenticationFSM fsm = new AuthenticationFSM();
    private final CustomerIdDFA idDFA = new CustomerIdDFA();

    public LoginFrame(){
        setTitle("Automata-Based Bank Authentication System"); setDefaultCloseOperation(EXIT_ON_CLOSE); setSize(980,650); setLocationRelativeTo(null);
        JPanel root=new JPanel(new BorderLayout(16,16)); root.setBorder(new EmptyBorder(20,20,20,20)); root.setBackground(Color.WHITE);
        root.add(header(),BorderLayout.NORTH); root.add(form(),BorderLayout.WEST); root.add(trace,BorderLayout.CENTER); setContentPane(root);
    }
    private JPanel header(){
        JPanel p=new JPanel(); p.setLayout(new BoxLayout(p,BoxLayout.Y_AXIS)); p.setBackground(Color.WHITE);
        JLabel t=new JLabel("Automata-Based Bank Authentication System"); t.setFont(Theme.TITLE);
        JLabel s=new JLabel("Theory of Computation • DFA Validation • Authentication FSM • Java"); s.setFont(Theme.SUBTITLE);
        p.add(t); p.add(Box.createVerticalStrut(6)); p.add(s); return p;
    }
    private JPanel form(){
        JPanel p=Theme.panel(8); p.setLayout(new GridBagLayout()); p.setPreferredSize(new Dimension(330,0)); GridBagConstraints g=new GridBagConstraints(); g.insets=new Insets(7,7,7,7); g.fill=GridBagConstraints.HORIZONTAL; g.weightx=1;
        add(p,g,0,"Customer ID",customerId); add(p,g,2,"PIN",pin); add(p,g,4,"OTP",otp);
        otpInfo.setFont(new Font("SansSerif",Font.ITALIC,11)); otpInfo.setForeground(new Color(70,70,70)); g.gridx=0;g.gridy=5;g.gridwidth=2;p.add(otpInfo,g);
        JButton gen=new JButton("Generate Demo OTP"); Theme.styleButton(gen); gen.addActionListener(e->generateOtp());
        JButton auth=new JButton("Authenticate"); Theme.styleButton(auth); auth.addActionListener(e->authenticate());
        JButton clear=new JButton("Clear"); clear.addActionListener(e->clear());
        JPanel bs=new JPanel(new GridLayout(3,1,0,8)); bs.setBackground(Color.WHITE); bs.add(gen);bs.add(auth);bs.add(clear);g.gridy=7;p.add(bs,g);
        status.setFont(Theme.LABEL); status.setVerticalAlignment(SwingConstants.TOP); g.gridy=8;g.weighty=1;g.fill=GridBagConstraints.BOTH;p.add(status,g); return p;
    }
    private void add(JPanel p,GridBagConstraints g,int row,String label,JComponent field){
        g.gridx=0;g.gridy=row;g.gridwidth=2;JLabel l=new JLabel(label);l.setFont(Theme.LABEL);p.add(l,g);g.gridy=row+1;field.setFont(Theme.BODY);field.setPreferredSize(new Dimension(250,32));p.add(field,g);
    }
    private void generateOtp(){
        String id=customerId.getText().trim(); String pw=new String(pin.getPassword());
        DFAResult r=idDFA.process(id);
        if(!r.accepted() || DatabaseManager.findUser(id)==null || !DatabaseManager.verifyPin(DatabaseManager.findUser(id),pw)) { status.setText("<html>Valid Customer ID and PIN are required before OTP generation.</html>"); trace.showTrace(r.trace()); return; }
        String code=String.format("%06d",new SecureRandom().nextInt(1_000_000)); DatabaseManager.saveOtp(id,code,LocalDateTime.now().plusMinutes(2));
        otpInfo.setText("Demo OTP: "+code+" (valid for 2 minutes)"); status.setText("<html>OTP generated. Enter it and authenticate.</html>");
    }
    private void authenticate(){
        AuthenticationResult r=fsm.authenticate(customerId.getText().trim(),new String(pin.getPassword()),otp.getText().trim()); trace.showTrace(r.stateTrace());
        status.setText("<html><b>Final State:</b> "+r.finalState()+"<br><b>Failed Attempts:</b> "+r.failedAttempts()+"<br>"+r.message()+"</html>");
        if(r.success()) JOptionPane.showMessageDialog(this,"Authentication successful!\nWelcome to the demo banking dashboard.","Authenticated",JOptionPane.INFORMATION_MESSAGE);
        else if(r.finalState().name().equals("LOCKED")) JOptionPane.showMessageDialog(this,"Account locked after three failed attempts.","Account Locked",JOptionPane.ERROR_MESSAGE);
    }
    private void clear(){customerId.setText("");pin.setText("");otp.setText("");otpInfo.setText("OTP will be generated after valid ID and PIN.");status.setText(" ");trace.clear();}
}
