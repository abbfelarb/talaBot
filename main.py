import piper.auto as auto
import os
import json
from flask import Flask, request, after_this_request, send_file
from openAI import response

app = Flask(__name__)

api_version = "/api/v0"

@app.route(f"{api_version}/get_response", methods = ['POST'])
def get_response():
    data = request.form
    print(data)
    message = data["message"]
    chat_messages = json.loads(data["chat_messages"])
    print(type(chat_messages))
    resp, chat_messages = response(message, chat_messages)
    id = auto.create_sound(resp)

    return json.dumps({"id": id.__str__(), "chat_messages": chat_messages})

@app.route(f"{api_version}/get_sound/<id>")
def get_sound(id):
    path = f"./temp/talsyntes_{id}.wav"

    file_handle = open(path, 'r')
    @after_this_request
    def remove_file(response):
        try:
            os.remove(path)
            file_handle.close()
        except Exception as error:
            app.logger.error("Error removing or closing downloaded file handle", error)
        return response
    return send_file(
         path, 
         mimetype="audio/wav", 
         )
















if __name__ == "__main__":
    app.run("0.0.0.0.", "8000", debug=True)


    
    
