package instrumentertest;

/**
 * @author james
 */
@SuppressWarnings("unused")
public class UsesThrowable {
    public static void run() {
        Throwable t = new Exception();
        t.printStackTrace();
    }
}
