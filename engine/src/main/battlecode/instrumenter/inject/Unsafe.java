package battlecode.instrumenter.inject;

import java.lang.reflect.Field;

/**
 * Do-nothing replacement for sun.misc.Unsafe.  Used by Random.
 */
@SuppressWarnings("unused")
public class Unsafe {

    private Unsafe() {
    }

    private static Unsafe instance = new Unsafe();

    public static Unsafe getUnsafe() {
        return instance;
    }

    public long objectFieldOffset(Field f) {
        return 0;
    }

    public void putObjectVolatile(Object o, long offset, Object x) {
    }

}
