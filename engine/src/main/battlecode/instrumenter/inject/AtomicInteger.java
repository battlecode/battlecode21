package battlecode.instrumenter.inject;

@SuppressWarnings("unused")
public class AtomicInteger {

    private int l;

    public AtomicInteger() {
    }

    public AtomicInteger(int x) {
        l = x;
    }

    public int get() {
        return l;
    }

    public void set(int x) {
        l = x;
    }

    public boolean compareAndSet(int expect, int update) {
        boolean b = (l == expect);
        if (b) l = update;
        return b;
    }

    public int incrementAndGet() {
        return ++l;
    }

    public int decrementAndGet() {
        return --l;
    }

}
