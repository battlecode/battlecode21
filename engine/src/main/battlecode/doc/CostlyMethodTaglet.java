package battlecode.doc;

import battlecode.instrumenter.TeamClassLoaderFactory;
import battlecode.instrumenter.bytecode.MethodCostUtil;
import com.sun.javadoc.Tag;
import com.sun.tools.doclets.Taglet;

import java.util.Map;

/**
 * A taglet for the "battlecode.doc.costlymethod" annotation.
 * Only works on methods of classes in the battlecode package.
 */
@SuppressWarnings("unused")
public class CostlyMethodTaglet implements Taglet {

    public static final String TAG_NAME = "battlecode.doc.costlymethod";

    @SuppressWarnings("unused")
    public static void register(Map<String, Taglet> map) {
        map.put(TAG_NAME, new CostlyMethodTaglet());
    }

    public String getName() {
        return TAG_NAME;
    }

    public boolean inConstructor() {
        return false;
    }

    public boolean inField() {
        return false;
    }

    public boolean inMethod() {
        return true;
    }

    public boolean inOverview() {
        return false;
    }

    public boolean inPackage() {
        return false;
    }

    public boolean inType() {
        return false;
    }

    public boolean isInlineTag() {
        return false;
    }

    public String toString(Tag tag) {
        final String methodName = tag.holder().name();
        final String fileName = tag.holder().position().file().toString();

        // Note: this makes an assumption that this method is in the battlecode/ package.
        final String className = fileName.substring(fileName.lastIndexOf("battlecode/"),
                fileName.length() - 5); // remove .java

        final MethodCostUtil.MethodData data =
                MethodCostUtil.getMethodData(className, methodName);

        final int cost;

        if (data == null) {
            System.err.println("Warning: no method cost for method: " +
                    className + "/" + methodName + "; assuming 0");
            cost = 0;
        } else {
            cost = data.cost;
        }

        return "<dt><strong>Bytecode cost:</strong></dt><dd><code>"
                + cost +
                "</code></dd>";
    }

    public String toString(Tag[] tags) {
        if (tags.length != 1) {
            throw new IllegalArgumentException("Too many @"+TAG_NAME+"tags: "+tags.length);
        }

        return toString(tags[0]);
    }
}
