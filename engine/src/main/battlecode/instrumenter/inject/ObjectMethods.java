package battlecode.instrumenter.inject;

import org.hibernate.search.util.WeakIdentityHashMap;

import java.lang.reflect.Method;
import java.util.HashMap;

@SuppressWarnings("unused")
public class ObjectMethods {

    static final Method objectHashCode;
    static final Method enumHashCode;
    static final Method characterHashCode;

    static final Method objectToString;

    static {
        Method tmpo = null, tmpe = null, tmpc = null, tmps = null;
        try {
            tmpo = Object.class.getMethod("hashCode");
            tmpe = Enum.class.getMethod("hashCode");
            tmpc = Character.class.getMethod("hashCode");
            tmps = Object.class.getMethod("toString");
        } catch (Exception e) {
            throw new RuntimeException("Can't load needed functions", e);
        }

        objectHashCode = tmpo;
        enumHashCode = tmpe;
        characterHashCode = tmpc;
        objectToString = tmps;
    }

    static int lastHashCode = -1;

    static WeakIdentityHashMap<Object, Integer> codes = new WeakIdentityHashMap<>();

    // reflection is slow so cache the results
    static HashMap<Class, Boolean> usesOHC = new HashMap<>();
    static HashMap<Class, Boolean> usesOTS = new HashMap<>();

    static public int hashCode(Object o) throws NoSuchMethodException {
        if (usesObjectHashCode(o.getClass()))
            return identityHashCode(o);
        else
            return o.hashCode();
    }

    static public String toString(Object o) throws NoSuchMethodException {
        if (usesObjectToString(o.getClass()))
            return identityToString(o);
        else
            return o.toString();
    }

    static private boolean usesObjectHashCode(Class<?> cl) throws NoSuchMethodException {
        Boolean b = usesOHC.get(cl);
        if (b == null) {
            Method hashCodeMethod = cl.getMethod("hashCode");
            b = hashCodeMethod.equals(enumHashCode) ||
                    hashCodeMethod.equals(objectHashCode) ||
                    hashCodeMethod.equals(characterHashCode);
            usesOHC.put(cl, b);
        }
        return b;
    }

    static private boolean usesObjectToString(Class<?> cl) throws NoSuchMethodException {
        Boolean b = usesOTS.get(cl);
        if (b == null) {
            Method toStringMethod = cl.getMethod("toString");
            b = toStringMethod.equals(objectToString);
            usesOTS.put(cl, b);
        }
        return b;
    }

    static public int identityHashCode(Object o) {
        Integer code = codes.get(o);
        if (code == null) {
            codes.put(o, ++lastHashCode);
            return lastHashCode;
        } else
            return code;
    }

    static public String identityToString(Object o) {
        return "object" + Integer.toString(identityHashCode(o));
    }

    private ObjectMethods() {
    }

}
