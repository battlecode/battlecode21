/**
 * This hello world program is compiled when the docker image is built, to
 * force gradle to download all of its dependencies; this way, users have a
 * shorter wait time because they don't have to wait for this very slow
 * download
 */

public class Helloworld {
    public static void main(String[] args) {
        System.out.println("Hello world!");
    }
}
