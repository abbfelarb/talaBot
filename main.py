import piper.auto as auto
import io
import os
import json
from flask import Flask, request, after_this_request, send_file
from openAI import response

app = Flask(__name__)

api_version = "/api/v0"


@app.route(f"{api_version}/get_response", methods=["POST"])
def get_response():
    data = request.json
    print(data)
    message = data["message"]
    chat_messages = data["chat_messages"]
    print(type(chat_messages))
    resp, chat_messages = response(message, chat_messages)
    id = auto.create_sound(resp)

    return json.dumps({"id": id.__str__(), "chat_messages": chat_messages})


@app.route(f"{api_version}/get_sound/<id>")
def get_sound(id):
    path = f"./temp/talsyntes_{id}.wav"

    return send_file(
        path,
        mimetype="audio/wav",
    )


@app.route("/")
def index():

    f = open("index.html", "rb")
    return f.read()


@app.route("/app.js")
def js():

    return send_file("./app.js", mimetype="application/javascript")


if __name__ == "__main__":
    app.run("0.0.0.0", "8000", debug=True)
