import openai
import os
from openai import OpenAI
from dotenv import load_dotenv

base = [{"role": "system", "content": "you är en hjälpsam assistent"}]

load_dotenv()
client = OpenAI(    
    api_key=os.environ.get("OPENAI_API_KEY"),
)


def response(message, messages):
    print("\nmessages: ", messages)
    if len(messages) == 0:
        chat_messages = list(base)
    else: chat_messages = messages

    print("\nchat_messages: ", chat_messages, "\n")

    if message:
        chat_messages.append(
            {"role": "user", "content": message},
        )
        chat = client.chat.completions.create(
            messages=chat_messages, model="gpt-3.5-turbo"
        )
        reply = chat.choices[0].message.content
        chat_messages.append({"role": "assistant", "content": reply})

        return reply, chat_messages
    else:
        print("ERROR: no message given in response()")


# test
if __name__ == "__main__":
    MESSAGES = []
    while True:
        reply = response(input(), MESSAGES)
        MESSAGES = reply[1]
        print(reply[0])
