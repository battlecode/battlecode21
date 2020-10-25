package instrumentertest;

import java.util.Random;
import java.util.function.Supplier;

/**
 * @author james
 */
@SuppressWarnings("all")
public class LegalMethodReference {
    // This is allowed, and hopefully won't be replaced with a method reference.
    private static final Supplier<Random> legalRandomSupplier = () -> new Random();
}
