package instrumentertest;

import java.util.Random;
import java.util.function.Supplier;

/**
 * @author james
 */
@SuppressWarnings("unused")
public class IllegalMethodReference {
    // This is not allowed, since we can't currently implement it.
    Supplier<Random> randomSupplier = Random::new;
}
