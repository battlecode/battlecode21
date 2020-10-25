package instrumentertest;

/**
 * Used to test hashCode instrumentation.
 *
 * @author james
 */
@SuppressWarnings("unused")
public class DoesntOverrideHashCode {
    // We need to be able to make sure that calls to hashcode are instrumented correctly.
    public int getHashCode() {
        return this.hashCode();
    }
}
