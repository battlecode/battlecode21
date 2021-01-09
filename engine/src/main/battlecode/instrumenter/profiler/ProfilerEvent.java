package battlecode.instrumenter.profiler;

public class ProfilerEvent {
    private ProfilerEventType type;
    private int at;
    private int frameId;

    public ProfilerEvent(ProfilerEventType type, int at, int frameId) {
        this.type = type;
        this.at = at;
        this.frameId = frameId;
    }

    public ProfilerEventType getType() {
        return type;
    }

    public int getAt() {
        return at;
    }

    public int getFrameId() {
        return frameId;
    }
}
