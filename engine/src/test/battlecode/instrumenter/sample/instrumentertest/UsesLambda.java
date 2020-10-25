package instrumentertest;

import java.util.BitSet;
import java.util.Comparator;
import java.util.Scanner;
import java.util.function.Predicate;

/**
 * @author james
 */
@SuppressWarnings("unused")
public class UsesLambda {
    public static void run() {
        Predicate<Object> isNullObjectPredicate = o -> o == null;

        isNullObjectPredicate.test("Hi!");
        isNullObjectPredicate.test(null);

        Comparator<Object> alwaysTheSame = (a, b) -> 0;

        alwaysTheSame.compare("Hi", 12345);
        alwaysTheSame.compare(null, null);

        // Classes that use lambdas internally
        BitSet s = new BitSet(27);
    }
}
