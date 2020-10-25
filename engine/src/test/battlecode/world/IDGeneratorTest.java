package battlecode.world;

import org.junit.Test;

import java.util.BitSet;

import static org.junit.Assert.assertFalse;

/**
 * @author james
 */
public class IDGeneratorTest {
    @Test
    public void testIDGeneratorNoDuplicates() {
        BitSet seen = new BitSet(IDGenerator.ID_BLOCK_SIZE * 2);
        IDGenerator gen = new IDGenerator(0);

        for (int i = 0; i < IDGenerator.ID_BLOCK_SIZE * 2; i++) {
            int nextID = gen.nextID();

            assertFalse(seen.get(nextID));

            seen.set(nextID, true);
        }
    }
}
