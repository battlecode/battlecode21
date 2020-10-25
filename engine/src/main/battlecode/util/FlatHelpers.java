package battlecode.util;

import battlecode.common.RobotType;
import battlecode.schema.BodyType;
import battlecode.schema.VecTable;
import battlecode.schema.RGBTable;
import com.google.flatbuffers.FlatBufferBuilder;
import gnu.trove.TByteCollection;
import gnu.trove.list.TByteList;
import gnu.trove.list.TFloatList;
import gnu.trove.list.TIntList;
import gnu.trove.list.TCharList;
import gnu.trove.list.array.TByteArrayList;

import java.util.List;
import java.util.function.ObjIntConsumer;

/**
 * Misc. helper functions for working with flatbuffers.
 *
 * @author james
 */
public class FlatHelpers {
    public static RobotType getRobotTypeFromBodyType(byte bodyType) {
        switch (bodyType) {
            case BodyType.HQ:
                return RobotType.HQ;
            case BodyType.MINER:
                return RobotType.MINER;
            case BodyType.REFINERY:
                return RobotType.REFINERY;
            case BodyType.VAPORATOR:
                return RobotType.VAPORATOR;
            case BodyType.DESIGN_SCHOOL:
                return RobotType.DESIGN_SCHOOL;
            case BodyType.FULFILLMENT_CENTER:
                return RobotType.FULFILLMENT_CENTER;
            case BodyType.LANDSCAPER:
                return RobotType.LANDSCAPER;
            case BodyType.DELIVERY_DRONE:
                return RobotType.DELIVERY_DRONE;
            case BodyType.NET_GUN:
                return RobotType.NET_GUN;
            case BodyType.COW:
                return RobotType.COW;
            default:
                throw new RuntimeException("No robot type for: "+bodyType);
        }
    }

    public static byte getBodyTypeFromRobotType(RobotType type) {
        switch (type) {
            case HQ:
                return BodyType.HQ;
            case MINER:
                return BodyType.MINER;
            case REFINERY:
                return BodyType.REFINERY;
            case VAPORATOR:
                return BodyType.VAPORATOR;
            case DESIGN_SCHOOL:
                return BodyType.DESIGN_SCHOOL;
            case FULFILLMENT_CENTER:
                return BodyType.FULFILLMENT_CENTER;
            case LANDSCAPER:
                return BodyType.LANDSCAPER;
            case DELIVERY_DRONE:
                return BodyType.DELIVERY_DRONE;
            case NET_GUN:
                return BodyType.NET_GUN;
            case COW:
                return BodyType.COW;
            default:
                throw new RuntimeException("No body type for: "+type);
        }
    }

    /**
     * DO NOT CALL THIS WITH OFFSETS!
     * Only call it when you're adding an actual int[] to a buffer,
     * not a Table[].
     * For that, call offsetVector.
     *
     * Well that's a weird API.
     *
     * Call like so:
     * int xyzP = intVector(builder, xyz, BufferType::startXyzVector);
     */
    public static int intVector(FlatBufferBuilder builder,
                                TIntList arr,
                                ObjIntConsumer<FlatBufferBuilder> start) {
        final int length = arr.size();
        start.accept(builder, length);

        // arrays go backwards in flatbuffers
        // for reasons
        for (int i = length - 1; i >= 0; i--) {
            builder.addInt(arr.get(i));
        }
        return builder.endVector();
    }

    /**
     * This is DIFFERENT from intVector!
     *
     * Call this when you're adding a table of offsets, not flat ints.
     */
    public static int offsetVector(FlatBufferBuilder builder,
                                   TIntList arr,
                                   ObjIntConsumer<FlatBufferBuilder> start) {
        final int length = arr.size();
        start.accept(builder, length);

        // arrays go backwards in flatbuffers
        // for reasons
        for (int i = length - 1; i >= 0; i--) {
            builder.addOffset(arr.get(i));
        }
        return builder.endVector();
    }

    public static int floatVector(FlatBufferBuilder builder,
                                  TFloatList arr,
                                  ObjIntConsumer<FlatBufferBuilder> start) {
        final int length = arr.size();
        start.accept(builder, length);

        for (int i = length - 1; i >= 0; i--) {
            builder.addFloat(arr.get(i));
        }
        return builder.endVector();
    }

    public static int byteVector(FlatBufferBuilder builder,
                                 TByteList arr,
                                 ObjIntConsumer<FlatBufferBuilder> start) {
        final int length = arr.size();
        start.accept(builder, length);

        for (int i = length - 1; i >= 0; i--) {
            builder.addByte(arr.get(i));
        }
        return builder.endVector();
    }

    public static int charVector(FlatBufferBuilder builder,
                                  TCharList arr,
                                  ObjIntConsumer<FlatBufferBuilder> start) {
        final int length = arr.size();
        start.accept(builder, length);

        for (int i = length - 1; i >= 0; i--) {
            builder.addInt(arr.get(i));
        }
        return builder.endVector();
    }

    public static int createVecTable(FlatBufferBuilder builder, TIntList xs, TIntList ys) {
        if (xs.size() != ys.size()) {
            throw new RuntimeException("Mismatched x/y length: "+xs.size()+" != "+ys.size());
        }
        int xsP = intVector(builder, xs, VecTable::startXsVector);
        int ysP = intVector(builder, ys, VecTable::startYsVector);
        return VecTable.createVecTable(builder, xsP, ysP);
    }

    public static int createPollutionEffect(FlatBufferBuilder builder, TIntList xs, TIntList ys) {
        if (xs.size() != ys.size()) {
            throw new RuntimeException("Mismatched x/y length: "+xs.size()+" != "+ys.size());
        }
        int xsP = intVector(builder, xs, VecTable::startXsVector);
        int ysP = intVector(builder, ys, VecTable::startYsVector);
        return VecTable.createVecTable(builder, xsP, ysP);
    }

    public static int createRGBTable(FlatBufferBuilder builder, TIntList red, TIntList green, TIntList blue) {
        if (red.size() != green.size() || green.size() != blue.size()) {
            throw new RuntimeException("Mismatched lengths: "+red.size()+", "+green.size()+", "+blue.size());
        }
        int redP = intVector(builder, red, RGBTable::startRedVector);
        int greenP = intVector(builder, green, RGBTable::startGreenVector);
        int blueP = intVector(builder, blue, RGBTable::startBlueVector);
        return RGBTable.createRGBTable(builder, redP, greenP, blueP);
    }
}
