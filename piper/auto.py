import subprocess
import uuid


def create_sound(text):
    id = uuid.uuid4();
    echo = subprocess.Popen(('echo', "'{}'".format(text)), stdout=subprocess.PIPE)
    echo.wait()
    process = subprocess.run(("./piper/piper", "--model", "./piper/sv-se-nst-medium.onnx" ,"--output_file", "./temp/talsyntes_{}.wav".format(id)), stdin=echo.stdout)
    return id

if __name__ == "__main__":
    print(create_sound(input()))
