# Building Brave as a Single Executable

This document explains how to build Brave as a single standalone executable using PyInstaller.

## Prerequisites

1. Python 3.6+
2. All Brave dependencies installed (see main README.md)
3. PyInstaller

## Installation

Install PyInstaller and build dependencies:

```bash
pip install -r requirements-build.txt
```

## Building

### Option 1: Using PyInstaller directly

```bash
pyinstaller brave.spec
```

The executable will be created in the `dist/` directory.

### Option 2: Using Pipenv

```bash
pipenv install --dev
pipenv run pyinstaller brave.spec
```

### Option 3: Using Docker

Build the Docker image with the single executable:

```dockerfile
# Uncomment the build section in the Dockerfile, then:
docker build -t brave:latest .
```

## Running the Executable

Once built, you can run the executable directly:

```bash
./dist/brave
```

Or if you copied it to your PATH:

```bash
brave
```

## Notes

### Static Files

All static web UI files (HTML, CSS, JavaScript) are embedded into the executable using the `brave.embedded_resources` module. This means:

- No separate `public/` directory is needed at runtime
- The executable is truly standalone
- Updates to static files require rebuilding the executable

### GStreamer Plugins

The executable requires GStreamer and its plugins to be installed on the system:

- **SRT Support**: Requires libsrt and GStreamer SRT plugin (gst-plugins-bad with SRT support)
- **NDI Support**: Requires NDI SDK and GStreamer NDI plugin (see Dockerfile for installation instructions)

### Configuration Files

Configuration files are still read from the filesystem at runtime. The default configuration is embedded, but custom configs can be placed in the `config/` directory.

## Troubleshooting

### Missing Dependencies

If you get import errors when running the executable, you may need to add hidden imports to the `brave.spec` file:

```python
hiddenimports = [
    'your.missing.module',
]
```

### GStreamer Elements Not Found

Make sure GStreamer and all required plugins are installed on the system where you're running the executable:

```bash
# Verify GStreamer installation
gst-inspect-1.0 --version

# Check for specific plugins
gst-inspect-1.0 srtsrc   # For SRT
gst-inspect-1.0 ndisrc   # For NDI
```

### Large Executable Size

PyInstaller bundles all dependencies, which can result in a large executable. To reduce size:

1. Use UPX compression (enabled by default in brave.spec)
2. Exclude unnecessary modules in the spec file
3. Consider using a minimal Python installation

## Development vs Production

For development, it's recommended to run Brave directly with Python:

```bash
python3 brave.py
```

The single executable build is primarily intended for:

- Production deployments
- Systems without Python installed
- Simplified distribution
- Docker containers
