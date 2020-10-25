package instrumentertest;

@SuppressWarnings("unused")
public class OverridesToString {
    public String getToString() {
        return this.toString();
    }
    @Override
    public String toString() {
        return "foo";
    }
}
