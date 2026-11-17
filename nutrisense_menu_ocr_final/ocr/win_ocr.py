import asyncio
import io
import pandas as pd
from winsdk.windows.media.ocr import OcrEngine
from winsdk.windows.graphics.imaging import BitmapDecoder
from winsdk.windows.storage.streams import InMemoryRandomAccessStream, DataWriter

async def _recognize_async(pil_img):
    engine = OcrEngine.try_create_from_user_profile_languages()
    
    img_byte_arr = io.BytesIO()
    pil_img.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()
    
    stream = InMemoryRandomAccessStream()
    writer = DataWriter(stream)
    writer.write_bytes(img_byte_arr)
    await writer.store_async()
    stream.seek(0)
    
    decoder = await BitmapDecoder.create_async(stream)
    bitmap = await decoder.get_software_bitmap_async()
    
    return await engine.recognize_async(bitmap)

def image_to_data_win(pil_img, config=None, output_type=None, lang="eng") -> pd.DataFrame:
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    result = loop.run_until_complete(_recognize_async(pil_img))
    
    data = []
    line_num = 0
    for line in result.lines:
        line_num += 1
        word_num = 0
        for word in line.words:
            word_num += 1
            rect = word.bounding_rect
            data.append({
                "level": 5, "page_num": 1, "block_num": 1, "par_num": 1,
                "line_num": line_num, "word_num": word_num,
                "left": rect.x, "top": rect.y,
                "width": rect.width, "height": rect.height,
                "conf": 100,
                "text": word.text
            })
            
    # Also add an empty row for empty text that pytesseract sometimes has
    if len(data) == 0:
        data.append({"level": 5, "page_num": 1, "block_num": 1, "par_num": 1,
                "line_num": 1, "word_num": 1,
                "left": 0, "top": 0, "width": 0, "height": 0,
                "conf": 0, "text": ""})

    return pd.DataFrame(data)

def image_to_string_win(pil_img, config=None) -> str:
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    result = loop.run_until_complete(_recognize_async(pil_img))
    return result.text
