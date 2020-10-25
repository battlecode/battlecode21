package instrumentertest;

import java.io.PrintStream;

@SuppressWarnings("unused")
public class CallsIllegalMethods {
    public static class CallsWait {
        static {
            try {
                new Object().wait();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
    }

    public static class CallsClassForName {
        static {
            try {
                Class.forName("???");
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
    }

    public static class CallsStringIntern {
        static {
            try {
                "???".intern();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
    }

    public static class CallsSystemNanoTime {
        static {
            try {
                System.nanoTime();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
    }

    public static class CreatesFilePrintStream {
        static {
            try {
                new PrintStream("???");
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
    }

}
