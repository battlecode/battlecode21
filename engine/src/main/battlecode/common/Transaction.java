package battlecode.common;

public class Transaction implements Comparable<Transaction> {

    /**
     * The cost of the transaction.
     */
    private final int cost;

    /**
     * The message of the transaction.
     */
    private final int[] message;

    /**
     * The serialized message of the transaction.
     */
    private final String serializedMessage;

    /**
     * The randomly generated id associated with the transaction.
     */
    private final int id;

    public Transaction(int cost, int[] message, int id) {
        this.cost = cost;
        this.message = message;
        this.id = id;

        // Serialize the message
        String[] stringMessageArray = new String[message.length];
        for (int i = 0; i < message.length; i++) {
            stringMessageArray[i] = Integer.toString(message[i]);
        }
        this.serializedMessage = String.join("_", stringMessageArray);
    }

    // *********************************
    // ***** GETTER METHODS ************
    // *********************************

    public int getCost()
    {
        return this.cost;
    }

    public int[] getMessage()
    {
        return this.message.clone();
    }

    public String getSerializedMessage()
    {
        return this.serializedMessage;
    }


    /**
     * Transactions with higher cost have higher priority, then transactions with
     * higher randomly generated id, then (if two transactions somehow collide in 
     * randomly generated id) transaction that is lexicographically earlier.
     */
    @Override
    public int compareTo(Transaction other) {
        if (other.cost != this.cost)
            return other.cost - this.cost;
        if (other.id != this.id) {
            return other.id - this.id;
        }
        return serializedMessage.compareTo(other.serializedMessage);
    }
}
