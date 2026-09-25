from pydantic import BaseModel
from typing import Literal
from datetime import datetime

class RawInput(BaseModel):
    input_id: str
    source: Literal["menu", "voice", "photo", "manual"]
    stage: Literal["pre_meal", "post_meal"]
    timestamp: datetime
    raw_payload: dict  # source-specific, shape varies by `source`
