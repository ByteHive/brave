FROM ubuntu:22.04

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && \
    apt-get install -yq \
    build-essential \
    gcc \
    g++ \
    git \
    cmake \
    wget \
    libffi-dev \
    gobject-introspection \
    gstreamer1.0-libav \
    gstreamer1.0-nice \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-tools \
    gir1.2-gst-plugins-bad-1.0 \
    libcairo2-dev \
    libgirepository1.0-dev \
    libgstreamer1.0-dev \
    libgstreamer-plugins-base1.0-dev \
    libgstreamer-plugins-bad1.0-dev \
    pkg-config \
    python3-dev \
    python3-wheel \
    python3-gst-1.0 \
    python3-pip \
    python3-gi \
    python3-websockets \
    python3-psutil \
    python3-uvloop \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install SRT library
RUN cd /tmp && \
    git clone --depth 1 --branch v1.5.3 https://github.com/Haivision/srt.git && \
    cd srt && \
    mkdir build && cd build && \
    cmake .. -DCMAKE_INSTALL_PREFIX=/usr && \
    make -j$(nproc) && \
    make install && \
    ldconfig && \
    cd / && rm -rf /tmp/srt

# Note: NDI SDK is proprietary and requires manual download from NewTek
# For NDI support, you need to:
# 1. Download NDI SDK from https://www.ndi.tv/sdk/
# 2. Extract and install the GStreamer NDI plugin
# 3. Uncomment and adapt the following lines:
#
# COPY ndi-sdk /tmp/ndi-sdk
# RUN cd /tmp/ndi-sdk && \
#     ./install.sh && \
#     cd / && rm -rf /tmp/ndi-sdk
#
# Install GStreamer NDI plugin:
# RUN cd /tmp && \
#     git clone https://github.com/teltek/gst-plugin-ndi.git && \
#     cd gst-plugin-ndi && \
#     meson build --prefix=/usr && \
#     ninja -C build && \
#     ninja -C build install && \
#     cd / && rm -rf /tmp/gst-plugin-ndi

# Clone Brave repository
RUN git clone --depth 1 https://github.com/bbc/brave.git /brave

# Install Python dependencies
WORKDIR /brave
RUN pip3 install --upgrade pip && \
    pip3 install pipenv sanic pyinstaller && \
    pipenv install --ignore-pipfile && \
    mkdir -p /usr/local/share/brave/output_images/

# Build single executable (optional)
# Uncomment to build as single executable:
# RUN pipenv run pyinstaller brave.spec && \
#     cp dist/brave /usr/local/bin/brave

EXPOSE 5000

# Run Brave
CMD ["pipenv", "run", "python3", "/brave/brave.py"]
