import openai
import os
from openai import OpenAI
from dotenv import load_dotenv

messages = [{"role": "system", "content": "You are an intelligent assistant."}]

load_dotenv()
client = OpenAI(
    # This is the default and can be omitted
    api_key=os.environ.get("OPENAI_API_KEY"),
)


def response(message):

    if message:
        messages.append(
            {"role": "user", "content": message},
        )
        chat = client.chat.completions.create(messages=messages, model="gpt-3.5-turbo")
    reply = chat.choices[0].message.content
    messages.append({"role": "assistant", "content": reply})

    return reply


print(response("hello!"))