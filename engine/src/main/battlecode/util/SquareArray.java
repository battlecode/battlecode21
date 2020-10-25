package battlecode.util;

import java.util.Arrays;
import java.util.BitSet;

/**
 * Stores for square arrays that are significantly more efficient than,
 * say, a double[][] - way fewer objects, less indirection.
 *
 * @author james
 */
public final class SquareArray {
    /**
     * A square array of doubles.
     */
    public final static class Double {
        /**
         * Where we actually store values.
         */
        private double[] store;

        /**
         * The width and height of our square double array.
         */
        public final int width, height;

        /**
         * Create a square array with the given width and height.
         *
         * @param width the width of the array
         * @param height the height of the array
         */
        public Double(int width, int height) {
            if (width == 0 || height == 0) {
                width = height = 0;
            }

            this.width = width;
            this.height = height;
            this.store = new double[width * height];
        }

        /**
         * Copy a Square Double Array.
         * (Note: copies, doesn't alias.)
         *
         * @param source the source to copy from.
         */
        public Double(Double source) {
            this.width = source.width;
            this.height = source.height;
            this.store = new double[width * height];

            for (int i = 0; i < width * height; i++) {
                this.store[i] = source.store[i];
            }
        }

        /**
         * Get a value.
         *
         * @param x the x coordinate to get; must be in-bounds.
         * @param y the y coordinate to get; must be in-bounds.
         * @return the value stored at that location
         */
        public double get(int x, int y) {
            return this.store[x + width * y];
        }

        /**
         * Set a value.
         *
         * @param x the x coordinate to set; must be in-bounds.
         * @param y the y coordinate to set; must be in-bounds.
         * @param value the value to store.
         */
        public void set(int x, int y, double value) {
            this.store[x + width * y] = value;
        }
    }

    /**
     * A square array of booleans.
     */
    public final static class Boolean {
        /**
         * Where we actually store values.
         */
        private BitSet store;

        /**
         * The width and height of our square boolean array.
         */
        public final int width, height;

        /**
         * Create a square array with the given width and height.
         *
         * @param width the width of the array
         * @param height the height of the array
         */
        public Boolean(int width, int height) {
            if (width == 0 || height == 0) {
                width = height = 0;
            }

            this.width = width;
            this.height = height;
            this.store = new BitSet(width * height);
        }

        /**
         * Copy a Square Boolean Array.
         * (Note: copies, doesn't alias.)
         *
         * @param source the source to copy from.
         */
        public Boolean(Boolean source) {
            this.width = source.width;
            this.height = source.height;
            this.store = new BitSet(width * height);

            for (int i = 0; i < width * height; i++) {
                this.store.set(i, source.store.get(i));
            }
        }

        /**
         * Get a value.
         *
         * @param x the x coordinate to get; must be in-bounds.
         * @param y the y coordinate to get; must be in-bounds.
         * @return the value stored at that location
         */
        public boolean get(int x, int y) {
            return this.store.get(x + width * y);
        }

        /**
         * Set a value.
         *
         * @param x the x coordinate to set; must be in-bounds.
         * @param y the y coordinate to set; must be in-bounds.
         * @param value the value to store.
         */
        public void set(int x, int y, boolean value) {
            this.store.set(x + width * y, value);
        }
    }

    /**
     * A square array of any type.
     *
     * @param <T> the type.
     */
    public final static class Of<T> {
        /**
         * Where we actually store values.
         */
        private T[] store;

        /**
         * The width and height of our square T array.
         */
        public final int width, height;

        /**
         * Create a square array with the given width and height.
         *
         * @param width the width of the array
         * @param height the height of the array
         */
        @SuppressWarnings("unchecked")
        public Of(int width, int height) {
            if (width == 0 || height == 0) {
                width = height = 0;
            }

            this.width = width;
            this.height = height;

            // Note: this is, strictly speaking, unsafe, but fine as long as long as we
            // never alias or do reflection-y stuff with the store.
            this.store = (T[]) new Object[width * height];
        }

        /**
         * Copy a Square T Array.
         * (Note: copies, doesn't alias.)
         *
         * @param source the source to copy from.
         */
        @SuppressWarnings("unchecked")
        public Of(Of<T> source) {
            this.width = source.width;
            this.height = source.height;
            this.store = (T[]) new Object[width * height];

            for (int i = 0; i < width * height; i++) {
                this.store[i] = source.store[i];
            }
        }

        /**
         * Get a value.
         *
         * @param x the x coordinate to get; must be in-bounds.
         * @param y the y coordinate to get; must be in-bounds.
         * @return the value stored at that location
         */
        public T get(int x, int y) {
            return this.store[x + width * y];
        }

        /**
         * Set a value.
         *
         * @param x the x coordinate to set; must be in-bounds.
         * @param y the y coordinate to set; must be in-bounds.
         * @param value the value to store.
         */
        public void set(int x, int y, T value) {
            this.store[x + width * y] = value;
        }
    }
}
