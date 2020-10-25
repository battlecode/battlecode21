package battlecode.instrumenter.stream;

import battlecode.common.RobotType;
import battlecode.common.Team;

import java.io.OutputStream;
import java.io.PrintStream;
import java.io.UnsupportedEncodingException;

/**
 * RoboPrintStream is a wrapper for System.out that prepends a string identifying the current robot to
 * all outputted strings.  Also, RoboPrintStream will silence all output if the robot should be silenced.
 *
 * @author adamd
 */
@SuppressWarnings("unused")
public class RoboPrintStream extends PrintStream {

    private final LimitedPrintStream real;

    private boolean headerThisRound;
    private Team team;
    private RobotType type;
    private int id;
    private int round;

    private boolean writeToSystemOut;

    // if maxOutputBytes is -1, then it is treated as no limit
    public RoboPrintStream(OutputStream robotOut, boolean writeToSystemOut, int maxOutputBytes) throws UnsupportedEncodingException {
        super(SilencedPrintStream.theInstance());
        this.real = new LimitedPrintStream(robotOut, true, "UTF-8", maxOutputBytes);
        this.headerThisRound = false;
        this.writeToSystemOut = writeToSystemOut;
    }

    //************************
    //*** PRINT METHODS ***
    //************************

    public void print(boolean b) {
        String header = getHeader();
        real.print(header + b);
        if (this.writeToSystemOut) java.lang.System.out.print(header + b);
    }

    public void print(char c) {
        String header = getHeader();
        real.print(header + c);
        if (this.writeToSystemOut) java.lang.System.out.print(header + c);
    }

    public void print(char[] s) {
        String header = getHeader();
        real.print(header + s);
        if (this.writeToSystemOut) java.lang.System.out.print(header + s);
    }

    public void print(double d) {
        String header = getHeader();
        real.print(header + d);
        if (this.writeToSystemOut) java.lang.System.out.print(header + d);
    }

    public void print(float f) {
        String header = getHeader();
        real.print(header + f);
        if (this.writeToSystemOut) java.lang.System.out.print(header + f);
    }

    public void print(int i) {
        String header = getHeader();
        real.print(header + i);
        if (this.writeToSystemOut) java.lang.System.out.print(header + i);
    }

    public void print(long l) {
        String header = getHeader();
        real.print(header + l);
        if (this.writeToSystemOut) java.lang.System.out.print(header + l);
    }

    public void print(Object obj) {
        String header = getHeader();
        real.print(header + obj);
        if (this.writeToSystemOut) java.lang.System.out.print(header + obj);
    }

    public void print(String s) {
        String header = getHeader();
        real.print(header + s);
        if (this.writeToSystemOut) java.lang.System.out.print(header + s);
    }

    //***************************
    //*** PRINTLN METHODS ***
    //***************************

    public void println(boolean b) {
        String header = getHeader();
        real.println(header + b);
        if (this.writeToSystemOut) java.lang.System.out.println(header + b);
    }

    public void println(char c) {
        String header = getHeader();
        real.println(header + c);
        if (this.writeToSystemOut) java.lang.System.out.println(header + c);
    }

    public void println(char[] s) {
        String header = getHeader();
        real.println(header + s);
        if (this.writeToSystemOut) java.lang.System.out.println(header + s);
    }

    public void println(double d) {
        String header = getHeader();
        real.println(header + d);
        if (this.writeToSystemOut) java.lang.System.out.println(header + d);
    }

    public void println(float f) {
        String header = getHeader();
        real.println(header + f);
        if (this.writeToSystemOut) java.lang.System.out.println(header + f);
    }

    public void println(int i) {
        String header = getHeader();
        real.println(header + i);
        if (this.writeToSystemOut) java.lang.System.out.println(header + i);
    }

    public void println(long l) {
        String header = getHeader();
        real.println(header + l);
        if (this.writeToSystemOut) java.lang.System.out.println(header + l);
    }

    public void println(Object obj) {
        String header = getHeader();
        real.println(header + obj);
        if (this.writeToSystemOut) java.lang.System.out.println(header + obj);
    }

    public void println(String s) {
        String header = getHeader();
        real.println(header + s);
        if (this.writeToSystemOut) java.lang.System.out.println(header + s);
    }

    public void println() {
        String header = getHeader();
        real.println(header);
        if (this.writeToSystemOut) java.lang.System.out.println(header);
    }


    //*************************
    //*** MISCELLANEOUS ***
    //*************************

    public PrintStream append(char c) {
        String header = getHeader();
        real.print(header + c);
        if (this.writeToSystemOut) java.lang.System.out.print(header + c);
        return this;
    }

    public PrintStream append(CharSequence csq) {
        String header = getHeader();
        real.print(header + csq);
        if (this.writeToSystemOut) java.lang.System.out.print(header + csq);
        return this;
    }

    public PrintStream append(CharSequence csq, int start, int end) {
        String header = getHeader();
        real.print(header + csq.subSequence(start, end).toString());
        if (this.writeToSystemOut) java.lang.System.out.print(header + csq.subSequence(start, end).toString());
        return this;
    }

    public boolean checkError() {
        return false;
    }

    public void setError() {}

    public void close() {
        flush();
    }

    public PrintStream format(String format, Object... args) {
        String header = getHeader();
        real.print(header + String.format(format, args));
        if (this.writeToSystemOut) java.lang.System.out.print(header + String.format(format, args));
        return this;
    }

    public PrintStream printf(String format, Object... args) {
        String header = getHeader();
        real.printf(header + format, args);
        if (this.writeToSystemOut) java.lang.System.out.printf(header + format, args);
        return this;
    }

    public void write(byte[] buf, int off, int len) {
        byte[] header = getHeader().getBytes();
        byte[] buf2 = new byte[header.length + buf.length];
        System.arraycopy(header, 0, buf2, 0, header.length);
        System.arraycopy(buf, off, buf2, header.length, len);
        real.write(buf2, 0, header.length + len);
        if (this.writeToSystemOut) java.lang.System.out.write(buf2, 0, header.length + len);
    }

    public void write(int b) {
        String s = getHeader() + (char) b;
        byte[] buf = s.getBytes();
        real.write(buf, 0, buf.length);
        if (this.writeToSystemOut) java.lang.System.out.write(buf, 0, buf.length);
    }

    //**************************
    //*** HELPER METHODS ***
    //**************************

    /**
     * Update the header prepended to messages printed with the stream.
     *
     * @param team
     * @param type
     * @param id
     * @param round
     */
    public void updateHeader(Team team, RobotType type, int id, int round) {
        this.team = team;
        this.type = type;
        this.id = id;
        this.round = round;
        this.headerThisRound = false;
        this.real.setTeam(team);
    }

    private String getHeader() {
        String s = "[" + team + ":" + type + "#" + id + "@" + round + "] ";
        real.increaseByteLimit(s.length());
        return s;
    }
}
