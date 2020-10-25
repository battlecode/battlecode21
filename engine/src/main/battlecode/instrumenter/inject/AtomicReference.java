package battlecode.instrumenter.inject;

@SuppressWarnings("unused")
public class AtomicReference<V> {

    private V v;

    public AtomicReference() {
    }

    public AtomicReference(V w) {
        v = w;
    }

    public boolean compareAndSet(V e, V u) {
        if (v == e) {
            v = u;
            return true;
        } else
            return false;
    }

    public V get() {
        return v;
    }

    public V getAndSet(V w) {
        V vold = v;
        v = w;
        return vold;
    }

    public void lazySet(V w) {
        v = w;
    }

    public void set(V w) {
        v = w;
    }

    public String toString() {
        if (v == null)
            return "null";
        else
            return v.toString();
    }

    public boolean weakCompareAndSet(V e, V u) {
        return compareAndSet(e, u);
    }

}
