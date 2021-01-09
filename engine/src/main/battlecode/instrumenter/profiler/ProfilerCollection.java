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
  private List<Profiler> profilers = new ArrayList<>();

  private List<String> frames = new ArrayList<>();
  private Map<String, Integer> frameIds = new HashMap<>();

  public Profiler createProfiler(int robotId, RobotType robotType) {
    // The name has to be display-friendly
    String name = String.format("#%s (%s)", robotId, robotType.toString());

    Profiler profiler = new Profiler(name, this::getFrameId);
    profilers.add(profiler);
    return profiler;
  }

  public List<String> getFrames() {
    return frames;
  }

  public List<Profiler> getProfilers() {
    return profilers;
  }

  private int getFrameId(String methodName) {
    if (!frameIds.containsKey(methodName)) {
      frames.add(methodName);
      frameIds.put(methodName, frames.size() - 1);
    }

    return frameIds.get(methodName);
  }
}
