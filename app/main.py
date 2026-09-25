from fastapi import FastAPI

app = FastAPI(title="NutriSense API", description="Nutrition-recommendation backend")

# TODO: Add routers
# from app.resolution import manual_resolver, menu_resolver, photo_resolver, voice_resolver
# app.include_router(manual_resolver.router)
# app.include_router(menu_resolver.router)
# app.include_router(photo_resolver.router)
# app.include_router(voice_resolver.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to NutriSense API"}
