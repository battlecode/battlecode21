package instrumentertest;

/**
 * @author james
 */
@SuppressWarnings("unused")
public class Reflection {
    static {
        Reflection.class.getClassLoader();
    }
}
