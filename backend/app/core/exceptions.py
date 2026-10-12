"""
Centralized exception classes and error response models for SmritiSetu API.
Ensures consistent JSON error shape across all endpoints.
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


class AppException(Exception):
    def __init__(self, message: str, code: str = "APP_ERROR", status_code: int = 400, details: dict = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


def format_error_response(message: str, code: str, status_code: int, details: dict = None) -> dict:
    return {
        "status": "error",
        "error": {
            "code": code,
            "message": message,
            "status": status_code,
            "details": details or {}
        }
    }


async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(exc.message, exc.code, exc.status_code, exc.details)
    )


async def http_exception_handler(request: Request, exc: HTTPException):
    code = f"HTTP_{exc.status_code}"
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(str(exc.detail), code, exc.status_code)
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=format_error_response(
            "Request validation failed",
            "VALIDATION_ERROR",
            422,
            {"errors": exc.errors()}
        )
    )
