// automatically generated by the FlatBuffers compiler, do not modify

package battlecode.schema;

import java.nio.*;
import java.lang.*;
import java.util.*;
import com.google.flatbuffers.*;

@SuppressWarnings("unused")
/**
 * The map a round is played on.
 */
public final class GameMap extends Table {
  public static void ValidateVersion() { Constants.FLATBUFFERS_1_12_0(); }
  public static GameMap getRootAsGameMap(ByteBuffer _bb) { return getRootAsGameMap(_bb, new GameMap()); }
  public static GameMap getRootAsGameMap(ByteBuffer _bb, GameMap obj) { _bb.order(ByteOrder.LITTLE_ENDIAN); return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb)); }
  public void __init(int _i, ByteBuffer _bb) { __reset(_i, _bb); }
  public GameMap __assign(int _i, ByteBuffer _bb) { __init(_i, _bb); return this; }

  /**
   * The name of a map.
   */
  public String name() { int o = __offset(4); return o != 0 ? __string(o + bb_pos) : null; }
  public ByteBuffer nameAsByteBuffer() { return __vector_as_bytebuffer(4, 1); }
  public ByteBuffer nameInByteBuffer(ByteBuffer _bb) { return __vector_in_bytebuffer(_bb, 4, 1); }
  /**
   * The bottom corner of the map.
   */
  public battlecode.schema.Vec minCorner() { return minCorner(new battlecode.schema.Vec()); }
  public battlecode.schema.Vec minCorner(battlecode.schema.Vec obj) { int o = __offset(6); return o != 0 ? obj.__assign(o + bb_pos, bb) : null; }
  /**
   * The top corner of the map.
   */
  public battlecode.schema.Vec maxCorner() { return maxCorner(new battlecode.schema.Vec()); }
  public battlecode.schema.Vec maxCorner(battlecode.schema.Vec obj) { int o = __offset(8); return o != 0 ? obj.__assign(o + bb_pos, bb) : null; }
  /**
   * The bodies on the map.
   */
  public battlecode.schema.SpawnedBodyTable bodies() { return bodies(new battlecode.schema.SpawnedBodyTable()); }
  public battlecode.schema.SpawnedBodyTable bodies(battlecode.schema.SpawnedBodyTable obj) { int o = __offset(10); return o != 0 ? obj.__assign(__indirect(o + bb_pos), bb) : null; }
  /**
   * The random seed of the map.
   */
  public int randomSeed() { int o = __offset(12); return o != 0 ? bb.getInt(o + bb_pos) : 0; }
  /**
   * The factor to divide cooldowns by
   */
  public double passability(int j) { int o = __offset(14); return o != 0 ? bb.getDouble(__vector(o) + j * 8) : 0; }
  public int passabilityLength() { int o = __offset(14); return o != 0 ? __vector_len(o) : 0; }
  public DoubleVector passabilityVector() { return passabilityVector(new DoubleVector()); }
  public DoubleVector passabilityVector(DoubleVector obj) { int o = __offset(14); return o != 0 ? obj.__assign(__vector(o), bb) : null; }
  public ByteBuffer passabilityAsByteBuffer() { return __vector_as_bytebuffer(14, 8); }
  public ByteBuffer passabilityInByteBuffer(ByteBuffer _bb) { return __vector_in_bytebuffer(_bb, 14, 8); }

  public static void startGameMap(FlatBufferBuilder builder) { builder.startTable(6); }
  public static void addName(FlatBufferBuilder builder, int nameOffset) { builder.addOffset(0, nameOffset, 0); }
  public static void addMinCorner(FlatBufferBuilder builder, int minCornerOffset) { builder.addStruct(1, minCornerOffset, 0); }
  public static void addMaxCorner(FlatBufferBuilder builder, int maxCornerOffset) { builder.addStruct(2, maxCornerOffset, 0); }
  public static void addBodies(FlatBufferBuilder builder, int bodiesOffset) { builder.addOffset(3, bodiesOffset, 0); }
  public static void addRandomSeed(FlatBufferBuilder builder, int randomSeed) { builder.addInt(4, randomSeed, 0); }
  public static void addPassability(FlatBufferBuilder builder, int passabilityOffset) { builder.addOffset(5, passabilityOffset, 0); }
  public static int createPassabilityVector(FlatBufferBuilder builder, double[] data) { builder.startVector(8, data.length, 8); for (int i = data.length - 1; i >= 0; i--) builder.addDouble(data[i]); return builder.endVector(); }
  public static void startPassabilityVector(FlatBufferBuilder builder, int numElems) { builder.startVector(8, numElems, 8); }
  public static int endGameMap(FlatBufferBuilder builder) {
    int o = builder.endTable();
    return o;
  }

  public static final class Vector extends BaseVector {
    public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) { __reset(_vector, _element_size, _bb); return this; }

    public GameMap get(int j) { return get(new GameMap(), j); }
    public GameMap get(GameMap obj, int j) {  return obj.__assign(__indirect(__element(j), bb), bb); }
  }
}

