from gtts import gTTS
import os

text = "I ate some random food"
tts = gTTS(text=text, lang='en')
tts.save("test_audio_ambiguous.mp3")
print("test_audio_ambiguous.mp3 generated.")
