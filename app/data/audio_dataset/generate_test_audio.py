from gtts import gTTS
import os

text = "I ate two idlis and one bowl of sambar for breakfast"
tts = gTTS(text=text, lang='en')
tts.save("test_audio.mp3")
print("test_audio.mp3 generated.")
