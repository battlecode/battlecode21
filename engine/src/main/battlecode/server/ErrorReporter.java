package battlecode.server;

// TODO: pass messages along to the client
public class ErrorReporter {

    // reports the error, and tells the contestant to contact the devs
    public static void report(Throwable e) {
        report(e, true);
    }

    public static void report(String message) {
        report(message, true);
    }

    public static void report(Throwable e, String message, boolean ourFault) {
        Server.warn(e.getMessage());
        Server.warn(message);
        printStackTrace(e);
        if (ourFault) {
            printReportString();
        }
    }

    public static void report(String message, boolean ourFault) {
        report(new Error("(Stacktrace Error)"), message, ourFault);
    }

    public static void report(String message, String thingsToTry) {
        Server.warn(message + "\n\n");
        printThingsToTry(thingsToTry);
    }

    public static void report(Throwable e, boolean ourFault) {
        printStackTrace(e);
        if (ourFault) {
            Server.warn("\n\n");
            printReportString();
        }
    }

    private static void printStackTrace(Throwable e) {
        System.err.println("Stack trace: ");
        e.printStackTrace(System.err);
    }

    private static void printThingsToTry(String thingsToTry) {
        Server.warn("Please try the following:");
        Server.warn(thingsToTry);
        Server.warn("\n\nIf that doesn't work....");
        printReportString();
    }

    private static void printReportString() {
        Server.warn(String.format("java version \"%s\"\n", System.getProperty("java.version")));
        Server.warn(String.format("%s (build %s, %s)\n\n", System.getProperty("java.vm.name"), System.getProperty("java.vm.version"), System.getProperty("java.vm.info")));
        Server.warn("Please report this to the 6.370 devs, by posting to the forum\n"
                + "under the \"bugs\" thread.  Include a copy of this printout and\n"
                + "a brief description of the bug, including whether it's consistent\n"
                + "or sporadic.  Thanks!");
    }
}
