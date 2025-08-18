#!/usr/bin/env python3
import socket
import threading
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', filename='chat_client.log', filemode='a')
console = logging.StreamHandler()
console.setLevel(logging.INFO)
logging.getLogger().addHandler(console)

HOST = "192.168.0.39"  # Change to server IP
PORT = 12345

def receive_messages(sock):
    while True:
        try:
            data = sock.recv(1024)
            if not data:
                print("Disconnected from server.")
                logging.info("Disconnected from server (no data)")
                break
            print(data.decode(), end="")
        except (ConnectionResetError, BrokenPipeError, OSError) as e:
            print("Disconnected from server.")
            logging.error(f"Receive error: {e}")
            break

def recv_until_prompt(sock, prompt_text, timeout=10, retries=3):
    """Receive data until we get the expected prompt or timeout, with retries."""
    sock.settimeout(timeout)
    for attempt in range(1, retries + 1):
        buffer = ""
        try:
            start_time = time.time()
            while prompt_text not in buffer and time.time() - start_time < timeout:
                chunk = sock.recv(1024).decode()
                if not chunk:
                    raise ConnectionError("Server closed connection")
                buffer += chunk
            if prompt_text in buffer:
                print(buffer, end="")
                logging.info(f"Received prompt '{prompt_text}' on attempt {attempt}")
                return buffer
            raise socket.timeout("Partial data received")
        except socket.timeout:
            logging.warning(f"Timeout waiting for '{prompt_text}' on attempt {attempt}")
            if attempt < retries:
                logging.info(f"Retrying ({attempt + 1}/{retries})...")
                time.sleep(2)
            continue
        except (ConnectionResetError, BrokenPipeError, OSError) as e:
            raise ConnectionError(f"Failed to connect: {e}")
    raise ConnectionError(f"Timeout waiting for '{prompt_text}' after {retries} attempts")

def main():
    for attempt in range(1, 4):  # Retry entire connection process up to 3 times
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.connect((HOST, PORT))
            logging.info(f"Connected to server on attempt {attempt}")

            # Handle passkey prompt (if any)
            recv_until_prompt(sock, "Enter passkey:", timeout=10, retries=3)
            passkey = input()
            sock.sendall((passkey + "\n").encode())

            # Handle username prompt
            recv_until_prompt(sock, "Enter your username:", timeout=10, retries=3)
            username = input()
            sock.sendall((username + "\n").encode())

            # Wait for connection confirmation
            buffer = recv_until_prompt(sock, "Connection successful", timeout=10, retries=3)
            if "Connection successful" not in buffer:
                print("Failed to join the chat. Server may be full or in an error state.")
                logging.error("Failed to receive connection confirmation")
                continue  # Retry connection

            # Start listening for incoming chat messages
            threading.Thread(target=receive_messages, args=(sock,), daemon=True).start()

            try:
                while True:
                    msg = input()
                    sock.sendall((msg + "\n").encode())
                    if msg.lower() == "/quit":
                        break
            except KeyboardInterrupt:
                logging.info("Client interrupted (Ctrl+C)")
                try:
                    sock.sendall(b"/quit\n")
                except:
                    pass
            except (ConnectionResetError, BrokenPipeError, OSError) as e:
                print("Disconnected from server.")
                logging.error(f"Send error: {e}")
            break  # Exit retry loop on successful connection
        except ConnectionError as e:
            print(f"Connection error: {e}")
            logging.error(f"Connection error on attempt {attempt}: {e}")
            if attempt < 3:
                logging.info(f"Retrying connection ({attempt + 1}/3)...")
                time.sleep(2)
        finally:
            try:
                sock.close()
            except:
                pass
            logging.info("Client socket closed")
    else:
        print("Failed to connect to server after 3 attempts.")
        logging.error("Failed to connect to server after 3 attempts")

if __name__ == "__main__":
    main()