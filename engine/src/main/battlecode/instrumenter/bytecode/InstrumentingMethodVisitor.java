package battlecode.instrumenter.bytecode;

import battlecode.common.GameConstants;
import battlecode.instrumenter.TeamClassLoaderFactory;
import battlecode.server.ErrorReporter;
import battlecode.instrumenter.InstrumentationException;
import org.objectweb.asm.*;
import org.objectweb.asm.tree.*;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static battlecode.instrumenter.InstrumentationException.Type.ILLEGAL;
import static org.objectweb.asm.tree.AbstractInsnNode.*;

/**
 * The class where the bulk of instrumentation happens.
 * Takes in the bytecode for a method and modifies it to do a few things:
 *  - Call RobotMonitor.incrementBytecodes() at the end of every basic block
 *  - Overrides class references with our injected / instrumented class references
 *  - Modifies some particularly finnicky method calls so that they behave correctly
 *    (e.g. Object.hashCode(), Math.random(), Throwable.printStackTrace())
 */
public class InstrumentingMethodVisitor extends MethodNode implements Opcodes {

    private final static String DEBUG_PREFIX = "debug_";

    private final String className;    // the class to which this method belongs
    private final boolean checkDisallowed;
    private final boolean debugMethodsEnabled;

    // used to load other class files
    private final TeamClassLoaderFactory.Loader loader;

    // all the exception handlers we've seen in the code
    private final Set<LabelNode> exceptionHandlers = new HashSet<>();
    private final Set<LabelNode> tryCatchStarts = new HashSet<>();

    private static final Set<String> instrumentedStringFuncs = new HashSet<>();

    static {
        instrumentedStringFuncs.add("matches");
        instrumentedStringFuncs.add("replaceAll");
        instrumentedStringFuncs.add("replaceFirst");
        instrumentedStringFuncs.add("split");
    }

    private LabelNode startLabel;

    private int bytecodeCtr = 0;

    private MethodVisitor methodWriter;

    public InstrumentingMethodVisitor(final MethodVisitor mv,
                                      final TeamClassLoaderFactory.Loader loader,
                                      final String className,
                                      final int access,
                                      final String methodName,
                                      final String methodDesc,
                                      final String signature,
                                      final String[] exceptions,
                                      boolean silenced,
                                      boolean checkDisallowed,
                                      boolean debugMethodsEnabled) {
        super(ASM5, access, methodName, methodDesc, signature, exceptions);
        this.methodWriter = mv;

        this.loader = loader;
        this.className = className;
        this.checkDisallowed = checkDisallowed;
        this.debugMethodsEnabled = debugMethodsEnabled;
    }

    protected String classReference(String name) {
        return loader.getRefUtil().classReference(name, checkDisallowed);
    }

    protected String classDescReference(String name) {
        return loader.getRefUtil().classDescReference(name, checkDisallowed);
    }

    protected String methodDescReference(String name) {
        return loader.getRefUtil().methodDescReference(name, checkDisallowed);
    }

    protected String fieldSignatureReference(String name) {
        return loader.getRefUtil().fieldSignatureReference(name, checkDisallowed);
    }

    private void instrumentationException(String description) {
        throw new InstrumentationException(ILLEGAL, String.format("In method %s.%s:%s:\n%s",className,name,desc,description));
    }

    public void visitMaxs(int maxStack, int maxLocals) {
        for (Object o : tryCatchBlocks) {
            visitTryCatchBlockNode((TryCatchBlockNode) o);
        }
        for (AbstractInsnNode node : instructions.toArray()) {
            // node could be taken out of the list
            // or have stuff inserted after it,
            // so node.getNext() might not be valid
            // after we visit node
            switch (node.getType()) {
                case FIELD_INSN:
                    visitFieldInsnNode((FieldInsnNode) node);
                    break;
                case INSN:
                    visitInsnNode((InsnNode) node);
                    break;
                case INVOKE_DYNAMIC_INSN:
                    visitInvokeDynamicInsnNode((InvokeDynamicInsnNode) node);
                    break;
                case LDC_INSN:
                    visitLdcInsnNode((LdcInsnNode) node);
                    break;
                case METHOD_INSN:
                    visitMethodInsnNode((MethodInsnNode) node);
                    break;
                case MULTIANEWARRAY_INSN:
                    visitMultiANewArrayInsnNode((MultiANewArrayInsnNode) node);
                    break;
                case TYPE_INSN:
                    visitTypeInsnNode((TypeInsnNode) node);
                    break;
                case VAR_INSN:
                    visitVarInsnNode((VarInsnNode) node);
                    break;
                case LABEL:
                    visitLabelNode((LabelNode) node);
                    break;
                case FRAME:
                    visitFrameNode((FrameNode) node);
                    break;
                case JUMP_INSN:
                case LOOKUPSWITCH_INSN:
                case TABLESWITCH_INSN:
                    bytecodeCtr++;
                    endOfBasicBlock(node);
                    break;
                case INT_INSN:
		    visitIntInsnNode((IntInsnNode) node);
		    break;
                case IINC_INSN:
                    bytecodeCtr++;
                    break;
            }
        }
        startLabel = new LabelNode(new Label());
        instructions.insert(startLabel);

        boolean anyTryCatch = tryCatchBlocks.size() > 0;

        if (debugMethodsEnabled && name.startsWith(DEBUG_PREFIX) && desc.endsWith("V")) {
            addDebugHandler();
        }
        if (anyTryCatch) {
            addRobotDeathHandler();
        }
        for (Object o : localVariables) {
            visitLocalVariableNode((LocalVariableNode) o);
        }
        super.visitMaxs(0, 0);
    }

    public void visitEnd() {
        accept(methodWriter);
    }

    private void visitTryCatchBlockNode(TryCatchBlockNode n) {
        exceptionHandlers.add(n.handler);
        tryCatchStarts.add(n.start);
        if (n.type != null) {
            n.type = classReference(n.type);
        }
    }

    private static AbstractInsnNode nextInstruction(AbstractInsnNode n) {
        while (n.getType() == AbstractInsnNode.LINE ||
                n.getType() == AbstractInsnNode.FRAME ||
                n.getType() == AbstractInsnNode.LABEL)
            n = n.getNext();
        return n;
    }

    @SuppressWarnings("unchecked")
    private void addDebugHandler() {
        // will be injected at the end of the method
        final LabelNode debugEndLabel = new LabelNode(new Label());

        // we wrap the method in a try / catch to enable debug mode
        tryCatchBlocks.add(new TryCatchBlockNode(
                startLabel,    // start our "try" at the beginning of the method
                debugEndLabel, // end at the end of the method
                debugEndLabel, // start the "finally" at the end of the method
                null           // catch any exception for finally
        ));

        // at the beginning of the method, call "incrementDebugLevel"
        instructions.insertBefore(nextInstruction(instructions.getFirst()),
                new MethodInsnNode(
                        INVOKESTATIC, // static method
                        "battlecode/instrumenter/inject/RobotMonitor", // class
                        "incrementDebugLevel", "()V", // method / desc
                        false // not an interface method
                )
        );

        // add debug label to the end
        instructions.add(debugEndLabel);

        // create a new stack frame
        instructions.add(new FrameNode(
                F_FULL, // a full new one
                0, new Object[0], // with no local variables
                1, new Object[]{"java/lang/Throwable"} // but an exception on the stack
        ));

        // call decrementDebugLevel
        instructions.add(new MethodInsnNode(
                INVOKESTATIC,
                "battlecode/instrumenter/inject/RobotMonitor",
                "decrementDebugLevel", "()V",
                false
        ));

        // throw the exception that brought us into the catch block
        instructions.add(new InsnNode(ATHROW));
    }

    @SuppressWarnings("unchecked")	// This is to fix the warning from the add() to tryCatchBlocks
    private void addRobotDeathHandler() {
        LabelNode robotDeathLabel = new LabelNode(new Label());
        LabelNode firstTryCatch = null;
        for(AbstractInsnNode node : instructions.toArray()) {
            if(node.getType()==AbstractInsnNode.LABEL&&tryCatchStarts.contains(node)) {
                firstTryCatch = (LabelNode)node;
                break;
            }
        }
        tryCatchBlocks.add(0, new TryCatchBlockNode(firstTryCatch, robotDeathLabel, robotDeathLabel, "java/lang/VirtualMachineError"));
        instructions.add(robotDeathLabel);
        instructions.add(new FrameNode(F_FULL, 0, new Object[0], 1, new Object[]{"java/lang/VirtualMachineError"}));
        instructions.add(new InsnNode(ATHROW));
    }

    private void visitFieldInsnNode(FieldInsnNode n) {
        bytecodeCtr++;
        n.owner = classReference(n.owner);
        n.desc = classDescReference(n.desc);
    }

    private void visitInsnNode(InsnNode n) {
        bytecodeCtr++;
        switch (n.getOpcode()) {
            case IRETURN:
            case LRETURN:
            case FRETURN:
            case DRETURN:
            case ARETURN:
            case RETURN:
                endOfBasicBlock(n);
                if (name.startsWith("debug_") && desc.endsWith("V")) {
                    instructions.insertBefore(n, new MethodInsnNode(
                            INVOKESTATIC,
                            "battlecode/instrumenter/inject/RobotMonitor",
                            "decrementDebugLevel", "()V",
                            false
                    ));
                }
                break;
            case ATHROW:
                endOfBasicBlock(n);
                break;
            case MONITORENTER:
            case MONITOREXIT:
                if (checkDisallowed) {
                    instrumentationException("synchronized() may not be used by a player.");
                }
                // We need to strip these so we don't leave monitors locked when a robot dies
                instructions.set(n, new InsnNode(POP));
                break;
        }
    }

    private void visitLdcInsnNode(LdcInsnNode n) {
        bytecodeCtr++;
        if (n.cst instanceof Type) {
            n.cst = Type.getType(classDescReference(n.cst.toString()));
        }
    }

    private void visitInvokeDynamicInsnNode(InvokeDynamicInsnNode n) {
        // should only be used for creating lambdas in java 8 (not scala)
        n.desc = methodDescReference(n.desc);
        for (int i = 0; i < n.bsmArgs.length; i++) {
            final Object arg = n.bsmArgs[i];

            if (arg instanceof Type) {
                Type t = (Type) arg;
                n.bsmArgs[i] = Type.getType(methodDescReference(t.getDescriptor()));
            } else if (arg instanceof Handle) {
                Handle h = (Handle) arg;

                if (checkDisallowed) {
                    checkDisallowedMethod(h.getOwner(), h.getName(), h.getDesc());
                }

                // Feast your eyes.
                // You can't take a reference to a method that requires instrumentation,
                // since all of our instrumentation occurs at the call site...
                // at least not without some serious creativity on our parts (dynamically
                // creating lambdas maybe?).
                // Make sure this is kept up to date with visitMethodInsnNode.
                // @author James Gilles, in penance.
                if ((h.getName().equals("hashCode") && h.getDesc().equals("()I") && n.getOpcode() != INVOKESTATIC)
                        || (h.getName().equals("toString") && h.getDesc().equals("()Ljava/lang/String;") && n.getOpcode() != INVOKESTATIC)
                        || (h.getOwner().equals("java/util/Random") && h.getName().equals("<init>") && h.getDesc().equals("()V"))
                        || (h.getOwner().equals("java/lang/String") && ((h.getName().equals("<init>") && h.getDesc().equals("([B)V"))
                            || (h.getName().equals("<init>") && h.getDesc().equals("([BII)V"))
                            || (h.getName().equals("getBytes") && h.getDesc().equals("()[B"))
                            || instrumentedStringFuncs.contains(h.getName())))
                        || ((h.getOwner().equals("java/lang/Math") || h.getOwner().equals("java/lang/StrictMath"))
                            && h.getName().equals("random"))
                        || (h.getName().equals("printStackTrace") && h.getDesc().equals("()V") &&
                            (h.getOwner() == null || h.getOwner().equals("java/lang/Throwable")
                                || isSuperClass(h.getOwner(), "java/lang/Throwable")))
                        || (h.getName().startsWith(DEBUG_PREFIX) && h.getDesc().endsWith("V") &&
                            loader.getFactory().hasTeamClass(h.getOwner()))
                        || getMethodData(h.getOwner(), h.getName()) != null) {

                    final String owner = h.getOwner().replace("/",".");

                    if (h.getName().equals("<init>")) {
                        instrumentationException("Due to instrumentation limitations,\n" +
                                "    you can't take a reference to " + owner + "::new;\n" +
                                "    use (<args>) -> new " + owner + "(<args>) instead.");
                    } else {
                        instrumentationException("Due to instrumentation limitations,\n" +
                                "    you can't take a reference to " + owner + "::" + h.getName() + ";\n" +
                                "    use (<args>) -> " + owner + "." + h.getName() +"(<args>) instead.");
                    }
                }

                n.bsmArgs[i] = new Handle(
                        h.getTag(),
                        classReference(h.getOwner()),
                        h.getName(),
                        methodDescReference(h.getDesc())
                );
            }
        }
    }

    private void visitMethodInsnNode(MethodInsnNode n) {
        // do various function replacements
        if (n.name.equals("hashCode") && n.desc.equals("()I") && n.getOpcode() != INVOKESTATIC) {
            bytecodeCtr++;
            endOfBasicBlock(n);
            // replace hashCode with deterministic version
            // send the object, its hash code, and the hash code method owner to
            // ObjectMethods for analysis
            n.owner = "battlecode/instrumenter/inject/ObjectMethods";
            n.desc = "(Ljava/lang/Object;)I";
            n.itf = false;
            n.setOpcode(INVOKESTATIC);
            return;
        }

        if (n.name.equals("toString") && n.desc.equals("()Ljava/lang/String;") && n.getOpcode() != INVOKESTATIC) {
            bytecodeCtr++;
            endOfBasicBlock(n);
            n.owner = "battlecode/instrumenter/inject/ObjectMethods";
            n.desc = "(Ljava/lang/Object;)Ljava/lang/String;";
            n.itf = false;
            n.setOpcode(INVOKESTATIC);
            return;
        }

        if (n.owner.equals("java/util/Random") && n.name.equals("<init>") &&
                n.desc.equals("()V")) {
            instructions.insertBefore(n, new MethodInsnNode(INVOKESTATIC, "battlecode/instrumenter/inject/RobotMonitor", "getRandomSeed", "()J", false));
            n.owner = "instrumented/java/util/Random";
            n.desc = "(J)V";
            return;
        }

        if (n.owner.equals("java/lang/String")) {
            if((n.name.equals("<init>")&&n.desc.equals("([B)V"))
                ||(n.name.equals("<init>")&&n.desc.equals("([BII)V"))
                ||(n.name.equals("getBytes")&&n.desc.equals("()[B"))) {
                instructions.insertBefore(n,new LdcInsnNode("UTF-16"));
                n.desc = n.desc.replace(")","Ljava/lang/String;)");
            }
        }

        // check for banned functions
        if (checkDisallowed) {
            checkDisallowedMethod(n.owner, n.name, n.desc);
        }

        boolean endBasicBlock = loader.getFactory().hasTeamClass(n.owner) || classReference(n.owner).startsWith("instrumented") || n.owner.startsWith("battlecode");

        MethodCostUtil.MethodData data = getMethodData(n.owner, n.name);
        if (data != null) {
            bytecodeCtr += data.cost;
            endBasicBlock = data.shouldEndRound;
        }

        // instrument string regex functions
        if (n.owner.equals("java/lang/String") && instrumentedStringFuncs.contains(n.name)) {
            n.setOpcode(INVOKESTATIC);
            n.desc = "(Ljava/lang/String;" + n.desc.substring(1);
            n.owner = "instrumented/battlecode/instrumenter/inject/InstrumentableFunctions";
        } else if ((n.owner.equals("java/lang/Math") || n.owner.equals("java/lang/StrictMath"))
                && n.name.equals("random")) {
            n.owner = "instrumented/battlecode/instrumenter/inject/InstrumentableFunctions";
        }

        // hax the e.printStackTrace() method calls
        // This isn't quite the correct behavior.  If
        // we wanted to do the correct thing always
        // we would use reflection at runtime to
        // figure out whether the method we're
        // calling is Throwable.printStackTrace.
        // But in practice this should be good enough.
        else if (n.name.equals("printStackTrace") && n.desc.equals("()V") &&
                (n.owner == null || n.owner.equals("java/lang/Throwable") || isSuperClass(n.owner, "java/lang/Throwable"))) {
            instructions.insertBefore(n, new FieldInsnNode(GETSTATIC, "battlecode/instrumenter/inject/System", "out", "Ljava/io/PrintStream;"));
            n.desc = "(Ljava/io/PrintStream;)V";
        } else {
            // replace class names
            n.owner = classReference(n.owner);
            n.desc = methodDescReference(n.desc);

            // are we calling a disabled debug method?
            if (!debugMethodsEnabled && n.name.startsWith("debug_")
                    && n.desc.endsWith("V") && loader.getFactory().hasTeamClass(n.owner)) {

                // if debug methods aren't enabled, we remove the call to the debug method
                // first, pop the arguments from the stack
                // arguments are popped in reverse order, so add instructions to newInsns
                // using insert, not add
                InsnList newInsns = new InsnList();
                for (Type t : Type.getArgumentTypes(n.desc)) {
                    switch (t.getSize()) {
                        case 1:
                            //System.out.println("pop "+className+" "+methodName);
                            newInsns.insert(new InsnNode(POP));
                            break;
                        case 2:
                            newInsns.insert(new InsnNode(POP2));
                            break;
                        default:
                            ErrorReporter.report("Illegal type size: not 1 or 2", true);
                            throw new InstrumentationException(ILLEGAL, "Illegal type size: not 1 or 2");
                    }
                }
                // next, pop the class on which the method would be called
                if (n.getOpcode() != INVOKESTATIC)
                    newInsns.add(new InsnNode(POP));
                // if we remove the method call and don't add any instructions then we could end up with a FrameNode that does not have an instruction following it.  asm seems not to like this.
                if (newInsns.getFirst() == null)
                    newInsns.add(new InsnNode(NOP));
                instructions.insertBefore(n, newInsns);
                instructions.remove(n);
                // no function was called so don't end the basic block
                endBasicBlock = false;
            }
        }

        if (endBasicBlock)
            endOfBasicBlock(n);

    }

    /**
     * Throws an exception if a method is disallowed.
     *
     * @param owner the owner (declaring class) of the method
     * @param methodName the name of the method
     * @param desc the method descriptor
     * @throws InstrumentationException if the method is disallowed.
     */
    void checkDisallowedMethod(String owner, String methodName, String desc) throws InstrumentationException {
        // do wait/notify monitoring
        if ((desc.equals("()V") && (methodName.equals("wait") || methodName.equals("notify") || methodName.equals("notifyAll")))
                || (methodName.equals("wait") && (desc.equals("(J)V") || desc.equals("(JI)V")))) {
            instrumentationException("Illegal method: Object." + methodName + "() cannot be called by a player.");
        }

        if (owner.equals("java/lang/Class")) {
            // There are some methods called automatically by Java
            // that we need to enable
            if (!methodName.equals("desiredAssertionStatus")) {
                instrumentationException("Illegal method in " + className + ": "+owner + "." + methodName + " may not be called by a player.");
            }
        }

        if (owner.equals("java/io/PrintStream") && methodName.equals("<init>") && desc.startsWith("(Ljava/lang/String;")) {
            instrumentationException("Illegal method in " + className + ": You may not use PrintStream to open files.");
        }

        if (owner.equals("java/lang/String") && methodName.equals("intern")) {
            instrumentationException("Illegal method in " + className + ": String.intern() cannot be called by a player.");
        }

        if (owner.equals("java/lang/System") && (
                methodName.equals("currentTimeMillis") ||
                methodName.equals("gc") ||
                methodName.equals("getProperties") ||
                methodName.equals("getSecurityManager") ||
                methodName.equals("getenv") ||
                methodName.equals("load") ||
                methodName.equals("loadLibrary") ||
                methodName.equals("mapLibraryName") ||
                methodName.equals("nanoTime") ||
                methodName.equals("runFinalization") ||
                methodName.equals("runFinalizersOnExit") ||
                methodName.equals("setProperties") ||
                methodName.equals("setSecurityManager")
        )) {
            instrumentationException("Illegal method in " + className
                    + ": System." + methodName + "() " + "cannot be called by a player.");
        }

        // We can't outlaw classes in java.lang.invoke because the JVM uses them,
        // but we can prevent the user from using them.
        if (owner.startsWith("java/lang/invoke/")) {
            instrumentationException("Illegal method in " + className
                    + ": " + owner + "." + methodName + " cannot be directly called by a player.");
        }
    }

    private void visitMultiANewArrayInsnNode(MultiANewArrayInsnNode n) {
        n.desc = classDescReference(n.desc);

        /*
         * The following code looks crazy, but all it does is is increment bytecodes by the product
         * of the first <n.dims> elements on the stack.
         */

        InsnList newInsns = new InsnList();

        newInsns.add(new LdcInsnNode(n.dims));
        newInsns.add(new IntInsnNode(NEWARRAY, 10));
        for (int i = 0; i < n.dims; i++) {
            newInsns.add(new InsnNode(DUP_X1));
            newInsns.add(new InsnNode(SWAP));
            newInsns.add(new LdcInsnNode(i));
            newInsns.add(new InsnNode(SWAP));
            newInsns.add(new InsnNode(IASTORE));
        }

        newInsns.add(new InsnNode(DUP));
        newInsns.add(new MethodInsnNode(INVOKESTATIC, "battlecode/instrumenter/inject/RobotMonitor", "calculateMultiArrayCost", "([I)I"));
        newInsns.add(new MethodInsnNode(INVOKESTATIC, "battlecode/instrumenter/inject/RobotMonitor", "incrementBytecodesWithoutInterrupt", "(I)V"));

        newInsns.add(new LdcInsnNode(n.dims - 1));
        for (int i = 0; i < n.dims; i++) {
            newInsns.add(new InsnNode(DUP2));
            newInsns.add(new InsnNode(IALOAD));
            newInsns.add(new InsnNode(DUP_X2));
            newInsns.add(new InsnNode(POP));
            newInsns.add(new InsnNode(ICONST_M1));
            newInsns.add(new InsnNode(IADD));
        }
        newInsns.add(new InsnNode(POP2));

        instructions.insertBefore(n, newInsns);
    }

    private void visitLabelNode(LabelNode n) {
        endOfBasicBlock(n);
        if (exceptionHandlers.contains(n))
            bytecodeCtr += GameConstants.EXCEPTION_BYTECODE_PENALTY;
    }

    private void visitTypeInsnNode(TypeInsnNode n) {
        n.desc = classReference(n.desc);
	if (n.getOpcode() == ANEWARRAY) {
	    InsnList newInsns = new InsnList();
	    newInsns.add(new InsnNode(DUP));
        newInsns.add(new MethodInsnNode(INVOKESTATIC, "battlecode/instrumenter/inject/RobotMonitor", "sanitizeArrayIndex", "(I)I"));
	    newInsns.add(new MethodInsnNode(INVOKESTATIC, "battlecode/instrumenter/inject/RobotMonitor", "incrementBytecodesWithoutInterrupt", "(I)V"));
	    instructions.insertBefore(n, newInsns);
	} else {
	    bytecodeCtr++;
	}
    }

    private void visitVarInsnNode(VarInsnNode n) {
        bytecodeCtr++;
        if (n.getOpcode() == RET)
            endOfBasicBlock(n);
    }

    private void visitIntInsnNode(IntInsnNode n) {
	if (n.getOpcode() == NEWARRAY) {
	    InsnList newInsns = new InsnList();
	    newInsns.add(new InsnNode(DUP));
        newInsns.add(new MethodInsnNode(INVOKESTATIC, "battlecode/instrumenter/inject/RobotMonitor", "sanitizeArrayIndex", "(I)I"));
	    newInsns.add(new MethodInsnNode(INVOKESTATIC, "battlecode/instrumenter/inject/RobotMonitor", "incrementBytecodesWithoutInterrupt", "(I)V"));
	    instructions.insertBefore(n, newInsns);
	} else {
	    bytecodeCtr++;
	}
    }

    private void visitLocalVariableNode(LocalVariableNode n) {
        n.desc = classDescReference(n.desc);
        n.signature = fieldSignatureReference(n.signature);
    }

    private void replaceVars(List<Object> l) {
        if (l == null)
            return;
        for (int i = 0; i < l.size(); i++) {
            if (l.get(i) instanceof String) {
                l.set(i, classReference((String) l.get(i)));
            }
        }
    }

    @SuppressWarnings("unchecked")	// n.local and n.stack are both supposed to be List<Object>, but they aren't for some reason?
    private void visitFrameNode(FrameNode n) {
        replaceVars(n.local);
        replaceVars(n.stack);
    }

    private void endOfBasicBlock(AbstractInsnNode n) {
        if (bytecodeCtr == 0)
            return;
        instructions.insertBefore(n, new LdcInsnNode(bytecodeCtr));
        instructions.insertBefore(n, new MethodInsnNode(INVOKESTATIC, "battlecode/instrumenter/inject/RobotMonitor", "incrementBytecodes", "(I)V", false));
        bytecodeCtr = 0;
    }

    /**
     * Tests whether the class referenced by <code>owner</code> extends or implements <code>superclass</code>.
     * e.g. isSuperClass("battlecode/common/GameActionException", "java/lang/Throwable") => true
     *
     * @param owner      - class to test
     * @param superclass - interface or superclass to test as an ancestor
     * @throws InstrumentationException if class <code>owner</code> cannot be found
     */
    private boolean isSuperClass(String owner, String superclass) {
        ClassReader cr = TeamClassLoaderFactory.teamOrSystemReader(loader.getFactory(), owner);
        InterfaceReader ir = new InterfaceReader(loader.getFactory());
        cr.accept(ir, ClassReader.SKIP_DEBUG);
        return Arrays.asList(ir.getInterfaces()).contains(superclass);
    }

    /**
     * Perform a check to see if we can get method data for this method
     *
     * @param owner the class
     * @param name the method name
     * @return method data or null
     */
    private MethodCostUtil.MethodData getMethodData(String owner, String name) {
        if (loader.getFactory().hasTeamClass(owner)) {
            // player code should be instrumented directly
            return null;
        } else {
            return MethodCostUtil.getMethodData(owner, name);
        }
    }

}
