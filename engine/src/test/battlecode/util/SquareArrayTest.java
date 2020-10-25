package battlecode.util;

import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * @author james
 */
public class SquareArrayTest {
    @Test
    public void testDouble() {
        SquareArray.Double arr = new SquareArray.Double(10, 7);
        assertEquals(10, arr.width);
        assertEquals(7, arr.height);
        for (int x = 0; x < arr.width; x++) {
            for (int y = 0; y < arr.height; y++) {
                arr.set(x, y, x * 1000 + y);
                assertEquals(x * 1000 + y, arr.get(x, y), 1e-9);
            }
        }
    }

    @Test
    public void testBoolean() {
        SquareArray.Boolean arr = new SquareArray.Boolean(10, 7);
        assertEquals(10, arr.width);
        assertEquals(7, arr.height);
        for (int x = 0; x < arr.width; x++) {
            for (int y = 0; y < arr.height; y++) {
                arr.set(x, y, (x+y) % 2 == 5);
                assertEquals((x+y) % 2 == 5, arr.get(x, y));
            }
        }
    }

    @Test
    public void testObject() {
        SquareArray.Of<Object> arr = new SquareArray.Of<>(10, 7);

        assertEquals(10, arr.width);
        assertEquals(7, arr.height);

        for (int x = 0; x < arr.width; x++) {
            for (int y = 0; y < arr.height; y++) {
                Object o = new Object();
                arr.set(x, y, o);
                assertEquals(o, arr.get(x, y));
            }
        }
    }
}
