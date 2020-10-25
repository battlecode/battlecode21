package battlecode.instrumenter.stream;

import java.io.IOException;
import java.io.InputStream;

/**
 * Boring input stream.
 */
public class EOFInputStream extends InputStream {
    @Override
    public int read() throws IOException {
        throw new java.io.EOFException();
    }
}
