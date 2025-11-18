from brave.inputs.input import Input
from gi.repository import Gst
import brave.config as config


class SRTInput(Input):
    '''
    Handles input via SRT (Secure Reliable Transport).
    SRT is a transport protocol for low-latency video streaming.
    Requires GStreamer with SRT support (gst-plugins-bad with libsrt).
    '''
    def permitted_props(self):
        return {
            **super().permitted_props(),
            'uri': {
                'type': 'str',
                'default': None,
            },
            'host': {
                'type': 'str',
                'default': '0.0.0.0',
            },
            'port': {
                'type': 'int',
                'default': 8888,
            },
            'mode': {
                'type': 'str',
                'default': 'listener',  # listener, caller, or rendezvous
            },
            'latency': {
                'type': 'int',
                'default': 125,  # milliseconds
            },
            'passphrase': {
                'type': 'str',
                'default': None,
            },
            'width': {
                'type': 'int',
                'default': 1920
            },
            'height': {
                'type': 'int',
                'default': 1080
            },
            'framerate': {
                'type': 'int',
                'default': 30
            }
        }

    def create_elements(self):
        '''
        Create GStreamer pipeline for SRT input.
        SRT can work in listener (server), caller (client), or rendezvous mode.
        '''
        # Build SRT URI or use provided URI
        if hasattr(self, 'uri') and self.uri:
            srt_uri = self.uri
        else:
            # Build URI from host, port, and mode
            srt_uri = f'srt://{self.host}:{self.port}'
            if hasattr(self, 'mode') and self.mode:
                srt_uri += f'?mode={self.mode}'
                if hasattr(self, 'latency') and self.latency:
                    srt_uri += f'&latency={self.latency}'
                if hasattr(self, 'passphrase') and self.passphrase:
                    srt_uri += f'&passphrase={self.passphrase}'

        # Build the pipeline string
        # Use uridecodebin to handle the SRT stream and demux
        pipeline_str = (
            f'uridecodebin uri="{srt_uri}" name=decode '
            'decode. ! queue ! videoconvert ! videoscale ! '
            f'video/x-raw,width={self.width},height={self.height},framerate={self.framerate}/1 ! '
            + self.default_video_pipeline_string_end() +
            ' decode. ! queue ! audioconvert ! '
            + self.default_audio_pipeline_string_end()
        )

        if not self.create_pipeline_from_string(pipeline_str):
            return False

        self.intervideosink = self.pipeline.get_by_name('intervideosink')
        self.final_video_tee = self.pipeline.get_by_name('final_video_tee')
        self.final_audio_tee = self.pipeline.get_by_name('final_audio_tee')
        self.handle_updated_props()
        return True

    def get_input_cap_props(self):
        '''
        Parses the caps that arrive from the input, and returns them.
        This allows the height/width/framerate/audio_rate to be retrieved.
        '''
        elements = {}
        if hasattr(self, 'intervideosink'):
            elements['video'] = self.intervideosink

        props = {}
        for (audioOrVideo, element) in elements.items():
            if not element:
                return
            caps = element.get_static_pad('sink').get_current_caps()
            if not caps:
                return
            size = caps.get_size()
            if size == 0:
                return

            structure = caps.get_structure(0)
            props[audioOrVideo + '_caps_string'] = structure.to_string()
            if structure.has_field('framerate'):
                framerate = structure.get_fraction('framerate')
                props['framerate'] = framerate.value_numerator / framerate.value_denominator
            if structure.has_field('height'):
                props['height'] = structure.get_int('height').value
            if structure.has_field('width'):
                props['width'] = structure.get_int('width').value

        return props
