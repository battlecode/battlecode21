package battlecode.instrumenter;

import battlecode.instrumenter.profiler.Profiler;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import static battlecode.instrumenter.InstrumentationException.Type.ILLEGAL;
import static org.junit.Assert.*;

import java.io.File;
import java.io.PrintStream;
import java.lang.reflect.Method;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

/**
 * @author james
 */
public class LoaderTest {
    private static String tempClassFolder;
    private TeamClassLoaderFactory sharedCache;
    private TeamClassLoaderFactory.Loader l1;
    private TeamClassLoaderFactory.Loader l2;

    @BeforeClass
    public static void writeCache() throws Exception {
        tempClassFolder = URLUtils.toTempFolder(
            "instrumentertest/CallsIllegalMethods.class",
            "instrumentertest/CallsIllegalMethods$CallsWait.class",
            "instrumentertest/CallsIllegalMethods$CallsClassForName.class",
            "instrumentertest/CallsIllegalMethods$CallsStringIntern.class",
            "instrumentertest/CallsIllegalMethods$CallsSystemNanoTime.class",
            "instrumentertest/CallsIllegalMethods$CreatesFilePrintStream.class",
            "instrumentertest/CallsMathRandom.class",
            "instrumentertest/DoesntOverrideHashCode.class",
            "instrumentertest/DoesntOverrideToString.class",
            "instrumentertest/IllegalMethodReference.class",
            "instrumentertest/LegalMethodReference.class",
            "instrumentertest/Nothing.class",
            "instrumentertest/Outer.class",
            "instrumentertest/Outer$Inner.class",
            "instrumentertest/OverridesHashCode.class",
            "instrumentertest/OverridesToString.class",
            "instrumentertest/Reflection.class",
            "instrumentertest/StringFormat.class",
            "instrumentertest/UsesEnumMap.class",
            "instrumentertest/UsesLambda.class",
            "instrumentertest/UsesThrowable.class"


            );
    }

    public TeamClassLoaderFactory.Loader setupLoader(TeamClassLoaderFactory cache) throws Exception {
        TeamClassLoaderFactory.Loader result = cache.createLoader(false);

        // Set up noop RobotMonitors.
        // Necessary for... reasons.

        SandboxedRobotPlayer.Pauser pauser = () -> {};
        SandboxedRobotPlayer.Killer killer = () -> {};

        final Class<?> monitor1 = result
                .loadClass("battlecode.instrumenter.inject.RobotMonitor");
        monitor1.getMethod("init",
                SandboxedRobotPlayer.Pauser.class,
                SandboxedRobotPlayer.Killer.class,
                int.class,
                Profiler.class)
                .invoke(null, pauser, killer, 0, null);
        monitor1.getMethod("setBytecodeLimit", int.class)
                .invoke(null, Integer.MAX_VALUE);

        result.loadClass("battlecode.instrumenter.inject.System")
                .getMethod("setSystemOut", PrintStream.class).invoke(null, System.out);

        return result;
    }


    @Before
    public void setupDefaultCache() throws Exception {
        sharedCache = new TeamClassLoaderFactory(tempClassFolder);
        l1 = setupLoader(sharedCache);
        l2 = setupLoader(sharedCache);
    }

    // Should always give the same result for loadClass(string)
    @Test
    public void testLoadsClassesRepeatedly() throws ClassNotFoundException {
        final List<String> classNames = new ArrayList<>();

        classNames.add("java.lang.Object");

        classNames.add("instrumentertest.Outer");
        classNames.add("instrumentertest.Outer$Inner");

        classNames.addAll(TeamClassLoaderFactory.alwaysRedefine);

        final List<Class<?>> loadedClasses = new ArrayList<>();

        // Reloading consecutively should work
        for (String className : classNames) {
            final Class<?> loadedClass = l1.loadClass(className);
            final Class<?> reLoadedClass = l1.loadClass(className);

            assertEquals(loadedClass, reLoadedClass);

            loadedClasses.add(loadedClass);
        }

        // Reloading in a different order should work
        for (int i = 0; i < classNames.size(); i++) {
            assertEquals(l1.loadClass(classNames.get(i)), loadedClasses.get(i));
        }
    }

    // Should reload player classes between instances.
    @Test
    public void testReloadsPlayerClasses() throws ClassNotFoundException {
        assertNotEquals(
                l1.loadClass("instrumentertest.Outer"),
                l2.loadClass("instrumentertest.Outer")
        );
    }

    // Should reload always-reloadable classes between instances.
    @Test
    public void testReloadsAlwaysReloadClasses() throws ClassNotFoundException {
        for (String alwaysRedefine : TeamClassLoaderFactory.alwaysRedefine) {
            assertNotEquals(
                l1.loadClass(alwaysRedefine),
                l2.loadClass(alwaysRedefine)
            );
        }
    }

    // Classes that don't need to be reloaded. Should be from AllowedPackages.txt.
    private static final Class<?>[] NEVER_RELOAD = new Class<?>[] {
            java.lang.Object.class,
            battlecode.common.Direction.class,
            java.math.BigInteger.class,
            java.util.Map.class,
            java.util.regex.Matcher.class,
            java.io.InputStream.class
    };

    // Should give already-loaded system classes for most things.
    @Test
    public void testNoUnnecessaryReloads() throws ClassNotFoundException {
        for (Class<?> theClass : NEVER_RELOAD) {
            assertEquals(theClass, l1.loadClass(theClass.getName()));
        }
    }

    // If a player class overrides hashCode, hashCode should work normally.
    // If a player class *doesn't* override hashCode, we should replace calls to it
    // with a deterministic hash code function.
    @Test
    public void testHashCodeInstrumentation() throws Exception {
        final Class<?> overridesClass = l1.loadClass("instrumentertest.OverridesHashCode");
        final Method getHashCodeOverrides = overridesClass.getMethod("getHashCode");

        final Object overrides = overridesClass.newInstance();

        assertEquals(57, getHashCodeOverrides.invoke(overrides));
        assertEquals(57, getHashCodeOverrides.invoke(overrides));


        final Class<?> notOverridesClass1 = l1.loadClass("instrumentertest.DoesntOverrideHashCode");
        final Method getHashCodeNotOverrides1 = notOverridesClass1.getMethod("getHashCode");
        final Object notOverrides1a = notOverridesClass1.newInstance();
        final Object notOverrides1b = notOverridesClass1.newInstance();

        assertEquals(getHashCodeNotOverrides1.invoke(notOverrides1a),
                getHashCodeNotOverrides1.invoke(notOverrides1a));
        assertEquals(getHashCodeNotOverrides1.invoke(notOverrides1b),
                getHashCodeNotOverrides1.invoke(notOverrides1b));

        final Class<?> notOverridesClass2 = l2.loadClass("instrumentertest.DoesntOverrideHashCode");
        final Method getHashCodeNotOverrides2 = notOverridesClass2.getMethod("getHashCode");
        final Object notOverrides2a = notOverridesClass2.newInstance();
        final Object notOverrides2b = notOverridesClass2.newInstance();

        assertEquals(getHashCodeNotOverrides2.invoke(notOverrides2a),
                getHashCodeNotOverrides2.invoke(notOverrides2a));
        assertEquals(getHashCodeNotOverrides2.invoke(notOverrides2b),
                getHashCodeNotOverrides2.invoke(notOverrides2b));

        // hashCode should be deterministic across loaders (assuming it is called
        // in the same order.)
        assertEquals(getHashCodeNotOverrides1.invoke(notOverrides1a),
                getHashCodeNotOverrides2.invoke(notOverrides2a));
        assertEquals(getHashCodeNotOverrides1.invoke(notOverrides1b),
                getHashCodeNotOverrides2.invoke(notOverrides2b));
    }

    // Analagous to testHashCodeInstrumentation().
    // If a player class overrides toString, toString should work normally.
    // If a player class *doesn't* override toString, we should replace calls to it
    // with a deterministic string function.
    @Test
    public void testToStringInstrumentation() throws Exception {
        final Class<?> overridesClass = l1.loadClass("instrumentertest.OverridesToString");
        final Method getToStringOverrides = overridesClass.getMethod("getToString");

        final Object overrides = overridesClass.newInstance();

        assertEquals("foo", getToStringOverrides.invoke(overrides));
        assertEquals("foo", getToStringOverrides.invoke(overrides));


        final Class<?> notOverridesClass1 = l1.loadClass("instrumentertest.DoesntOverrideToString");
        final Method getToStringNotOverrides1 = notOverridesClass1.getMethod("getToString");
        final Object notOverrides1a = notOverridesClass1.newInstance();
        final Object notOverrides1b = notOverridesClass1.newInstance();

        assertEquals(getToStringNotOverrides1.invoke(notOverrides1a),
                getToStringNotOverrides1.invoke(notOverrides1a));
        assertEquals(getToStringNotOverrides1.invoke(notOverrides1b),
                getToStringNotOverrides1.invoke(notOverrides1b));

        final Class<?> notOverridesClass2 = l2.loadClass("instrumentertest.DoesntOverrideToString");
        final Method getToStringNotOverrides2 = notOverridesClass2.getMethod("getToString");
        final Object notOverrides2a = notOverridesClass2.newInstance();
        final Object notOverrides2b = notOverridesClass2.newInstance();

        assertEquals(getToStringNotOverrides2.invoke(notOverrides2a),
                getToStringNotOverrides2.invoke(notOverrides2a));
        assertEquals(getToStringNotOverrides2.invoke(notOverrides2b),
                getToStringNotOverrides2.invoke(notOverrides2b));

        // toString should be deterministic across loaders (assuming it is called
        // in the same order.)
        assertEquals(getToStringNotOverrides1.invoke(notOverrides1a),
                getToStringNotOverrides2.invoke(notOverrides2a));
        assertEquals(getToStringNotOverrides1.invoke(notOverrides1b),
                getToStringNotOverrides2.invoke(notOverrides2b));
    }

    @Test
    public void testIllegalMethodsFail() throws Exception {
        final String[] classNames = new String[] {
                "instrumentertest.CallsIllegalMethods$CallsWait",
                "instrumentertest.CallsIllegalMethods$CallsClassForName",
                "instrumentertest.CallsIllegalMethods$CallsStringIntern",
                "instrumentertest.CallsIllegalMethods$CallsSystemNanoTime",
                "instrumentertest.CallsIllegalMethods$CreatesFilePrintStream",
        };

        for (String className : classNames) {
            try {
                l1.loadClass(className);
            } catch (InstrumentationException e) {
                assertEquals(ILLEGAL, e.type);
                // Reset teamsWithErrors.
                continue;
            }

            fail("Didn't outlaw illegal class: "+className);
        }
    }


    @Test
    public void testLambdas() throws Exception {
        final Class<?> c = l1.loadClass("instrumentertest.UsesLambda");

        c.getMethod("run").invoke(null);
    }


    @Test
    public void testStringFormat() throws Exception {
        final Class<?> c = l1.loadClass("instrumentertest.StringFormat");

        c.getMethod("run").invoke(null);
    }

    @Test(expected=InstrumentationException.class)
    public void testCantReflect() throws Exception {
        l1.loadClass("instrumentertest.Reflection");
    }


    @Test(expected=InstrumentationException.class)
    public void testCantReferenceIllegalMethod() throws Exception {
        l1.loadClass("instrumentertest.IllegalMethodReference");
    }

    @Test
    public void testCanUseLambda() throws Exception {
        l1.loadClass("instrumentertest.LegalMethodReference");
    }

    @Test
    public void testMathRandom() throws Exception {
        l1.loadClass("instrumentertest.CallsMathRandom");
    }

    @Test
    public void testCanUseEnumMap() throws Exception {
        l1.loadClass("instrumentertest.UsesEnumMap");
    }


    @Test
    public void testCanUseThrowable() throws Exception {
        Class<?> c = l1.loadClass("instrumentertest.UsesThrowable");
        c.getMethod("run").invoke(null);
    }

    @Test
    public void testLoadFromJar() throws Exception {
        String jar = URLUtils.toTempJar("instrumentertest/Nothing.class");
        TeamClassLoaderFactory factory = new TeamClassLoaderFactory(jar);
        URL jarClassLocation = factory.getTeamURL("instrumentertest/Nothing.class");

        // EXTREMELY scientific

        assertTrue(jarClassLocation.toString().startsWith("jar:"));
        assertTrue(jarClassLocation.toString().contains(new File(jar).toURI().toURL().toString()));
    }

    @Test
    public void testOverrideLangClass() throws Exception {
        String folder = URLUtils.toTempFolder(
            new String[] {
                    // Put it at java/lang/double in the jar
                    "java/lang/Double.class"
            },
            new URL[] {
                    // load it from there
                    LoaderTest.class.getResource("resources/java.lang.Double.class")
            }
        );
        TeamClassLoaderFactory.Loader loader = setupLoader(
                new TeamClassLoaderFactory(folder)
        );

        try {
            loader.loadClass("java.lang.Double");
            fail("No exception thrown?");
        } catch (InstrumentationException e) {
            assertEquals(ILLEGAL, e.type);
        }
    }

    @Test
    public void testNoIncorrectPlayerPackages() throws Exception {
        String folder = URLUtils.toTempFolder(
                "battlecode/server/Server.class",
                "java/lang/Double.class",
                "org/apache/commons/io/IOUtils.class"
        );
        for (String className : new String[] {
            "battlecode.server.Server",
            "java.lang.Double",
            "org.apache.commons.io.IOUtils"
        }) {
            try {
                TeamClassLoaderFactory.Loader loader
                    = setupLoader(new TeamClassLoaderFactory(folder));
                loader.loadClass(className);
                fail("No error on player package: "+className);
            } catch (InstrumentationException e) {}
        }
    }

    @Test
    public void testNoCollisions() throws Exception {
        String folderA = URLUtils.toTempFolder(
            new String[] {
                    "Value.class"
            },
            new URL[] {
                    LoaderTest.class.getResource("resources/ValueA.class")
            }
        );
        String folderB = URLUtils.toTempFolder(
            new String[] {
                    "Value.class"
            },
            new URL[] {
                    LoaderTest.class.getResource("resources/ValueB.class")
            }
        );
        TeamClassLoaderFactory.Loader loaderA = setupLoader(
                new TeamClassLoaderFactory(folderA));
        TeamClassLoaderFactory.Loader loaderB = setupLoader(
                new TeamClassLoaderFactory(folderB));

        assertEquals(
                'A',
                loaderA.loadClass("Value").getMethod("getValue").invoke(null)
        );

        assertEquals(
                'B',
                loaderB.loadClass("Value").getMethod("getValue").invoke(null)
        );
    }

    @Test
    public void testMaliciousURLs() {
        for (String badURL : new String[] {
                "afasdfasdf3/this/local/folder/does/not/exist",
                "afasdfasdf3/this/local/jar/does/not/exist.jar",
                "/asdfasf/this/system/folder/does/not/exist",
                "/asdfasf/this/system/jar/does/not/exist.jar",
                "jar:jar:file:/binks",
                "http://bad.site/code.jar",
                "file:///AJSJEUDKA9FHLJADDHS/THIS/FOLDER/SHOULD/NOT/EXIST"
        }) {

            TeamClassLoaderFactory c = new TeamClassLoaderFactory(badURL);

            assertTrue("Failed to error on url: "+badURL, c.getError());
        }
    }
}
