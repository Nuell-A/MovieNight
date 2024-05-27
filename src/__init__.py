from flask import Flask
from flask_socketio import SocketIO
import logging

logging.basicConfig(filename="src_init.log", level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
try:
    # init Flask application
    print("Flask initializing...")
    app = Flask(__name__)
    socketio = SocketIO(app)
    print("Flask initialized.")
except:
    print("There was an error during initialization...")
    logging.error("INIT ERROR - ", exc_info=True)


from src import routes
