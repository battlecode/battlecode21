package instrumentertest;

/**
 * @author james
 */
@SuppressWarnings("unused")
public class OverridesHashCode {
    public int getHashCode() {
        return this.hashCode();
    }
    @Override
    public int hashCode() {
        return 57;
    }
}
