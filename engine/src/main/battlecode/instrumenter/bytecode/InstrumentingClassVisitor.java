package battlecode.instrumenter.bytecode;

import battlecode.instrumenter.InstrumentationException;
import battlecode.instrumenter.TeamClassLoaderFactory;
import org.objectweb.asm.ClassVisitor;
import org.objectweb.asm.FieldVisitor;
import org.objectweb.asm.MethodVisitor;
import org.objectweb.asm.Opcodes;

import java.util.HashSet;
import java.util.Set;

/**
 * Instruments a class. Overrides class references and runs an
 * InstrumentingMethodVisitor on every method.
 *
 * @author adamd
 */
public class InstrumentingClassVisitor extends ClassVisitor implements Opcodes {

    private String className;
    private final boolean silenced;
    private final boolean debugMethodsEnabled;
    private final boolean profilerEnabled;

    // Used to find other class files, which is occasionally necessary.
    private TeamClassLoaderFactory.Loader loader;

    // We check contestants' code for disallowed packages.
    // But some builtin Java libraries use disallowed packages so
    // don't check those.
    private final boolean checkDisallowed;

    /**
     * Creates a InstrumentingClassVisitor to instrument a given class.
     *  @param cv                  the ClassVisitor that should be used to read the class
     * @param silenced            whether System.out should be silenced for this class
     * @param checkDisallowed     whether to check for disallowed classes and methods
     */
    public InstrumentingClassVisitor(final ClassVisitor cv,
                                     final TeamClassLoaderFactory.Loader loader,
                                     boolean silenced,
                                     boolean checkDisallowed,
                                     boolean debugMethodsEnabled,
                                     boolean profilerEnabled) throws InstrumentationException {
        super(Opcodes.ASM5, cv);
        this.loader = loader;
        this.silenced = silenced;
        this.checkDisallowed = checkDisallowed;
        this.debugMethodsEnabled = debugMethodsEnabled;
        this.profilerEnabled = profilerEnabled;
    }

    /**
     * @inheritDoc
     */
    @Override
    public void visit(
            final int version,
            final int access,
            final String name,
            final String signature,
            final String superName,
            final String[] interfaces) {
        className = loader.getRefUtil().classReference(name, checkDisallowed);
        for (int i = 0; i < interfaces.length; i++) {
            interfaces[i] = loader.getRefUtil().classReference(interfaces[i], checkDisallowed);
        }
        String newSuperName;
        newSuperName = loader.getRefUtil().classReference(superName, checkDisallowed);
        super.visit(version, access, className, loader.getRefUtil().methodSignatureReference(signature, checkDisallowed), newSuperName, interfaces);
    }

    /**
     * @inheritDoc
     */
    public MethodVisitor visitMethod(
            int access,
            final String name,
            final String desc,
            final String signature,
            final String[] exceptions) {

        // Nothing bad should happen if a function is synchronized, because
        // there isn't any way for two robots to get the same instance of
        // an instrumented class.  But we may as well strip the keyword
        // for performance reasons.
        access &= ~Opcodes.ACC_SYNCHRONIZED;

        if (exceptions != null) {
            for (int i = 0; i < exceptions.length; i++) {
                exceptions[i] = loader.getRefUtil().classReference(exceptions[i], checkDisallowed);
            }
        }
        MethodVisitor mv = cv.visitMethod(access,
                name,
                loader.getRefUtil().methodDescReference(desc, checkDisallowed),
                loader.getRefUtil().methodSignatureReference(signature, checkDisallowed),
                exceptions);
        // create a new InstrumentingMethodVisitor, and let it loose on this method
        return mv == null ? null : new InstrumentingMethodVisitor(
                mv,
                loader,
                className,
                access,
                name,
                desc,
                signature,
                exceptions,
                silenced,
                checkDisallowed,
                debugMethodsEnabled,
                profilerEnabled
        );
    }

    /**
     * @inheritDoc
     */
    public FieldVisitor visitField(int access, String name, String desc, String signature, Object value) {
        // Strip the volatile keyword for performance reasons.  It's
        // safe to do so since an instance of an instrumented class
        // should never be accessed by more than one thread.
        if (checkDisallowed || (access & Opcodes.ACC_STATIC) == 0)
            access &= ~Opcodes.ACC_VOLATILE;
        return cv.visitField(access,
                name,
                loader.getRefUtil().classDescReference(desc, checkDisallowed),
                loader.getRefUtil().fieldSignatureReference(signature, checkDisallowed),
                value);
    }

    /**
     * @inheritDoc
     */
    public void visitOuterClass(String owner, String name, String desc) {
        super.visitOuterClass(loader.getRefUtil().classReference(owner, checkDisallowed), name, loader.getRefUtil().methodSignatureReference(desc, checkDisallowed));
    }

    /**
     * @inheritDoc
     */
    public void visitInnerClass(String name, String outerName, String innerName, int access) {
        super.visitInnerClass(
                loader.getRefUtil().classReference(name, checkDisallowed),
                loader.getRefUtil().classReference(outerName, checkDisallowed),
                innerName, access
        );
    }

}
