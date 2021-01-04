package battlecode.instrumenter;

import org.junit.Test;
import org.junit.Ignore;

import java.net.URL;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

/**
 * @author james
 */
public class VerifierTest {
    @Ignore
    @Test
    public void verifyGood() throws Exception {
        String jar = URLUtils.toTempJar("testplayeractions/RobotPlayer.class");

        assertTrue("Should verify successfully", Verifier.verify("testplayeractions", jar));
    }

    @Ignore
    @Test
    public void verifyBad() throws Exception {
        String jar = URLUtils.toTempJar(
            new String[] {
                    "testplayeractions/RobotPlayer.class",
                    "java/lang/Double.class"
            },
            new URL[] {
                    VerifierTest.class.getClassLoader().getResource("testplayeractions/RobotPlayer.class"),
                    VerifierTest.class.getResource("resources/java.lang.Double.class")
            }
        );

        assertFalse("Should fail to verify", Verifier.verify("testplayeractions", jar));
    }

    @Ignore
    @Test
    public void verifyGoodFolder() throws Exception {
        String jar = URLUtils.toTempFolder("testplayeractions/RobotPlayer.class");

        assertTrue("Should verify successfully", Verifier.verify("testplayeractions", jar));
    }

    @Ignore
    @Test
    public void verifyBadFolder() throws Exception {
        String jar = URLUtils.toTempFolder(
            new String[] {
                    "testplayeractions/RobotPlayer.class",
                    "java/lang/Double.class"
            },
            new URL[] {
                    VerifierTest.class.getClassLoader().getResource("testplayeractions/RobotPlayer.class"),
                    VerifierTest.class.getResource("resources/java.lang.Double.class")
            }
        );

        assertFalse("Should fail to verify", Verifier.verify("testplayeractions", jar));
    }
}
