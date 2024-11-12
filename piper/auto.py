import subprocess
import uuid


def create_sound(text):
    id = uuid.uuid4();
    echo = subprocess.Popen(('echo', "'{}'".format(text)), stdout=subprocess.PIPE)
    echo.wait()
    process = subprocess.run(("./piper", "--model", "sv-se-nst-medium.onnx" ,"--output_file", "talsyntes_{}.wav".format(id)), stdin=echo.stdout)
    return "./piper/talsyntes_{}".format(id);
