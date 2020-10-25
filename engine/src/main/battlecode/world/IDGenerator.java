package battlecode.world;

import java.util.Random;

/**
 * Class that generates a sequence of unique pseudorandom
 * positive integer IDs for robots.
 *
 * @author james
 */
public class IDGenerator {

    /**
     * The size of groups of IDs to reserve at a time.
     */
    public static final int ID_BLOCK_SIZE = 4096;

    /**
     * The smallest ID possible
     */
    public static final int MIN_ID = 10000;

    /**
     * The block of reserved IDs we walk through.
     */
    private final int[] reservedIDs;

    /**
     * The random generator used to shuffle blocks.
     */
    private final Random random;

    /**
     * Where we are in the current block.
     */
    private int cursor;

    /**
     * The number at the start of the next block.
     */
    private int nextIDBlock;

    /**
     * Create a new generator.
     *
     * @param seed the random seed to use.
     */
    public IDGenerator(int seed) {
        this.random = new Random(seed);
        this.reservedIDs = new int[ID_BLOCK_SIZE];

        setStart(MIN_ID);
    }

    /**
     * @return a new ID
     */
    public int nextID() {
        int id = this.reservedIDs[this.cursor];
        this.cursor++;

        if (this.cursor == ID_BLOCK_SIZE) {
            allocateNextBlock();
        }
        return id;
    }

    /**
     * Reserve the next ID_BLOCK_SIZE ints after this.nextIDBlock,
     * shuffle them with fisher-yates,
     * and reset the cursor.
     */
    private void allocateNextBlock() {
        if (this.nextIDBlock < 0) {
            throw new RuntimeException("No more positive ints. What did you do?");
        }

        this.cursor = 0;

        for (int i = 0; i < ID_BLOCK_SIZE; i++) {
            this.reservedIDs[i] = this.nextIDBlock + i + 1;
        }

        // fisher-yates shuffle
        for (int i = ID_BLOCK_SIZE - 1; i > 0; i--) {
            int index = this.random.nextInt(i+1);
            // swap
            int a = this.reservedIDs[index];
            this.reservedIDs[index] = this.reservedIDs[i];
            this.reservedIDs[i] = a;
        }

        this.nextIDBlock += ID_BLOCK_SIZE;
    }

    /**
     * Resets the IDGenerator to start at the given ID.
     *
     * @param startingID The ID to start allocating from
     */
    public void setStart(int startingID) {
        this.nextIDBlock = startingID;
        allocateNextBlock();
    }
}
