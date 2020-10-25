package battlecode.instrumenter.stream;

import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintStream;

/**
 * Wraps a modifiable print stream so that it can't be accessed.
 */
public class PrintStreamWrapper extends PrintStream {
    public PrintStream wrapped;

    public PrintStreamWrapper() {
        super(new OutputStream() {
            @Override
            public void write(int b) throws IOException {}
        });
        this.wrapped = null;
    }

    public void print(boolean b) { wrapped.print(b); }
    public void print(char c) { wrapped.print(c); }
    public void print(char[] s) { wrapped.print(s); }
    public void print(double d) { wrapped.print(d); }
    public void print(float f) { wrapped.print(f); }
    public void print(int i) { wrapped.print(i); }
    public void print(long l) { wrapped.print(l); }
    public void print(Object obj) { wrapped.print(obj); }
    public void print(String s) { wrapped.print(s); }
    public void println(boolean b) { wrapped.println(b); }
    public void println(char c) { wrapped.println(c); }
    public void println(char[] s) { wrapped.println(s); }
    public void println(double d) { wrapped.println(d); }
    public void println(float f) { wrapped.println(f); }
    public void println(int i) { wrapped.println(i); }
    public void println(long l) { wrapped.println(l); }
    public void println(Object obj) { wrapped.println(obj); }
    public void println(String s) { wrapped.println(s); }
    public void println() { wrapped.println(); }
    public PrintStream append(char c) { this.wrapped.append(c); return this; }
    public PrintStream append(CharSequence csq) { this.wrapped.append(csq); return this; }
    public PrintStream append(CharSequence csq, int start, int end) { this.wrapped.append(csq, start, end); return this; }
    public boolean checkError() { return false; }
    public void setError() { }
    public void close() { this.wrapped.close(); }
    public PrintStream format(String format, Object... args) { this.wrapped.format(format, args); return this; }
    public PrintStream printf(String format, Object... args) { this.wrapped.printf(format, args); return this; }
    public void write(byte[] buf, int off, int len) { this.wrapped.write(buf, off, len); }
    public void write(int b) { this.wrapped.write(b); }
}
