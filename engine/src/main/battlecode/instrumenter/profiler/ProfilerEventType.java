package battlecode.instrumenter.profiler;

public enum ProfilerEventType {
    OPEN("O"), CLOSE("C");

    private final String value;

    ProfilerEventType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
