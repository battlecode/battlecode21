package battlecode.instrumenter.bytecode;

import battlecode.instrumenter.TeamClassLoaderFactory;
import org.objectweb.asm.ClassReader;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;
import java.util.StringTokenizer;

import static org.objectweb.asm.ClassReader.SKIP_DEBUG;

/**
 * MethodCostUtil is a singleton used for looking up MethodData associated with some methods.
 *
 * It is never used to load player classes.
 *
 * @author adamd
 */
public class MethodCostUtil {

    private MethodCostUtil() {
    }

    /**
     * The file to load method data from.
     */
    private final static String RESOURCE_FILE = "resources/MethodCosts.txt";

    /**
     * This is a map from method names (in the format 'ClassName/methodName'), to the MethodData associated with each method.
     */
    private final static Map<String, MethodData> methodCosts;

    /**
     * This is a map from binary class names, to all the classes/interfaces that the class transitively implements/extends.
     */
    private final static Map<String, String[]> interfacesMap;

    /**
     * A struct that stores data about a method -- what its lookup bytecode cost is, and whether it should end the basic block or not.
     */
    public static class MethodData {
        public final int cost;
        public final boolean shouldEndRound;

        public MethodData(int cost, boolean shouldEndRound) {
            this.cost = cost;
            this.shouldEndRound = shouldEndRound;
        }
    }

    static {
        BufferedReader reader;
        String line;

        methodCosts = new HashMap<>();
        // load method costs
        try {
            reader = new BufferedReader(new InputStreamReader(
                    MethodCostUtil.class.getResourceAsStream(RESOURCE_FILE)
            ));
            while ((line = reader.readLine()) != null) {
                StringTokenizer st = new StringTokenizer(line);
                if (st.countTokens() != 3)
                    ClassReferenceUtil.fileLoadError(RESOURCE_FILE);
                methodCosts.put(st.nextToken(), new MethodData(Integer.parseInt(st.nextToken()), Boolean.parseBoolean(st.nextToken())));
            }
        } catch (IOException e) {
            ClassReferenceUtil.fileLoadError(RESOURCE_FILE);
        }

        interfacesMap = new HashMap<>();
    }

    /**
     * Returns the MethodData associated with the given method, or null if no MethodData exists for the given method.
     * Should not be called on player classes.
     *  @param className  the binary name of the class to which the given method belongs
     * @param methodName the name of the given class
     */
    public static MethodData getMethodData(String className, String methodName) {
        if (className.charAt(0) == '[')
            return null;
        String key = className + "/" + methodName;

        if (methodCosts.containsKey(key))
            return methodCosts.get(key);

        String[] interfaces;
        if (interfacesMap.containsKey(className))
            interfaces = interfacesMap.get(className);
        else {
            ClassReader cr = TeamClassLoaderFactory.normalReader(className);
            InterfaceReader ir = new InterfaceReader(null);
            cr.accept(ir, SKIP_DEBUG);
            interfaces = ir.getInterfaces();
            interfacesMap.put(className, interfaces);
        }

        for (String anInterface : interfaces) {
            key = anInterface + "/" + methodName;
            if (methodCosts.containsKey(key))
                return methodCosts.get(key);
        }

        return null;
    }


}
