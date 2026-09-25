# NutriSense Backlog / Known Issues

## 1. Bug: Short-food-name fuzzy matches can beat correct longer matches (vada -> Adai, ratio 0.75)
**Severity**: High (Silent data corruption for nutrition profiles)
**Component**: `app/resolution/voice_resolver.py`

**Description**:
Currently, the `voice_resolver.py` uses python's `difflib.SequenceMatcher` to find the best match for parsed items against `foods.csv`. Because simple string matching heavily penalizes length differences, short food names can mathematically beat out the correct, longer dish name and silently cross the `MATCH_CONFIDENCE_THRESHOLD = 0.75`.

**Reproducible Case**:
When a user logs "vada" (which correctly strips the plural "s" from "vadas"):
- `"vada"` vs `"adai"` (ID: FD006): Matches 3 in-order characters ('a', 'd', 'a').
  - Ratio: `2 * 3 / (4 + 4) = 0.75`.
- `"vada"` vs `"medu vada"` (ID: FD009): 
  - Ratio: `2 * 4 / (4 + 9) = 0.615`.
- `"vada"` vs `"vada pav"` (ID: FD162):
  - Ratio: `2 * 4 / (4 + 8) = 0.666`.

**Impact**: 
Because `Adai` scores exactly `0.75` (an inclusive boundary), it flips to `confirmed` and silently maps the user's "vada" to Adai's nutrition profile (calories, protein, iron, calcium). The user never sees a `needs_verification` prompt and receives incorrect dietary data.

**Recommendation**: 
Upgrade the fuzzy-matching algorithm. Relying purely on Levenshtein-style ratios without word-boundary bonuses or exact-substring logic is dangerous for short names. Consider using TF-IDF, token-sort ratios, or applying an exact-word-match bonus (e.g. if "vada" is an exact substring of "medu vada", give it a boost).

---

## 2. Note: Ambiguous-chunk quantity is misleading in verification payloads
**Severity**: Low (Handled manually by user, but potentially confusing UX)
**Component**: `app/voice/voice_parser.py` & `app/resolution/voice_resolver.py`

**Description**:
When the ASR drops punctuation and completely garbles multiple quantities/foods into a single chunk without any separators (e.g., `"2 biryani 1 naan"`), the parser does not attempt dangerous string-surgery. Instead, it extracts the *first* number it sees (`2.0`) as the `quantity`, and treats the entire remainder (`"biryani 1 naan"`) as the raw label. 

This correctly falls safely into `needs_verification`, but the resulting payload looks like:
```json
{
  "item": "biryani 1 naan",
  "quantity": 2.0,
  "unit": "serving"
}
```
If the frontend blindly renders `"quantity: 2.0"`, the human reviewer might be confused since the label clearly contains another un-parsed number (`1`).

**Mitigation**:
A code comment has been added to `voice_resolver.py` explicitly warning future developers not to trust this `quantity` field at face value for ambiguous strings. Frontend developers should design the verification screen to allow users to override both the quantity and the items when reviewing garbled chunks.
