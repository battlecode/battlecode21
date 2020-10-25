package instrumentertest;

import battlecode.common.Team;

import java.util.EnumMap;
import java.util.Map;

/**
 * @author james
 */
@SuppressWarnings("unused")
public class UsesEnumMap {
    // This is allowed, even though using a Class<?> for anything else isn't.
    public static final Map<Team, Integer> enumMap = new EnumMap<>(Team.class);
}
