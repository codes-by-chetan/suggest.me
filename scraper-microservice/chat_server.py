#!/usr/bin/env python3
import socket
import threading
import select
import logging
import errno

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', filename='chat_server.log', filemode='a')
console = logging.StreamHandler()
console.setLevel(logging.INFO)
logging.getLogger().addHandler(console)

HOST = "0.0.0.0"
PORT = 12345
PASSKEY = None  # Will be set at startup

clients = {}
lock = threading.Lock()

def broadcast(message, sender=None):
    """Send a message to all connected clients."""
    with lock:
        dead_clients = []
        for conn in list(clients.keys()):
            try:
                conn.sendall(message.encode())
            except (ConnectionResetError, BrokenPipeError, OSError) as e:
                logging.error(f"Failed to send to {clients.get(conn, 'unknown')}: {e}")
                dead_clients.append(conn)
        for dc in dead_clients:
            if dc in clients:
                uname = clients.pop(dc)
                try:
                    dc.close()
                except:
                    pass
                logging.info(f"Client {uname} disconnected")
                broadcast(f"*** {uname} disconnected ***\n")

def is_socket_closed(sock):
    """Check if the socket is closed or broken."""
    try:
        # Peek at the socket to check if it's closed
        data = sock.recv(1, socket.MSG_PEEK)
        if not data:
            return True
        return False
    except (ConnectionResetError, BrokenPipeError, OSError) as e:
        if e.errno in (errno.EBADF, errno.ECONNRESET, errno.EPIPE):
            return True
        return False

def handle_client(conn, addr):
    logging.info(f"New connection from {addr}")
    try:
        # Set socket to non-blocking
        conn.setblocking(False)

        # Only ask for passkey if it's set
        if PASSKEY:
            try:
                conn.sendall(b"Enter passkey: ")
            except (ConnectionResetError, BrokenPipeError, OSError) as e:
                logging.info(f"Failed to send passkey prompt to {addr}: {e}")
                conn.close()
                return
            # Wait for passkey with select (10-second timeout for initial response)
            readable, _, errors = select.select([conn], [], [conn], 10)
            if errors or not readable:
                logging.info(f"Timeout or error waiting for passkey from {addr}")
                conn.close()
                return
            try:
                entered_key = conn.recv(1024).decode().strip()
            except (ConnectionResetError, BrokenPipeError, OSError) as e:
                logging.info(f"Failed to receive passkey from {addr}: {e}")
                conn.close()
                return
            if entered_key != PASSKEY:
                try:
                    conn.sendall(b"Invalid passkey. Connection closed.\n")
                except:
                    pass
                conn.close()
                logging.info(f"Invalid passkey from {addr}")
                return

        # Ask for username
        try:
            conn.sendall(b"Enter your username: ")
        except (ConnectionResetError, BrokenPipeError, OSError) as e:
            logging.info(f"Failed to send username prompt to {addr}: {e}")
            conn.close()
            return
        readable, _, errors = select.select([conn], [], [conn], 10)
        if errors or not readable:
            logging.info(f"Timeout or error waiting for username from {addr}")
            conn.close()
            return
        try:
            username = conn.recv(1024).decode().strip()
        except (ConnectionResetError, BrokenPipeError, OSError) as e:
            logging.info(f"Failed to receive username from {addr}: {e}")
            conn.close()
            return
        if not username:
            conn.close()
            logging.info(f"No username provided from {addr}")
            return

        with lock:
            clients[conn] = username
        logging.info(f"Client {username} joined from {addr}")
        try:
            broadcast(f"*** {username} joined the chat ***\n")
            conn.sendall(b"Connection successful. Welcome to the chat!\n")
        except (ConnectionResetError, BrokenPipeError, OSError) as e:
            logging.error(f"Failed to send connection confirmation to {username}: {e}")
            with lock:
                clients.pop(conn, None)
            conn.close()
            return

        # Main receive loop (no timeout for active clients)
        while True:
            if is_socket_closed(conn):
                logging.info(f"Client {username} disconnected (socket closed)")
                break
            readable, _, errors = select.select([conn], [], [conn], None)  # No timeout
            if errors:
                logging.info(f"Socket error for {username} from {addr}")
                break
            if readable:
                try:
                    data = conn.recv(1024)
                    if not data:
                        logging.info(f"Client {username} disconnected (no data)")
                        break
                    msg = data.decode().strip()
                    if msg.lower() == "/quit":
                        logging.info(f"Client {username} quit explicitly")
                        break
                    broadcast(f"[{username}] {msg}\n")
                except (ConnectionResetError, BrokenPipeError, OSError) as e:
                    logging.info(f"Receive error for {username}: {e}")
                    break

    except Exception as e:
        logging.error(f"Unexpected error with {addr}: {e}")

    finally:
        with lock:
            if conn in clients:
                uname = clients.pop(conn)
                logging.info(f"Cleaning up client {uname}")
                broadcast(f"*** {uname} left the chat ***\n")
        try:
            conn.close()
        except:
            pass
        logging.info(f"Closed connection for {addr}")

def main():
    global PASSKEY
    # Prompt for passkey
    PASSKEY = input("Set a passkey (leave empty for open chat): ").strip()
    if not PASSKEY:
        PASSKEY = None
        logging.info("No passkey set — room is open.")
    else:
        logging.info("Passkey set — users must enter it to join.")

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((HOST, PORT))
    server.listen(5)  # Allow up to 5 queued connections
    logging.info(f"Server listening on {HOST}:{PORT}...")

    try:
        while True:
            readable, _, errors = select.select([server], [], [server], 10)
            if errors:
                logging.error(f"Server socket error")
                break
            if server in readable:
                try:
                    conn, addr = server.accept()
                    conn.setblocking(False)  # Set new socket to non-blocking
                    threading.Thread(target=handle_client, args=(conn, addr), daemon=True).start()
                except socket.error as e:
                    logging.error(f"Server accept error: {e}")
    except KeyboardInterrupt:
        logging.info("Shutting down server...")
    finally:
        with lock:
            for conn in list(clients.keys()):
                try:
                    conn.close()
                except:
                    pass
            clients.clear()
        server.close()
        logging.info("Server closed")

if __name__ == "__main__":
    main()