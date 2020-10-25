package battlecode.instrumenter.inject;

import battlecode.instrumenter.InstrumentationException;

import static battlecode.instrumenter.InstrumentationException.Type.ILLEGAL;

@SuppressWarnings("unused")
public class Thread extends java.lang.Thread {

    private static Thread INSTANCE = new Thread(false);

    private Thread(boolean b) {
    }

    public Thread() {
        throw new InstrumentationException(ILLEGAL, "You can't start threads; try using multiple robots.");
    }

    public Thread(Runnable r) {
        throw new InstrumentationException(ILLEGAL, "You can't start threads; try using multiple robots.");
    }

    public static Thread currentThread() {
        return INSTANCE;
    }

}
