package battlecode.instrumenter.bytecode;

import battlecode.instrumenter.InstrumentationException;
import battlecode.instrumenter.TeamClassLoaderFactory;
import battlecode.server.ErrorReporter;
import org.objectweb.asm.Type;
import org.objectweb.asm.signature.SignatureReader;
import org.objectweb.asm.signature.SignatureWriter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashSet;
import java.util.Set;

import static battlecode.instrumenter.InstrumentationException.Type.ILLEGAL;
import static battlecode.instrumenter.InstrumentationException.Type.MISSING;

/**
 * ClassReferenceUtil provides utility methods for resolving class names during
 * instrumentation.
 *
 * @author adamd
 */
public class ClassReferenceUtil {

    /**
     * The resource, relative to this .java/.class file, to load allowed packages from
     */
    private final static String ALLOWED_RESOURCE_FILE = "resources/AllowedPackages.txt";

    /**
     * The resource, relative to this .java/.class file, to load disallowed packages from
     */
    private final static String DISALLOWED_RESOURCE_FILE = "resources/DisallowedClasses.txt";

    /**
     * Packages for which the player is allowed to use any of the contained classes;
     * loaded from AllowedPackages.txt
     */
    private final static Set<String> allowedPackages;

    /**
     * Classes the player is not allowed to use; loaded from DisallowedClasses.txt
     */
    private final static Set<String> disallowedClasses;

    // We can't instrument these classes because they have native methods.  Java won't allow us
    // to create an instrumented class that has the same prefix as a builtin class, so we have to
    // change the name.  But when we rename the class, it can't use the old class's native methods any more.
    // This might have issues so for now I'm just not instrumenting java.io
    // private final static Set<String> uninstrumentedClasses;

    private final TeamClassLoaderFactory factory;

    public ClassReferenceUtil(TeamClassLoaderFactory factory) {
        this.factory = factory;
    }

    static void fileLoadError(String filename) {
        ErrorReporter.report(String.format("Error loading %s",filename),
                String.format("Check that the '%s' file exists and is not corrupted.",filename));
        throw new InstrumentationException(MISSING, "Error loading "+filename);
    }

    // the static constructor basically loads the whitelist files and caches them in allowedPackages and disallowedClasses
    static {
        BufferedReader reader;
        String line;

        allowedPackages = new HashSet<>();
        disallowedClasses = new HashSet<>();

        // load allowed packages
        try {
            reader = new BufferedReader(new InputStreamReader(
                    ClassReferenceUtil.class.getResourceAsStream(ALLOWED_RESOURCE_FILE)
            ));
            while ((line = reader.readLine()) != null) {
                allowedPackages.add(line);
            }
        } catch (Exception e) {
            fileLoadError(ALLOWED_RESOURCE_FILE);
        }

        // load disallowed classes
        try {
            reader = new BufferedReader(new InputStreamReader(
                    ClassReferenceUtil.class.getResourceAsStream(DISALLOWED_RESOURCE_FILE)
            ));
            while ((line = reader.readLine()) != null) {
                disallowedClasses.add(line);
            }
        } catch (Exception e) {
            fileLoadError(DISALLOWED_RESOURCE_FILE);
        }
    }

    protected static boolean isInAllowedPackage(String className) {
        int dotIndex = className.lastIndexOf('/');
        if (dotIndex == -1) return false;
        return allowedPackages.contains(className.substring(0, dotIndex));
    }

    private boolean shouldAddInstrumentedPrefix(String className) {
        if (className.startsWith("battlecode/")) {
            return className.equals("battlecode/instrumenter/inject/InstrumentableFunctions");
        }

        if (className.startsWith("instrumented/"))
            return false;

        if (className.startsWith("java/util/invoke") || // Don't override JVM internals
                className.startsWith("java/util/jar") ||
                className.startsWith("java/util/zip") ||
                className.equals("java/util/Iterator") ||
                className.equals("java/util/concurrent/TimeUnit"))
            return false;

        if (className.startsWith("java/util/") ||
                className.startsWith("java/math/"))
            return true;

        if (className.startsWith("kotlin/")) { // Kotlin standard library is counted is player code
            return !className.equals("kotlin/jvm/internal/Intrinsics"); // except Intrinsics which is free
        }

        if (className.startsWith("sun/") ||
                className.startsWith("com/") ||
                className.startsWith("java/"))
            return false;

        return true;
    }

    /**
     * Registers a class reference, and may replace the reference with a reference to a different class.  This method always returns
     * a class that should be referenced, even if the return value is the same as the given <code>className</code>.  If this class has not been
     * referenced previously, the next call to flushNewlyReferencedClasses will return an array containing the given class (among others).
     * <p/>
     * If cR = classReference(cN,tPN,s,cD), then it should always be the case that
     * cR == classReference(cR,tPN,s,cD).  If cR starts with instrumented/, then it should
     * also always be the case that cR == classReference(cR.substring(13),tPN,s,cD).
     *
     * @param className       the name of the class that was referenced, in fully qualified form (e.g., "team666/navigation/Navigator")
     * @return the name of the class that should replace this reference, in fully qualified form
     * @throws InstrumentationException if the class reference is not allowed
     */
    public String classReference(String className, boolean checkDisallowed) {
        if (className == null) return null;

        if (className.charAt(0) == '[') {
            int arrayIndex = className.lastIndexOf('[');
            if (className.charAt(arrayIndex + 1) == 'L') {
                String extractedClassName = className.substring(arrayIndex + 2, className.length() - 1);
                return className.substring(0, arrayIndex + 2) + classReference(extractedClassName, checkDisallowed) + ";";
            } else {
                return className;
            }
        } else if (factory.hasTeamClass(className))
            return className;
        else if (className.equals("java/lang/System"))
            return "battlecode/instrumenter/inject/System";
        else if (className.equals("java/util/concurrent/ConcurrentHashMap"))
            return "battlecode/instrumenter/inject/ConcurrentHashMap";
        else if (className.equals("java/util/concurrent/atomic/AtomicInteger"))
            return "battlecode/instrumenter/inject/AtomicInteger";
        else if (className.equals("java/util/concurrent/atomic/AtomicLong"))
            return "battlecode/instrumenter/inject/AtomicLong";
        else if (className.equals("java/util/concurrent/atomic/AtomicReference"))
            return "battlecode/instrumenter/inject/AtomicReference";
        else if (className.equals("sun/misc/Unsafe"))
            return "battlecode/instrumenter/inject/Unsafe";

        if (checkDisallowed) {
            if (disallowedClasses.contains(className) || !isInAllowedPackage(className)) {
                throw new InstrumentationException(ILLEGAL, "Illegal class: " + className + "\n    this class cannot be referenced by player code.");
            }
        }
        if (className.equals("java/security/SecureRandom")) {
            return "instrumented/java/util/Random";
        }

        if (shouldAddInstrumentedPrefix(className)) {
            return "instrumented/" + className;
        }

        else
            return className;
    }

    /**
     * Registers a class reference (see <code>classReference(...)</code>), but with the class name in a different format (descriptor, instead
     * of binary form).
     *
     * @param classDesc       descriptor of the class that was referenced (e.g., "Lteam666/navigation/Navigator;")
     * @throws InstrumentationException if the class reference is not allowed.
     */

    public String classDescReference(String classDesc, boolean checkDisallowed) {
        if (classDesc == null)
            return null;
        if (classDesc.charAt(0) == 'L') {
            return "L" + classReference(classDesc.substring(1, classDesc.length() - 1), checkDisallowed) + ";";
        } else if (classDesc.charAt(0) == '[') {
            int arrayIndex = classDesc.lastIndexOf('[');
            return classDesc.substring(0, arrayIndex + 1) + classDescReference(classDesc.substring(arrayIndex + 1, classDesc.length()), checkDisallowed);
        } else {
            return classDesc;
        }
    }

    /**
     * Registers all the class references in a method descriptor, and replaces references as if classReference were called on each individual
     * reference.
     *
     * @param methodDesc      descriptor for the method that was referenced (e.g., "(Ljava/util/Map;Z)Ljava/util/Set;")
     * @throws InstrumentationException if any of the class references contained the the method descriptor are not allowed.
     */
    public String methodDescReference(String methodDesc, boolean checkDisallowed) {
        String ret = "(";

        Type[] argTypes = Type.getArgumentTypes(methodDesc);
        for (Type argType : argTypes) {
            if (argType.getSort() == Type.ARRAY || argType.getSort() == Type.OBJECT)
                ret = ret + classDescReference(argType.toString(), checkDisallowed);
            else
                ret = ret + argType.toString();
        }

        ret = ret + ")";

        Type returnType = Type.getReturnType(methodDesc);
        if (returnType.getSort() == Type.ARRAY || returnType.getSort() == Type.OBJECT)
            ret = ret + classDescReference(returnType.toString(), checkDisallowed);
        else
            ret = ret + returnType.toString();

        return ret;
    }

    public String methodSignatureReference(String signature, boolean checkDisallowed) {
        if (signature == null) return null;
        BattlecodeSignatureWriter writer = new BattlecodeSignatureWriter(checkDisallowed);
        SignatureReader reader = new SignatureReader(signature);
        reader.accept(writer);
        return writer.toString();
    }

    public String fieldSignatureReference(String signature, boolean checkDisallowed) {
        if (signature == null) return null;
        BattlecodeSignatureWriter writer = new BattlecodeSignatureWriter(checkDisallowed);
        SignatureReader reader = new SignatureReader(signature);
        reader.acceptType(writer);
        return writer.toString();
    }

    private class BattlecodeSignatureWriter extends SignatureWriter {
        boolean checkDisallowed;

        public BattlecodeSignatureWriter(boolean checkDisallowed) {
            this.checkDisallowed = checkDisallowed;
        }

        public void visitClassType(String name) {
            super.visitClassType(classReference(name, checkDisallowed));
        }

    }
}
