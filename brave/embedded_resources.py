"""
Embedded resources for single executable build.
This module provides access to static files embedded in the executable.
"""

import os
import base64
from pathlib import Path

# Flag to determine if we're running from a bundled executable
IS_BUNDLED = getattr(__import__('sys'), 'frozen', False)

def get_resource_path(relative_path):
    """
    Get the absolute path to a resource file.
    Works both in development and when bundled with PyInstaller.
    """
    if IS_BUNDLED:
        # Running in a PyInstaller bundle
        base_path = Path(__import__('sys')._MEIPASS)
    else:
        # Running in normal Python environment
        base_path = Path(__file__).parent.parent

    return base_path / relative_path


def get_static_file_content(filepath):
    """
    Get the content of a static file from embedded resources or filesystem.

    Args:
        filepath: Relative path to the file (e.g., 'public/index.html')

    Returns:
        Tuple of (content_bytes, mime_type)
    """
    # Determine MIME type
    mime_types = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
    }

    ext = Path(filepath).suffix.lower()
    mime_type = mime_types.get(ext, 'application/octet-stream')

    try:
        full_path = get_resource_path(filepath)
        with open(full_path, 'rb') as f:
            content = f.read()
        return content, mime_type
    except Exception as e:
        raise FileNotFoundError(f"Resource not found: {filepath}") from e


def list_static_files(directory='public'):
    """
    List all static files in a directory.

    Args:
        directory: Directory to list (relative to project root)

    Returns:
        List of relative file paths
    """
    dir_path = get_resource_path(directory)
    files = []

    if dir_path.exists() and dir_path.is_dir():
        for item in dir_path.rglob('*'):
            if item.is_file():
                files.append(str(item.relative_to(dir_path)))

    return files
