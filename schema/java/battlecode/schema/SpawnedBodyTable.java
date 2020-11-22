// automatically generated by the FlatBuffers compiler, do not modify

package battlecode.schema;

import java.nio.*;
import java.lang.*;
import java.util.*;
import com.google.flatbuffers.*;

@SuppressWarnings("unused")
/**
 * A list of new bodies to be placed on the map.
 */
public final class SpawnedBodyTable extends Table {
  public static void ValidateVersion() { Constants.FLATBUFFERS_1_12_0(); }
  public static SpawnedBodyTable getRootAsSpawnedBodyTable(ByteBuffer _bb) { return getRootAsSpawnedBodyTable(_bb, new SpawnedBodyTable()); }
  public static SpawnedBodyTable getRootAsSpawnedBodyTable(ByteBuffer _bb, SpawnedBodyTable obj) { _bb.order(ByteOrder.LITTLE_ENDIAN); return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb)); }
  public void __init(int _i, ByteBuffer _bb) { __reset(_i, _bb); }
  public SpawnedBodyTable __assign(int _i, ByteBuffer _bb) { __init(_i, _bb); return this; }

  /**
   * The numeric ID of the new bodies.
   * Will never be negative.
   * There will only be one body with a particular ID at a time.
   * So, there will never be two robots with the same ID, or a robot and
   * a building with the same ID.
   */
  public int robotIDs(int j) { int o = __offset(4); return o != 0 ? bb.getInt(__vector(o) + j * 4) : 0; }
  public int robotIDsLength() { int o = __offset(4); return o != 0 ? __vector_len(o) : 0; }
  public IntVector robotIDsVector() { return robotIDsVector(new IntVector()); }
  public IntVector robotIDsVector(IntVector obj) { int o = __offset(4); return o != 0 ? obj.__assign(__vector(o), bb) : null; }
  public ByteBuffer robotIDsAsByteBuffer() { return __vector_as_bytebuffer(4, 4); }
  public ByteBuffer robotIDsInByteBuffer(ByteBuffer _bb) { return __vector_in_bytebuffer(_bb, 4, 4); }
  /**
   * The teams of the new bodies.
   */
  public byte teamIDs(int j) { int o = __offset(6); return o != 0 ? bb.get(__vector(o) + j * 1) : 0; }
  public int teamIDsLength() { int o = __offset(6); return o != 0 ? __vector_len(o) : 0; }
  public ByteVector teamIDsVector() { return teamIDsVector(new ByteVector()); }
  public ByteVector teamIDsVector(ByteVector obj) { int o = __offset(6); return o != 0 ? obj.__assign(__vector(o), bb) : null; }
  public ByteBuffer teamIDsAsByteBuffer() { return __vector_as_bytebuffer(6, 1); }
  public ByteBuffer teamIDsInByteBuffer(ByteBuffer _bb) { return __vector_in_bytebuffer(_bb, 6, 1); }
  /**
   * The types of the new bodies.
   */
  public byte types(int j) { int o = __offset(8); return o != 0 ? bb.get(__vector(o) + j * 1) : 0; }
  public int typesLength() { int o = __offset(8); return o != 0 ? __vector_len(o) : 0; }
  public ByteVector typesVector() { return typesVector(new ByteVector()); }
  public ByteVector typesVector(ByteVector obj) { int o = __offset(8); return o != 0 ? obj.__assign(__vector(o), bb) : null; }
  public ByteBuffer typesAsByteBuffer() { return __vector_as_bytebuffer(8, 1); }
  public ByteBuffer typesInByteBuffer(ByteBuffer _bb) { return __vector_in_bytebuffer(_bb, 8, 1); }
  /**
   * The locations of the bodies.
   */
  public battlecode.schema.VecTable locs() { return locs(new battlecode.schema.VecTable()); }
  public battlecode.schema.VecTable locs(battlecode.schema.VecTable obj) { int o = __offset(10); return o != 0 ? obj.__assign(__indirect(o + bb_pos), bb) : null; }

  public static int createSpawnedBodyTable(FlatBufferBuilder builder,
      int robotIDsOffset,
      int teamIDsOffset,
      int typesOffset,
      int locsOffset) {
    builder.startTable(4);
    SpawnedBodyTable.addLocs(builder, locsOffset);
    SpawnedBodyTable.addTypes(builder, typesOffset);
    SpawnedBodyTable.addTeamIDs(builder, teamIDsOffset);
    SpawnedBodyTable.addRobotIDs(builder, robotIDsOffset);
    return SpawnedBodyTable.endSpawnedBodyTable(builder);
  }

  public static void startSpawnedBodyTable(FlatBufferBuilder builder) { builder.startTable(4); }
  public static void addRobotIDs(FlatBufferBuilder builder, int robotIDsOffset) { builder.addOffset(0, robotIDsOffset, 0); }
  public static int createRobotIDsVector(FlatBufferBuilder builder, int[] data) { builder.startVector(4, data.length, 4); for (int i = data.length - 1; i >= 0; i--) builder.addInt(data[i]); return builder.endVector(); }
  public static void startRobotIDsVector(FlatBufferBuilder builder, int numElems) { builder.startVector(4, numElems, 4); }
  public static void addTeamIDs(FlatBufferBuilder builder, int teamIDsOffset) { builder.addOffset(1, teamIDsOffset, 0); }
  public static int createTeamIDsVector(FlatBufferBuilder builder, byte[] data) { return builder.createByteVector(data); }
  public static int createTeamIDsVector(FlatBufferBuilder builder, ByteBuffer data) { return builder.createByteVector(data); }
  public static void startTeamIDsVector(FlatBufferBuilder builder, int numElems) { builder.startVector(1, numElems, 1); }
  public static void addTypes(FlatBufferBuilder builder, int typesOffset) { builder.addOffset(2, typesOffset, 0); }
  public static int createTypesVector(FlatBufferBuilder builder, byte[] data) { return builder.createByteVector(data); }
  public static int createTypesVector(FlatBufferBuilder builder, ByteBuffer data) { return builder.createByteVector(data); }
  public static void startTypesVector(FlatBufferBuilder builder, int numElems) { builder.startVector(1, numElems, 1); }
  public static void addLocs(FlatBufferBuilder builder, int locsOffset) { builder.addOffset(3, locsOffset, 0); }
  public static int endSpawnedBodyTable(FlatBufferBuilder builder) {
    int o = builder.endTable();
    return o;
  }

  public static final class Vector extends BaseVector {
    public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) { __reset(_vector, _element_size, _bb); return this; }

    public SpawnedBodyTable get(int j) { return get(new SpawnedBodyTable(), j); }
    public SpawnedBodyTable get(SpawnedBodyTable obj, int j) {  return obj.__assign(__indirect(__element(j), bb), bb); }
  }
}

