# Part 4: FastAPI backend for API Time Machine

import json
import time
from urllib.parse import urlsplit

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl


app = FastAPI(title="API Time Machine")

# Allow our local Vite frontend to communicate with FastAPI.
# These are separate development servers running on different ports.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

# Security measure for our first version:
# only permit the known public test API host.
ALLOWED_HOSTS = {"jsonplaceholder.typicode.com"}


class RequestPayload(BaseModel):
    method: str
    url: HttpUrl


@app.get("/api/health")
async def health_check():
    """Check whether the backend is running."""
    return {"status": "ok"}


@app.post("/api/request")
async def execute_request(payload: RequestPayload):
    """Execute a request against an approved target API."""

    method = payload.method.upper()

    allowed_methods = {"GET", "POST", "PUT", "PATCH", "DELETE"}

    if method not in allowed_methods:
        raise HTTPException(
            status_code=400,
            detail="Unsupported HTTP method.",
        )

    # Parse the URL so we can inspect its hostname.
    parsed_url = urlsplit(str(payload.url))

    # Require HTTPS and an explicitly approved hostname.
    if (
        parsed_url.scheme != "https"
        or parsed_url.hostname not in ALLOWED_HOSTS
        or parsed_url.username is not None
        or parsed_url.password is not None
        or parsed_url.port not in (None, 443)
    ):
        raise HTTPException(
            status_code=400,
            detail="This target URL is not allowed in the current version.",
        )

    started_at = time.perf_counter()

    try:
        # Redirects are disabled so the approved host cannot redirect
        # our server to an unapproved destination.
        async with httpx.AsyncClient(
            timeout=10.0,
            follow_redirects=False,
        ) as client:
            target_response = await client.request(
                method=method,
                url=str(payload.url),
            )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="The target API timed out.",
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Unable to connect to the target API.",
        )

    # Measure the duration of the outgoing HTTP operation.
    target_duration_ms = round(
        (time.perf_counter() - started_at) * 1000,
        2,
    )

    # Try to decode JSON. If the target returns ordinary text,
    # preserve it rather than failing.
    try:
        response_body = target_response.json()
    except (ValueError, UnicodeDecodeError):
        response_body = target_response.text

    return {
        "status": target_response.status_code,
        "targetDurationMs": target_duration_ms,
        "responseSizeBytes": len(target_response.content),
        "headers": dict(target_response.headers),
        "body": response_body,
    }