import os
import sys
import time
import tempfile
import webbrowser
import threading
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from markitdown import MarkItDown

app = FastAPI(title="MarkItDown Studio", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MarkItDown engine
md_engine = MarkItDown()

STATIC_DIR = Path(__file__).resolve().parent / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

@app.get("/api/health")
async def health():
    return {"status": "ok", "engine": "markitdown"}

@app.post("/api/convert")
async def convert_file(file: UploadFile = File(...)):
    start_time = time.time()
    filename = file.filename or "uploaded_document"
    ext = Path(filename).suffix.lower()

    # Read uploaded file content
    contents = await file.read()
    file_size = len(contents)

    if file_size == 0:
        raise HTTPException(status_code=400, detail="File yang diunggah kosong.")

    # Save to a temporary file preserving extension
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
        tmp_file.write(contents)
        tmp_path = tmp_file.name

    try:
        # Run conversion
        result = md_engine.convert(tmp_path)
        markdown_text = result.text_content or ""
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal mengonversi file: {str(exc)}"
        )
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

    elapsed_ms = round((time.time() - start_time) * 1000, 1)
    word_count = len(markdown_text.split())
    char_count = len(markdown_text)

    return {
        "success": True,
        "filename": filename,
        "filesize": file_size,
        "filesize_formatted": format_bytes(file_size),
        "duration_ms": elapsed_ms,
        "word_count": word_count,
        "char_count": char_count,
        "markdown": markdown_text
    }

def format_bytes(size: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024.0:
            return f"{size:.1f} {unit}" if unit != 'B' else f"{size} {unit}"
        size /= 1024.0
    return f"{size:.1f} TB"

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/")
async def root():
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return HTMLResponse("<h1>MarkItDown UI is initializing...</h1>")

def open_browser(port: int):
    time.sleep(1.2)
    webbrowser.open(f"http://localhost:{port}")

if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
            sys.stderr.reconfigure(encoding="utf-8")
        except Exception:
            pass

    port = 5050
    # Auto open browser
    if "--no-browser" not in sys.argv:
        threading.Thread(target=open_browser, args=(port,), daemon=True).start()
    
    print("\n=======================================================")
    print(f"[*] MarkItDown Web Studio berjalan di: http://localhost:{port}")
    print("=======================================================\n")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
