package battlecode.instrumenter.stream;

import battlecode.common.GameConstants;
import battlecode.common.Team;

import java.io.PrintStream;
import java.io.OutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;

/**
 * LimitedPrintStream is a subclass of PrintStream that limits the total amount of output that a team
 * may produce. Any excess output exceeding these limits are ignored.
 *
 * @author j-mao
 */
@SuppressWarnings("unused")
public class LimitedPrintStream extends PrintStream {

    private static final String TRUNCATION_MESSAGE = "[output truncated due to team output limit]\n";
    private static int[] limit = {-1, -1, -1}; // -1 means no limit
    private static boolean[] reportedTruncation = {false, false, false};

    private Team team;
    private boolean byteCounting;

    public LimitedPrintStream(OutputStream out, boolean autoFlush, String encoding, int maxOutputBytes) throws UnsupportedEncodingException {
        super(out, autoFlush, encoding);
        byteCounting = true;
        if (limit[0] == -1) // means it is not set yet
            limit[0] = maxOutputBytes;
        if (limit[1] == -1) // means it is not set yet
            limit[1] = maxOutputBytes;
        if (limit[2] == -1) // means it is not set yet
            limit[2] = maxOutputBytes;
    }

    @Override
    public void write(byte[] b) {
        int printSize = java.lang.Math.min(b.length, getRemainingByteLimit());
        if (printSize > 0) {
            subtractBytesFromLimit(printSize);
            try {
                out.write(b, 0, printSize);
            } catch (IOException x) {
            }
        }
        if (printSize < b.length) {
            reportTruncation();
        }
    }

    @Override
    public void write(int b) {
        if (getRemainingByteLimit() > 0) {
            subtractBytesFromLimit(1);
            try {
                out.write(b);
            } catch (IOException x) {
            }
        } else {
            reportTruncation();
        }
    }

    @Override
    public void write(byte[] b, int off, int len) {
        int printSize = java.lang.Math.min(len, getRemainingByteLimit());
        if (printSize > 0) {
            subtractBytesFromLimit(printSize);
            try {
                out.write(b, off, printSize);
            } catch (IOException x) {
            }
        }
        if (printSize < len) {
            reportTruncation();
        }
    }

    public void increaseByteLimit(int x) {
        if (limit[getArrayIndex()] > 0)
            limit[getArrayIndex()] += x;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public void setByteCountingStatus(boolean byteCounting) {
        this.byteCounting = byteCounting;
    }

    private int getArrayIndex() {
        switch (this.team) {
            case A:
                return 0;
            case B:
                return 1;
            default:
                return 2;
        }
    }

    private int getRemainingByteLimit() {
        int result = limit[getArrayIndex()];
        // -1 is infinity
        if (limit[getArrayIndex()] == -1) {
            result = Integer.MAX_VALUE;
        }
        // Even if we're not counting bytes, allow no headers to escape if completely exhausted
        if (!this.byteCounting && result > 0) {
            result = Integer.MAX_VALUE;
        }
        return result;
    }

    private void subtractBytesFromLimit(int bytes) {
        if (!this.byteCounting) {
            return;
        }
        // -1 is infinity
        if (limit[getArrayIndex()] == -1) {
            return;
        }
        limit[getArrayIndex()] = java.lang.Math.max(limit[getArrayIndex()]-bytes,0);
    }

    private void reportTruncation() {
        int index = getArrayIndex();
        if (!reportedTruncation[index]) {
            reportedTruncation[index] = true;
            try {
                out.write(TRUNCATION_MESSAGE.getBytes(), 0, TRUNCATION_MESSAGE.length());
            } catch (IOException e) {
            }
        }
    }
}
