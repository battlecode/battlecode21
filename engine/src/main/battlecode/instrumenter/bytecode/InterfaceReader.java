package battlecode.instrumenter.bytecode;

import battlecode.instrumenter.TeamClassLoaderFactory;
import org.objectweb.asm.*;

import java.util.Collections;
import java.util.HashSet;

import static org.objectweb.asm.ClassReader.SKIP_DEBUG;

/**
 * This class transitively reads all interfaces and superclasses implemented or extended by a given class.  After visiting a class, one can call getInterfaces()
 * to get all interfaces/classes transitively implemented/extended by the visited class.  A single instance of InterfaceReader can be used more than once
 * in this fashion.
 *
 * @author adamd
 */
class InterfaceReader extends ClassVisitor {

    /**
     * Used to read relevant class files.
     *
     * May be null.
     */
    private TeamClassLoaderFactory factory;

    /**
     * store the final result of which interfaces are transitively implemented
     */
    private String[] interfaces = null;

    public InterfaceReader(TeamClassLoaderFactory factory) {
        super(Opcodes.ASM5);
        this.factory = factory;
    }

    public void visit(int version, int access, String name, String signature, String superName, String[] interfaces) {
        // first, put all interfaces/classes directly implemented/extended by the given class into result
        HashSet<String> directIfaces = new HashSet<>();

        Collections.addAll(directIfaces, interfaces);

        if (superName != null)
            directIfaces.add(superName);

        // now, for each element of result, use an InterfaceReader on it,
        // so we recursively get all interfaces/classes transitively implemented/extended
        // by the given class.  The results will be stored in result2.
        HashSet<String> allIfaces = new HashSet<>();
        allIfaces.addAll(directIfaces);

        for (String iface : directIfaces) {
            ClassReader cr = TeamClassLoaderFactory.teamOrSystemReader(factory, iface);
            InterfaceReader ir = new InterfaceReader(factory);
            cr.accept(ir, SKIP_DEBUG);
            String[] ret = ir.getInterfaces();

            Collections.addAll(allIfaces, ret);
        }

        this.interfaces = allIfaces.toArray(new String[allIfaces.size()]);
    }

    public AnnotationVisitor visitAnnotation(String desc, boolean visible) {
        return null;
    }

    public void visitAttribute(Attribute attr) {
    }

    public void visitEnd() {
    }

    public FieldVisitor visitField(int access, String name, String desc, String signature, Object value) {
        return null;
    }

    public void visitInnerClass(String name, String outerName, String innerName, int access) {
    }

    public MethodVisitor visitMethod(int access, String name, String desc, String signature, String[] exceptions) {
        return null;
    }

    public void visitOuterClass(String owner, String name, String desc) {
    }

    public void visitSource(String source, String debug) {
    }


    /**
     * Returns all interfaces/classes transitively implemented/extended by the most recently visited class
     */
    public String[] getInterfaces() {
        return interfaces;
    }

}
