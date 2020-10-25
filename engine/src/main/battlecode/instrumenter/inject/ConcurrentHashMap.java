package battlecode.instrumenter.inject;

import java.util.Hashtable;
import java.util.concurrent.ConcurrentMap;

/**
 * ConcurrentMap implementation that isn't really concurrent.
 * Needed to instrument Clojure.
 */
@SuppressWarnings("unused")
public class ConcurrentHashMap<K, V> extends Hashtable<K, V> implements ConcurrentMap<K, V> {

    public V putIfAbsent(K key, V value) {
        if (!containsKey(key))
            return put(key, value);
        else
            return get(key);
    }

    public boolean remove(Object key, Object value) {
        if (containsKey(key) && get(key).equals(value)) {
            remove(key);
            return true;
        } else return false;
    }

    public boolean replace(K key, V oldValue, V newValue) {
        if (containsKey(key) && get(key).equals(oldValue)) {
            put(key, newValue);
            return true;
        } else return false;
    }

    public V replace(K key, V value) {
        if (containsKey(key)) {
            return put(key, value);
        } else return null;
    }
}
