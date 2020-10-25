package battlecode.server;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.net.InetSocketAddress;
import java.nio.channels.ClosedByInterruptException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * Serve a battlecode match over a websocket connection.
 *
 * Sends one battlecode event per websocket message; ignores incoming messages.
 *
 * @author james
 */
public class NetServer extends WebSocketServer {

    private final List<byte[]> previousEvents;
    private final BlockingQueue<byte[]> incomingEvents;

    private boolean waitForClient;

    private boolean done = false;
    private boolean connected = false;

    private Thread queueThread;

    /**
     * Create a new server.
     * @param port
     */
    public NetServer(int port, boolean waitForClient) {
        super(new InetSocketAddress(port));

        this.waitForClient = waitForClient;

        previousEvents = new ArrayList<>();
        incomingEvents = new ArrayBlockingQueue<>(64);

        queueThread = new Thread(() -> {
            try {
                while (!done) {
                    byte[] event = incomingEvents.poll(300, TimeUnit.MILLISECONDS);
                    if (event != null) {
                        processEvent(event);
                    }
                }
                while (incomingEvents.size() > 0) {
                    byte[] event = incomingEvents.remove();
                    processEvent(event);
                }
            } catch(Exception e) {
                ErrorReporter.report(e, true);
            }
        });
    }

    /**
     * Run the server on a new thread.
     */
    @Override
    public void start() {
        if (queueThread.isAlive() || done) {
            throw new RuntimeException("Can't start server, already started");
        }

        queueThread.start();
        super.start();

        if (waitForClient) {
            System.out.println("Waiting for connection from client...");
            try {
                while (!connected) {
                    Thread.sleep(300);
                }
            } catch (InterruptedException e) {
                throw new RuntimeException("Bad things happened");
            }
            System.out.println("Connection received!");
        }
    }

    /**
     * Add an event.
     * It will be sent to clients at some point in the future.
     *
     * @param event
     */
    public void addEvent(byte[] event) {
        if (done) {
            throw new RuntimeException("Can't add event, server already finished");
        }
        incomingEvents.add(event);
    }

    /**
     * Send all queued events and terminate.
     * Blocks until finished.
     */
    public void finish() {
        if (!queueThread.isAlive()) {
            throw new RuntimeException("Can't finish, queue thread already started");
        }
        if (done) {
            throw new RuntimeException("Can't finish, already finished");
        }

        done = true;
        try {
            queueThread.join();
            stop();
        } catch (Exception e) {
            ErrorReporter.report(e, true);
        }
    }

    // implementation details

    // Two threads: one polling websocket stuff, one awaiting queue inputs
    // When there's a new client, we lock, all events are sent to client, we unlock
    // When there is a queue input, we lock, all clients receive event, we unlock
    // There may still be thread-safety issues here:
    //
    // onOpen

    private void processEvent(byte[] event) {
        synchronized (connections()) {
            for (WebSocket client : connections()) {
                client.send(event);
            }
            previousEvents.add(event);
        }
    }

    @Override
    public void onOpen(WebSocket client, ClientHandshake handshake) {
        synchronized (connections()) {
            connected = true;

            for (byte[] event : previousEvents) {
                client.send(event);
            }
        }
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        System.out.println("Closed: "+conn.getRemoteSocketAddress() + " for "+reason);
    }

    @Override
    public void onMessage(WebSocket ws, String s) {
        System.err.println("Spurious message from "+
                ws.getRemoteSocketAddress()+": `"+s+"`");
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        if (!(ex instanceof ClosedByInterruptException)) {
            System.err.println("Error from: "+conn.getRemoteSocketAddress()+": "+ex);
        }
    }
}
