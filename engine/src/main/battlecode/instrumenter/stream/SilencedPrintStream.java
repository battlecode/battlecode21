package battlecode.instrumenter.stream;

import java.io.PrintStream;

/**
 * A singleton PrintStream, that basically doesn't print anything.
 *
 * @author adamd
 */
@SuppressWarnings("unused")
public class SilencedPrintStream extends PrintStream {

    // singleton
    private static SilencedPrintStream theInstance = new SilencedPrintStream();

    private SilencedPrintStream() {
        super(java.lang.System.out);
    }

    public static SilencedPrintStream theInstance() {
        return theInstance;
    }

    //************************
    //*** PRINT METHODS ***
    //************************

    public void print(boolean b) {
    }

    public void print(char c) {
    }

    public void print(char[] s) {
    }

    public void print(double d) {
    }

    public void print(float f) {
    }

    public void print(int i) {
    }

    public void print(long l) {
    }

    public void print(Object obj) {
    }

    public void print(String s) {
    }

    //***************************
    //*** PRINTLN METHODS ***
    //***************************

    public void println(boolean b) {
    }

    public void println(char c) {
    }

    public void println(char[] s) {
    }

    public void println(double d) {
    }

    public void println(float f) {
    }

    public void println(int i) {
    }

    public void println(long l) {
    }

    public void println(Object obj) {
    }

    public void println(String s) {
    }

    //*************************
    //*** MISCELLANEOUS ***
    //*************************

    public PrintStream append(char c) {
        return this;
    }

    public PrintStream append(CharSequence csq) {
        return this;
    }

    public PrintStream append(CharSequence csq, int start, int end) {
        return this;
    }

    public boolean checkError() {
        return false;
    }

    public void setError() {
    }

    public void close() {
        flush();
    }

    public PrintStream format(String format, Object... args) {
        return this;
    }

    public PrintStream printf(String format, Object... args) {
        return this;
    }

    public void write(byte[] buf, int off, int len) {
    }

    public void write(int b) {
    }

}

