package battlecode.instrumenter.inject;

// Fake AtomicLong class, needed by java.util.Random.
@SuppressWarnings("unused")
public class AtomicLong {

    private long l;

    public AtomicLong() {
    }

    public AtomicLong(long x) {
        l = x;
    }

    public long get() {
        return l;
    }

    public void set(long x) {
        l = x;
    }

    public boolean compareAndSet(long expect, long update) {
        boolean b = (l == expect);
        if (b) l = update;
        return b;
    }

    public long incrementAndGet() {
        return ++l;
    }

    public long getAndIncrement() {
        return l++;
    }

}
