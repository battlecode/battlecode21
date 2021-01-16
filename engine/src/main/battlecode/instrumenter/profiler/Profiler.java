package battlecode.instrumenter.profiler;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/**
 * The Profiler class profiles bytecode usage in a sandboxed robot player.
 * It is called by the instrumenter through RobotMonitor and only profiles
 * down to methods created by the player (e.g. it won't show the amount of
 * bytecode an ArrayList.add() call costs).
 * <p>
 * Data is stored in such a way that it is easy to convert it to a file
 * compatible with speedscope (https://github.com/jlfwong/speedscope)
 * which is used in the client to show the profiling data. See
 * https://github.com/jlfwong/speedscope/wiki/Importing-from-custom-sources
 * for more information on speedscope's file format.
 */
public class Profiler {
    private final ProfilerCollection collection;
    private final String name;

    private int bytecodeCounter = 0;

    private final List<ProfilerEvent> events = new ArrayList<>();
    private final Deque<Integer> openFrameIds = new ArrayDeque<>();

    public Profiler(ProfilerCollection collection, String name) {
        this.collection = collection;
        this.name = name;
    }

    public void incrementBytecodes(int amount) {
        try {
            bytecodeCounter = Math.addExact(bytecodeCounter, amount);
        } catch (ArithmeticException e) {
            bytecodeCounter = Integer.MAX_VALUE;
        }
    }

    public void enterMethod(String methodName) {
        if (!collection.isRecordingEvents()) {
            return;
        }

        if (methodName.startsWith("instrumented.")) {
            return;
        }

        collection.recordEvent();

        int frameId = collection.getFrameId(methodName);

        events.add(new ProfilerEvent(ProfilerEventType.OPEN, bytecodeCounter, frameId));
        openFrameIds.addFirst(frameId);
    }

    public void exitMethod(String methodName) {
        if (openFrameIds.isEmpty() && !collection.isRecordingEvents()) {
            return;
        }

        if (methodName.startsWith("instrumented.")) {
            return;
        }

        events.add(new ProfilerEvent(ProfilerEventType.CLOSE, bytecodeCounter, collection.getFrameId(methodName)));
        openFrameIds.pop();
    }

    public void exitOpenMethods() {
        while (!openFrameIds.isEmpty()) {
            events.add(new ProfilerEvent(ProfilerEventType.CLOSE, bytecodeCounter, openFrameIds.pop()));
        }
    }

    public String getName() {
        return name;
    }

    public List<ProfilerEvent> getEvents() {
        return events;
    }
}
