/**
 * A class that wraps a group of typed buffers.
 *
 * Say you want to store a bunch of game entities. You could store them like this:
 * let entities = [
 *   {id: 0, x: 100, y: 35, size: 56},
 *   {id: 1, x: 300, y: 24, size: 73},
 *   ...
 * ];
 * However, this creates memory overhead, gc pressure, and spreads your objects
 * all through memory.
 *
 * Instead, you can store them like this:
 * let entities = {
 *   id: new Uint16Array([0, 1, ...]),
 *   x: new Float64Array([100, 300, ...]),
 *   y: new Float64Array([35, 24, ...]),
 *   size: new Float64Array([56, 73, ...]),
 * };
 *
 * This is more space-efficient, iteration is fast, and if you're working with
 * an API that takes typed array views (say, webgl), you can pass your field
 * arrays in directly.
 *
 * It is more awkward to use, though. This class makes it easier.
 * type EntitySchema = {
 *   id: Uint16Array,
 *   x: Float64Array,
 *   y: Float64Array,
 *   size: Float64Array;
 * }
 *
 * let entities = new StructOfArrays<EntitySchema>({
 *   id: new Uint16Array([0, 1, ...]),
 *   x: new Float64Array([100, 300, ...]),
 *   y: new Float64Array([35, 24, ...]),
 *   size: new Float64Array([56, 73, ...]),
 * }, 'id');
 *
 * Note that one field is treated as the 'primary key' (although there aren't
 * actually secondary keys), and is used to uniquely identify objects.
 *
 * Invariants:
 * All data in the arrays is stored from index 0 to index soa.length - 1.
 * Primary keys may not be repeated.
 */
export default class StructOfArrays<Schema extends ValidSchema> {
    /**
     * The actual storage.
     * You can access this, but you have to be careful not to break any
     * invariants.
     * In particular, you can't trust the length field of these TypedArrays;
     * you have to use soa.length.
     */
    readonly arrays: Schema & ValidSchema;
    /**
     * The actual length of all arrays.
     * Arrays are resized asymptotically to power-of-two lengths
     * as we resize.
     */
    private _capacity;
    /**
     * The logical length of the container.
     */
    private _length;
    /**
     * The names of our fields.
     */
    private readonly _fieldNames;
    /**
     * The lookup table for our primary key. Maps keys to indices.
     * We attempt to use an ES6 Map for this, since it won't stringify
     * keys all the time.
     */
    private readonly _primLookup;
    /**
     * The name of our primary key.
     */
    private readonly _primary;
    /**
     * An array we use to store intermediate indices generated while working.
     * May be null.
     */
    private _indexBuffer?;
    /**
     * Use like:
     * const db = new StructOfArrays({
     *   id: StructOfArrays.types.int32,
     *   x: StructOfArrays.types.float64,
     *   y: StructOfArrays.types.float64
     * }, 'id')
     *
     * @param fields the names and types of fields in the SOA
     * @param primary the primary key of the SOA
     * @param capacity the initial capacity of the SOA
     */
    constructor(fields: Schema & ValidSchema, primary: keyof Schema);
    /**
     * Create a copy of this StructOfArrays.
     * Capacity of the copy will be shrunk to this.length.
     */
    copy(): StructOfArrays<Schema>;
    /**
     * Copy source's buffers into ours, overwriting all values.
     * @throws Error if source is missing any of our arrays
     */
    copyFrom<LargerSchema extends Schema>(source: StructOfArrays<LargerSchema>): void;
    /**
     * Get the length of the entries in the array.
     */
    readonly length: number;
    /**
     * Delete everything.
     */
    clear(): void;
    /**
     * Insert a struct into the array.
     * Note: numbers with no corresponding entry will set their
     * corresponding fields to 0.
     *
     * @return index of inserted object
     */
    insert(numbers: Partial<Row<Schema>>): number;
    /**
     * Modify an existing struct in the array.
     *
     * @return index of altered object (NOT primary key)
     */
    alter(numbers: Partial<Row<Schema>>): number;
    /**
     * Look up a primary key in the array.
     */
    lookup(primary: number, result?: Partial<Row<Schema>>): Row<Schema>;
    /**
     * @return the index of the object with the given primary key,
     * or -1.
     */
    index(primary: number): number;
    /**
     * Set at an array index.
     */
    private _alterAt;
    /**
     * Delete at an array index.
     * O(this.length); prefer deleting in bulk.
     */
    delete(key: number): void;
    /**
     * Insert values in bulk.
     * O(values[...].length).
     *
     * Values are guaranteed to be inserted in a single block.
     * You can perform extra initialization on this block after insertion.
     *
     * The block is in range [startI, this.length)
     *
     * @return startI
     */
    insertBulk(values: Partial<Schema & ValidSchema>): number;
    /**
     * Alter values in bulk.
     * O(values[...].length).
     * Rows with nonexistent primary keys will be silently ignored.
     */
    alterBulk(values: Partial<Schema & ValidSchema>): void;
    /**
     * Lookup the indices of a set of primary keys.
     * Returned array may not be the length of primaries; ignore extra entries.
     */
    lookupIndices(primaries: TypedArray): Uint32Array;
    /**
     * Let the JIT have a small, well-typed chunk of array code to work with.
     */
    private _alterBulkFieldImpl;
    /**
     * Copy a value into a TypedArray (or normal array, I suppose).
     *
     * Just a polyfill.
     *
     * @param arr the array
     * @param value the value to fill with
     * @param start inclusive
     * @param end exclusive
     */
    static fill(arr: TypedArray, value: number, start: number, end: number): void;
    /**
     * Create a sorted array of keys to delete.
     * May allocate a new array, or reuse an old one.
     * Supplying nonexistent or repeated keys is not allowed.
     */
    private _makeToDelete;
    /**
     * Delete a set of primary keys.
     */
    deleteBulk(keys: TypedArray): void;
    /**
     * @param toDelete at least one element; sorted ascending
     * @param array the array to modify
     */
    private _deleteBulkFieldImpl;
    /**
     * Update the indices in the lookup table
     */
    private _refreshPrimariesLookup;
    /**
     * Resize internal storage, if needed.
     */
    private _resize;
    /**
     * Round up to the nearest power of two.
     */
    private static _capacityForLength;
    /**
     * Check invariants.
     */
    assertValid(): void;
}
/**
 * An object corresponding to a row in the database.
 */
export declare type Row<Schema> = {
    [P in keyof Schema]: number;
};
/**
 * An array allocated as a contiguous block of memory.
 * Backed by an ArrayBuffer.
 */
export declare type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
/**
 * Valid schema types.
 * Schemas cannot contain types aside from typed arrays.
 * Amazingly, this works.
 */
export declare type ValidSchema = {
    [id: string]: TypedArray;
};
