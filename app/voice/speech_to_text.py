from faster_whisper import WhisperModel

_model = None


def get_model():
    """Lazy-load the Whisper model. No download happens at import time."""
    global _model

    if _model is None:
        model_size = "small"
        _model = WhisperModel(
            model_size,
            device="cpu",
            compute_type="int8"
        )

    return _model


def transcribe_audio(audio_path: str) -> str:
    """Transcribe an audio file using Whisper. Model is lazy-loaded on first call."""
    model = get_model()

    segments, info = model.transcribe(
        audio_path,
        beam_size=5,
        language="en",
        condition_on_previous_text=False
    )

    transcript = " ".join(segment.text.strip() for segment in segments)

    return transcript.strip()


def transcribe_text(text: str) -> str:
    """
    Pass-through for text input (used in tests / demo pipeline when audio is
    not available).  The voice transcript is returned as-is without any Whisper
    model load.
    """
    return text.strip()