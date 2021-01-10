package battlecode.instrumenter.profiler;

import battlecode.common.RobotType;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * A ProfilerCollection is a collection of all Profiler instances for a team for a match.
 */
public class ProfilerCollection {
    /**
     * We record a maximum of 10,000,000 events per team per match.
     * This equals a rough maximum of 250MB of profiling data per match,
     * which should prevent the client from hanging when opening a replay
     * of a match in which profiling was enabled.
     */
    private static final int MAX_EVENTS_TO_RECORD = 10_000_000;

    private List<Profiler> profilers = new ArrayList<>();

    private List<String> frames = new ArrayList<>();
    private Map<String, Integer> frameIds = new HashMap<>();

    public int recordedEvents = 0;

    public Profiler createProfiler(int robotId, RobotType robotType) {
        // The name has to be display-friendly
        String name = String.format("#%s (%s)", robotId, robotType.toString());

        Profiler profiler = new Profiler(this, name);
        profilers.add(profiler);

        return profiler;
    }

    public List<String> getFrames() {
        return frames;
    }

    public List<Profiler> getProfilers() {
        return profilers;
    }

    public int getFrameId(String methodName) {
        if (!frameIds.containsKey(methodName)) {
            frames.add(methodName);
            frameIds.put(methodName, frames.size() - 1);
        }

        return frameIds.get(methodName);
    }

    public void recordEvent() {
        recordedEvents++;
    }

    public boolean isRecordingEvents() {
        return recordedEvents < MAX_EVENTS_TO_RECORD;
    }
}
