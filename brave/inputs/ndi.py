from brave.inputs.input import Input
from gi.repository import Gst
import brave.config as config


class NDIInput(Input):
    '''
    Handles input via NDI (Network Device Interface).
    NDI allows video to be transmitted over a network with low latency.
    Requires GStreamer NDI plugin (gst-plugins-ndi).
    '''
    def permitted_props(self):
        return {
            **super().permitted_props(),
            'ndi_name': {
                'type': 'str',
                'default': None,
            },
            'ndi_url': {
                'type': 'str',
                'default': None,
            },
            'ip_address': {
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
            },
            'latency': {
                'type': 'int',
                'default': 0,  # 0 for lowest latency
            },
            'bandwidth': {
                'type': 'int',
                'default': 0,  # 0 for highest bandwidth
            }
        }

    def create_elements(self):
        '''
        Create GStreamer pipeline for NDI input.
        ndisrc can connect via ndi-name, url-address, or ip-address.
        '''
        # Build ndisrc properties
        ndi_props = []

        if hasattr(self, 'ndi_name') and self.ndi_name:
            ndi_props.append(f'ndi-name="{self.ndi_name}"')
        elif hasattr(self, 'ndi_url') and self.ndi_url:
            ndi_props.append(f'url-address="{self.ndi_url}"')
        elif hasattr(self, 'ip_address') and self.ip_address:
            ndi_props.append(f'ip-address="{self.ip_address}"')

        # Add latency and bandwidth settings
        if hasattr(self, 'latency'):
            ndi_props.append(f'latency={self.latency}')
        if hasattr(self, 'bandwidth'):
            ndi_props.append(f'bandwidth={self.bandwidth}')

        ndi_props_str = ' '.join(ndi_props)

        # Build the pipeline string
        # NDI can carry both video and audio
        pipeline_str = (
            f'ndisrc {ndi_props_str} ! '
            'ndisrcdemux name=demux '
            'demux.video ! queue ! videoconvert ! videoscale ! '
            f'video/x-raw,width={self.width},height={self.height},framerate={self.framerate}/1 ! '
            + self.default_video_pipeline_string_end() +
            ' demux.audio ! queue ! audioconvert ! '
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
