# Codebase AST & Architecture Digest: Android-cam

## 1. Directory Tree & Architecture Hierarchy
```text
📁 AWA/
  📁 app/
    📄 build.gradle.kts
    📁 src/
      📁 main/
        📁 java/
          📁 com/
            📁 sjbtechnologies/
              📁 awa/
                📄 HelpActivity.kt
                📄 MainActivity.kt
                📄 StreamService.kt
                📁 server/
                  📄 VideoStreamServer.kt
                📁 ui/
                  📁 components/
                    📄 CameraPreview.kt
                  📁 theme/
                    📄 Color.kt
                    📄 Theme.kt
                    📄 Type.kt
                📁 viewModel/
                  📄 CameraView.kt
        📁 resources/
          📁 static/
  📄 build.gradle.kts
  📄 settings.gradle.kts
📁 CLIENT/
  📁 awc-gui/
    📁 .cargo/
      📄 config.toml
    📄 Cargo.toml
    📁 resources/
      📁 drivers/
    📁 src/
      📁 core/
        📄 config.rs
        📄 mod.rs
        📄 state.rs
      📄 lib.rs
      📄 main.rs
      📁 network/
        📄 mod.rs
        📄 sync.rs
        📄 ws_client.rs
      📁 platform/
        📄 adb.rs
        📄 mod.rs
        📄 virtual_cam.rs
      📁 stream/
        📄 mf.rs
        📄 mod.rs
        📄 pipeline.rs
        📄 rtsp.rs
        📄 rtsp_client.rs
      📁 ui/
        📄 app.rs
        📄 controls.rs
        📄 header.rs
        📄 mod.rs
        📄 preview.rs
        📄 theme.rs
    📁 tests/
      📄 test_codec_switch_lag.rs
      📄 test_depacketizer.rs
      📄 test_fps_probe.rs
      📄 test_full_e2e_matrix.rs
      📄 test_live_4k.rs
      📄 test_live_hevc.rs
      📄 test_live_wifi.rs
      📄 test_mf_debug.rs
      📄 test_mf_enum.rs
      📄 test_mf_matrix.rs
      📄 test_mf_pipe.rs
      📄 test_mf_roundtrip.rs
      📄 test_stream_dump.rs
      📄 test_transport_switch.rs
📄 QUICKSTART.md
📄 README.md
📄 STATUS.md
📄 USB_CONNECTION.md
```

## 2. Package Manifests (Dependencies & Libraries)

### `CLIENT/awc-gui/Cargo.toml`
```
[package]
name = "awc-gui"
version = "1.0.0"
edition = "2021"

[lib]
name = "awc_gui"
path = "src/lib.rs"

[[bin]]
name = "awc-gui"
path = "src/main.rs"

[dependencies]
eframe = { version = "0.29", default-features = false, features = ["default_fonts", "glow"] }
egui = "0.29"
reqwest = { version = "0.12", default-features = false, features = ["blocking", "json"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
virtualcam = "1.0.0"
openh264 = "0.9.8"
rusty_h265 = "0.6.0"
windows = { version = "0.62", features = ["Win32_Foundation", "Win32_Graphics_Direct3D", "Win32_Graphics_Direct3D11", "Win32_Graphics_Dxgi", "Win32_Media_MediaFoundation", "Win32_System_Com", "Win32_System_Console", "Win32_System_Ole", "Win32_System_Variant"] }

# Dev-loop only: lighter debuginfo links noticeably faster, still debuggable.
[profile.dev]
debug = 1
```

## 3. Extracted Code Structure & AST Signatures

### `AWA/app/src/main/java/com/sjbtechnologies/awa/HelpActivity.kt` [Kotlin - 241 lines]
```kotlin
class HelpActivity : ComponentActivity() 
override fun onCreate(savedInstanceState: Bundle?) 
fun HelpContent(modifier: Modifier = Modifier) 
fun ApiEndpointCard(
```

### `AWA/app/src/main/java/com/sjbtechnologies/awa/MainActivity.kt` [Kotlin - 695 lines]
```kotlin
class MainActivity : ComponentActivity() 
override fun onCreate(savedInstanceState: Bundle?) 
private fun activityViewModel(): CameraViewModel =
override fun onPause() 
override fun onResume() 
fun CameraScreen(camView: CameraViewModel = viewModel()) 
private fun CameraContent(camView: CameraViewModel) 
fun SettingsPanel(
fun VideoCodecSelector(camView: CameraViewModel, settings: CameraViewModel.CameraSettings) 
fun FpsDropdown(camView: CameraViewModel, settings: CameraViewModel.CameraSettings) 
fun ResolutionDropdown(camView: CameraViewModel, settings: CameraViewModel.CameraSettings) 
fun RotationDropdown(camView: CameraViewModel, settings: CameraViewModel.CameraSettings) 
fun getLocalIpAddress(): String? 
fun checkPermissions(
fun isAllGranted() = permissions.all { permission ->
```

### `AWA/app/src/main/java/com/sjbtechnologies/awa/StreamService.kt` [Kotlin - 186 lines]
```kotlin
class StreamService : Service() 
fun start(context: Context) 
fun stop(context: Context) 
fun stopIntent(context: Context): PendingIntent 
override fun onBind(intent: Intent?): IBinder? = null
override fun onCreate() 
override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int 
override fun onDestroy() 
private fun buildNotification(): Notification 
private fun acquireWakeLock() 
private fun releaseWakeLock() 
private fun shutdownStream() 
object StreamServiceStop 
fun requestStop() 
fun consumeStop(): Boolean 
```

### `AWA/app/src/main/java/com/sjbtechnologies/awa/server/VideoStreamServer.kt` [Kotlin - 287 lines]
```kotlin
object VideoStreamServer 
data class FeaturesResponse(
data class SettingsResponse(
data class SettingsUpdateRequest(
suspend fun broadcastSettingsUpdate() 
fun toggleServer(port: Int = 8080) 
fun start(port: Int = 8080) 
fun stop() 
```

### `AWA/app/src/main/java/com/sjbtechnologies/awa/ui/components/CameraPreview.kt` [Kotlin - 53 lines]
```kotlin
fun Preview(
```

### `AWA/app/src/main/java/com/sjbtechnologies/awa/ui/theme/Theme.kt` [Kotlin - 57 lines]
```kotlin
fun AWATheme(
```

### `AWA/app/src/main/java/com/sjbtechnologies/awa/viewModel/CameraView.kt` [Kotlin - 994 lines]
```kotlin
class CameraViewModel : ViewModel() 
enum class FocusMode 
enum class StreamResolution(
fun fromString(str: String): StreamResolution? 
data class CameraSettings(
fun initialize(context: Context) 
override fun onOrientationChanged(orientation: Int) 
fun attachOpenGlView(view: OpenGlView) 
fun toggleServer() 
fun detachOpenGlView() 
private fun resolveActiveCameraId(): String? 
private fun registerAvailabilityWatchdog(context: Context) 
override fun onCameraAvailable(cameraId: String) 
override fun onCameraUnavailable(cameraId: String) 
private fun healCameraSession(reason: String) 
fun pauseCamera() 
fun setScreenOffStreaming(enabled: Boolean) 
fun resumeCamera() 
private fun updateCameraRanges(context: Context, lensFacing: Int) 
fun setVideoCodec(codec: String) 
private fun updateSupportedResolutions(context: Context, lensFacing: Int) 
private fun buildConnectChecker() = object : ConnectChecker 
override fun onConnectionStarted(url: String) 
override fun onConnectionSuccess() 
override fun onConnectionFailed(reason: String) 
override fun onNewBitrate(bitrate: Long) 
override fun onDisconnect() 
override fun onAuthError() 
override fun onAuthSuccess() 
private suspend fun startRtspCamera() 
override fun onRenderError(e: RuntimeException) 
private fun stopRtspCamera() 
private fun effectiveStreamRotation(): Int 
private fun applyStreamRotation() 
fun setPreviewResolution(width: Int, height: Int) 
fun startStream() 
private fun requestStreamStart(settleMs: Long = 300) 
private fun stopActiveStream() 
private fun restartRtspCamera(reason: String) 
private fun scheduleSpsRetry() 
fun notifyScreenTapped() 
fun tapToFocus(view: View, event: MotionEvent) 
fun toggleFocusMode() 
fun setCameraFacing(front: Boolean) 
fun switchCamera() 
fun setFocusDistance(distance: Float) 
fun cancelFocusAndMetering() 
fun setRotation(mode: String) 
fun applyFlash(enabled: Boolean) 
fun toggleFlash() 
fun setResolution(res: StreamResolution) 
fun setFps(fps: Int) 
fun setZoom(ratio: Float) 
fun setExposure(index: Int) 
override fun onCleared() 
```

### `CLIENT/awc-gui/src/core/state.rs` [Rust - 177 lines]
```rust
pub struct PhoneSettings 
pub struct PhoneFeatures 
fn default_exposure_min() -> i32 { -12 }
fn default_exposure_max() -> i32 { 12 }
fn default_zoom_min() -> f32 { 1.0 }
fn default_zoom_max() -> f32 { 5.0 }
impl Default for PhoneFeatures 
fn default() -> Self 
pub struct PreviewFrame 
pub enum ControlStage 
pub enum StreamStage 
impl StreamStage 
pub fn as_str(self) -> &'static str 
pub struct SharedAppState 
impl Default for SharedAppState 
fn default() -> Self 
```

### `CLIENT/awc-gui/src/main.rs` [Rust - 250 lines]
```rust
fn ensure_console() 
fn ensure_console() {}
fn print_usage() 
fn run_headless(args: &[String]) -> eframe::Result<()> 
fn main() -> eframe::Result<()> 
```

### `CLIENT/awc-gui/src/network/sync.rs` [Rust - 272 lines]
```rust
fn query_to_json_update(cmd: &str) -> String 
fn apply_settings(s: &mut SharedAppState, settings: PhoneSettings) 
fn refresh_features(
pub fn sync_worker(state: Arc<Mutex<SharedAppState>>, running: Arc<AtomicBool>) 
```

### `CLIENT/awc-gui/src/network/ws_client.rs` [Rust - 196 lines]
```rust
pub struct WebSocketClient 
impl WebSocketClient 
pub fn connect(host: &str, port: u16, timeout: Duration) -> Result<Self, String> 
pub fn send_text(&mut self, text: &str) -> Result<(), String> 
pub fn read_text(&mut self) -> Result<Option<String>, String> 
```

### `CLIENT/awc-gui/src/platform/adb.rs` [Rust - 82 lines]
```rust
pub fn is_adb_device_connected() -> bool 
pub fn usb_device_serial() -> Option<String> 
fn run_single_forward(serial: &Option<String>, port: u16) -> Result<(), String> 
pub fn run_adb_forward() -> Result<String, String> 
```

### `CLIENT/awc-gui/src/platform/virtual_cam.rs` [Rust - 180 lines]
```rust
pub struct VirtualCamera 
fn is_driver_registered() -> bool 
fn get_bundled_driver_dir() -> Option<PathBuf> 
fn ensure_bundled_driver_installed() 
impl VirtualCamera 
pub fn new(width: u32, height: u32, fps: f64) -> Self 
pub fn recreate(&mut self, width: u32, height: u32, fps: f64) 
fn build_camera(&mut self, fps: f64) 
pub fn send_nv12(&mut self, nv12_data: &[u8]) -> Result<(), String> 
pub fn is_active(&self) -> bool 
```

### `CLIENT/awc-gui/src/stream/mf.rs` [Rust - 2000 lines]
```rust
fn mf_ensure_started() -> Result<(), String> 
fn com_ensure_init() 
fn dbg_log(msg: String) 
struct D3DState 
fn create_d3d_state() -> Result<D3DState, String> 
fn attach_d3d_manager(mft: &IMFTransform, st: &D3DState) -> Result<(), String> 
fn annexb_offset(nalu: &[u8]) -> Option<usize> 
fn to_avcc(nalu: &[u8], out: &mut Vec<u8>) -> bool 
fn build_avcc(sps: &[u8], pps: &[u8]) -> Option<Vec<u8>> 
fn build_hvcc(vps: &[u8], sps: &[u8], pps: &[u8]) -> Option<Vec<u8>> 
fn make_input_sample(payload: &[u8], ts: i64) -> Result<IMFSample, String> 
fn make_2d_nv12_sample(w: u32, h: u32) -> Result<IMFSample, String> 
fn copy_2d_nv12_to_vec(sample: &IMFSample, w: u32, h: u32, out: &mut Vec<u8>) -> Result<(), String> 
fn fill_2d_nv12_from_contiguous(sample: &IMFSample, w: u32, h: u32, src: &[u8]) -> Result<(), String> 
fn frame_size_of(mt: &IMFMediaType) -> Result<(u32, u32), String> 
fn enrich_input_type(mt: &IMFMediaType, w: u32, h: u32) -> Result<(), String> 
fn new_video_type(subtype: &GUID, w: u32, h: u32, blob: Option<&[u8]>) -> Result<IMFMediaType, String> 
struct MftPipe 
impl MftPipe 
fn create_decoder(codec: RtspCodec) -> Result<Self, String> 
fn create_processor() -> Result<Self, String> 
fn set_input(&self, mt: &IMFMediaType) -> Result<(), String> 
fn set_output_prefer_nv12(&self) -> Result<IMFMediaType, String> 
fn refresh_output_type(&self) -> Result<IMFMediaType, String> 
fn feed(&self, sample: &IMFSample) -> Result<(), String> 
fn log_stream_info(&self) 
fn drain_into(&self, out_sample: &IMFSample) -> Result<bool, String> 
pub fn mf_avcc_roundtrip_check() 
fn packet_to_annexb(pkt: &[u8], out: &mut Vec<u8>) 
pub fn mf_roundtrip_selftest() -> Result<(usize, usize, (u32, u32)), String> 
fn drain_mft_to_packets(mft: &IMFTransform, packets: &mut Vec<Vec<u8>>) -> Result<usize, String> 
fn split_annexb(stream: &[u8]) -> Vec<Vec<u8>> 
fn drain_once(pipe: &MftPipe) -> Result<bool, String> 
pub fn mf_replay_bytes(data: &[u8]) -> Result<(usize, usize), String> 
pub fn mf_file_replay(path: &str) -> Result<(usize, usize), String> 
fn crop_nv12_padded(src: &[u8], w: usize, coded_h: usize, h: usize) -> Option<Vec<u8>> 
pub fn mf_selftest_processor() -> Result<Vec<u8>, String> 
pub fn mf_processor_throughput(
pub struct MfRtspDecoder 
impl MfRtspDecoder 
pub fn new(codec: RtspCodec) -> Result<Self, String> 
pub fn codec(&self) -> RtspCodec 
pub fn prime(&mut self, sps_pps: &[Vec<u8>]) 
pub fn prime_avcc_blob(&mut self, blob: &[u8]) 
fn ingest_params(&mut self, nalu: &[u8]) -> bool 
fn params_complete(&self) -> bool 
fn feed_bytes(&mut self, payload: &[u8]) -> Result<(), String> 
fn feed_stored_params(&mut self, annexb_mode: bool) -> Result<(), String> 
fn header_blob(&self) -> Option<Vec<u8>> 
fn subtype(&self) -> &'static GUID 
fn apply_codecapi(&self) 
fn ensure_pipeline(&mut self) -> Result<(), String> 
fn ensure_processor(&mut self, dst_w: u32, dst_h: u32) -> Result<(), String> 
fn is_param_set(nalu_body: &[u8], codec: RtspCodec) -> bool 
fn is_slice(nalu_body: &[u8], codec: RtspCodec) -> bool 
fn adopt_output_dims(&mut self) 
fn output_sample(&mut self) -> Result<IMFSample, String> 
fn drain_decoder(&mut self) -> Result<Option<Vec<u8>>, String> 
pub fn decode_nalu_ignore(&mut self, nalu: &[u8]) 
pub fn decode_into_target(
fn finish_frame(
```

### `CLIENT/awc-gui/src/stream/mod.rs` [Rust - 557 lines]
```rust
enum ActiveDecoder 
impl ActiveDecoder 
fn create(codec: crate::stream::rtsp_client::RtspCodec, sps_pps: &[Vec<u8>]) -> Self 
fn health(&self) -> DecoderHealth 
fn decode_into_target(
fn send_preview_best_effort(sender: &SyncSender<PreviewFrame>, frame: PreviewFrame) 
struct RacerTarget 
enum RacerOutcome 
struct Racer 
fn set_stream_stage(state: &Arc<Mutex<SharedAppState>>, stage: StreamStage) 
fn spawn_racer(ip: &str, generation: u64) -> Racer 
fn race_session(ip: &str, generation: u64) -> RacerOutcome 
pub fn stream_worker(
```

### `CLIENT/awc-gui/src/stream/pipeline.rs` [Rust - 186 lines]
```rust
pub fn scale_i420_to_nv12(
pub fn scale_raw_i420_to_nv12(
pub fn scale_nv12(
```

### `CLIENT/awc-gui/src/stream/rtsp.rs` [Rust - 493 lines]
```rust
pub struct DecoderHealth 
pub enum InProcessRtspDecoder 
pub struct DecodeResult 
impl InProcessRtspDecoder 
pub fn new(codec: RtspCodec) -> Result<Self, String> 
fn new_h265(parameter_sets: Vec<Vec<u8>>) -> Self 
pub fn set_parameter_sets(&mut self, sets: &[Vec<u8>]) 
pub fn health(&self) -> DecoderHealth 
pub fn decode_into_target(
pub fn decode_into(
pub fn decode_nalu_ignore(&mut self, nalu: &[u8]) 
pub fn is_keyframe_or_parameter(nalu: &[u8], codec: RtspCodec) -> bool 
pub fn calculate_preview_dimensions(src_w: usize, src_h: usize) -> (usize, usize) 
fn yuv420_to_sampled_rgba(
pub fn nv12_to_sampled_rgba(
fn raw_i420_to_sampled_rgba(
fn raw_i420_to_sampled_rgba_strided(
```

### `CLIENT/awc-gui/src/stream/rtsp_client.rs` [Rust - 663 lines]
```rust
pub enum RtspCodec 
fn set_low_latency_socket_buffer(stream: &TcpStream) 
fn setsockopt(
fn set_low_latency_socket_buffer(_stream: &TcpStream) {}
pub struct RtpStats 
pub struct RtpHeader 
impl RtpHeader 
pub fn parse(buf: &[u8]) -> Option<RtpHeader> 
pub fn strip_rtp_framing(packet: &[u8], header_len: usize, padding: bool) -> Option<&[u8]> 
fn annexb(nalu: &[u8]) -> Vec<u8> 
fn split_aggregate(mut body: &[u8]) -> Vec<Vec<u8>> 
fn push_capped(fu_buffer: &mut Vec<u8>, data: &[u8], stats: &mut RtpStats) 
pub struct RtspSession 
impl RtspSession 
pub fn connect(phone_ip: &str, port: u16) -> Result<Self, String> 
fn send_request(&mut self, req: &str) -> Result<String, String> 
fn handshake(&mut self, phone_ip: &str, port: u16) -> Result<(), String> 
fn parse_sdp_sps_pps(&mut self, sdp: &str) 
pub fn has_backlog(&self) -> bool 
pub fn reader_buffer_len(&self) -> usize 
pub fn read_next_nalu(&mut self) -> Result<Option<Vec<u8>>, String> 
fn consume_packet(&mut self, packet: &[u8]) -> Option<Vec<u8>> 
pub fn depacketize_payload(
fn drain_aggregate(
fn depacketize_h265(
fn depacketize_h264(
fn decode_base64(input: &str) -> Option<Vec<u8>> 
```

### `CLIENT/awc-gui/src/ui/app.rs` [Rust - 140 lines]
```rust
pub struct AwcApp 
impl AwcApp 
pub fn new(state: Arc<Mutex<SharedAppState>>, preview_rx: Receiver<PreviewFrame>) -> Self 
impl eframe::App for AwcApp 
fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) 
```

### `CLIENT/awc-gui/src/ui/controls.rs` [Rust - 440 lines]
```rust
fn format_resolution_label(res: &str) -> String 
fn segmented_btn(ui: &mut egui::Ui, active: bool, label: &str) -> bool 
fn spawn_adb_forward(forward_status: &Arc<Mutex<String>>) 
pub fn render_controls(
```

### `CLIENT/awc-gui/src/ui/header.rs` [Rust - 95 lines]
```rust
pub fn render_header(ctx: &egui::Context, state: &SharedAppState) 
```

### `CLIENT/awc-gui/src/ui/preview.rs` [Rust - 154 lines]
```rust
pub fn render_preview(
```

### `CLIENT/awc-gui/src/ui/theme.rs` [Rust - 151 lines]
```rust
pub fn setup_shadcn_theme(ctx: &egui::Context) 
pub fn card<R>(ui: &mut egui::Ui, add_contents: impl FnOnce(&mut egui::Ui) -> R) -> R 
pub fn section_header(ui: &mut egui::Ui, icon: &str, title: &str) 
pub fn badge(ui: &mut egui::Ui, is_active: bool, text_active: &str, text_inactive: &str) 
```

### `CLIENT/awc-gui/tests/test_codec_switch_lag.rs` [Rust - 132 lines]
```rust
fn send_setting(payload: &str) -> bool 
fn test_live_stream_worker_codec_switch_resilience() 
```

### `CLIENT/awc-gui/tests/test_depacketizer.rs` [Rust - 474 lines]
```rust
struct Depacketizer 
impl Depacketizer 
fn new(codec: RtspCodec) -> Self 
fn feed(&mut self, seq: u16, packet: &[u8]) -> Option<Vec<u8>> 
fn drain_pending(&mut self) -> Vec<Vec<u8>> 
fn rtp_packet(payload: &[u8], pad: usize, csrc: &[u32], ext_words: Option<&[u8]>) -> Vec<u8> 
fn stap_a(nalus: &[&[u8]]) -> Vec<u8> 
fn h265_ap(nalus: &[&[u8]]) -> Vec<u8> 
fn h265_fu(orig_type: u8, start: bool, end: bool, body: &[u8]) -> Vec<u8> 
fn h264_fua(orig_type: u8, start: bool, end: bool, body: &[u8]) -> Vec<u8> 
fn h264_reconstructed(orig_type: u8) -> u8 
fn header_rejects_non_rtp2_version() 
fn header_rejects_truncated_packet() 
fn header_accounts_for_csrc_list() 
fn header_accounts_for_rtp_extension() 
fn header_accounts_for_csrc_and_extension_together() 
fn padding_is_stripped_from_single_nal() 
fn padding_stripped_from_whole_packet_pad_length() 
fn malformed_padding_is_rejected_not_applied() 
fn zero_padding_is_rejected() 
fn stap_a_fans_out_every_inner_nalu() 
fn stap_a_with_single_nalu_emits_it() 
fn stap_a_malformed_tail_does_not_panic_or_spin() 
fn stap_a_zero_length_inner_nalu_rejects_the_aggregate() 
fn aggregation_overflow_is_bounded() 
fn fu_a_multi_packet_reassembles() 
fn fu_a_single_fragment_completes_immediately() 
fn fu_a_padding_does_not_corrupt_the_tail() 
fn fu_a_continuation_without_start_is_dropped() 
fn fu_a_start_restarts_a_stale_fragment() 
fn lost_fragment_discards_partial_nalu() 
fn sequence_wraparound_is_contiguous() 
fn oversized_fragment_is_capped_not_allocated() 
fn h265_ap_fans_out_every_inner_nalu() 
fn h265_single_nalu_passthrough() 
fn h265_fu_reassembles_and_restores_original_type() 
fn h265_lost_fragment_discards_partial_nalu() 
fn h265_fu_single_fragment_completes() 
fn malformed_packet_counts_and_continues() 
```

### `CLIENT/awc-gui/tests/test_fps_probe.rs` [Rust - 175 lines]
```rust
fn http_get(path: &str) -> Result<String, String> 
fn json_field(body: &str, key: &str) -> String 
fn foreground_awa() 
fn set_phone(camera: &str, res: &str, codec: &str) -> (String, String, String) 
fn nalu_slice_type(nalu: &[u8], h265: bool) -> Option<u8> 
fn probe_wire_fps(secs: u64) -> (Vec<u32>, [u32; 64]) 
fn test_wire_fps_and_hevc() 
```

### `CLIENT/awc-gui/tests/test_full_e2e_matrix.rs` [Rust - 454 lines]
```rust
fn decode_b64(input: &str) -> Option<Vec<u8>> 
fn send_setting(payload: &str) -> bool 
struct StreamStats 
fn sample_rtsp_stream(target_frames: usize, timeout_secs: u64) -> Result<StreamStats, String> 
fn test_full_release_matrix_on_hardware() 
struct TestCase 
```

### `CLIENT/awc-gui/tests/test_live_4k.rs` [Rust - 62 lines]
```rust
fn test_live_4k_streaming_realtime() 
```

### `CLIENT/awc-gui/tests/test_live_hevc.rs` [Rust - 237 lines]
```rust
fn decode_b64(input: &str) -> Option<Vec<u8>> 
fn test_live_hevc_decoding() 
```

### `CLIENT/awc-gui/tests/test_live_wifi.rs` [Rust - 63 lines]
```rust
fn test_live_wifi_streaming_realtime() 
```

### `CLIENT/awc-gui/tests/test_mf_debug.rs` [Rust - 144 lines]
```rust
fn test_mf_file_replay() 
fn test_mf_live_replay() 
fn test_sw_baseline_1080() 
fn test_mf_debug_bringup() 
```

### `CLIENT/awc-gui/tests/test_mf_enum.rs` [Rust - 73 lines]
```rust
fn list_decoders(subtype: &windows::core::GUID, label: &str) 
fn test_mf_enum_decoders() 
```

### `CLIENT/awc-gui/tests/test_mf_matrix.rs` [Rust - 314 lines]
```rust
struct ComboResult 
fn http_get(path: &str) -> Result<String, String> 
fn json_field(body: &str, key: &str) -> String 
fn foreground_awa() 
fn set_phone(camera: &str, res: &str, codec: &str) -> (String, String, String) 
struct FrameStats 
fn wait_rtsp_ready() -> Result<(), String> 
fn run_capture(use_mf: bool, secs: u64) -> Result<(FrameStats, f64, String), String> 
enum Dec 
fn summarize(
fn print_table(results: &[ComboResult]) 
fn test_mf_perf_matrix() 
```

### `CLIENT/awc-gui/tests/test_mf_pipe.rs` [Rust - 30 lines]
```rust
fn test_mf_processor_loopback() 
fn test_mf_processor_throughput() 
```

### `CLIENT/awc-gui/tests/test_mf_roundtrip.rs` [Rust - 23 lines]
```rust
fn test_avcc_conversion_lossless() 
fn test_mf_roundtrip() 
```

### `CLIENT/awc-gui/tests/test_stream_dump.rs` [Rust - 63 lines]
```rust
fn test_stream_dump() 
```

### `CLIENT/awc-gui/tests/test_transport_switch.rs` [Rust - 91 lines]
```rust
fn drain_preview(
fn switch_to(state: &Arc<Mutex<SharedAppState>>, ip: &str) 
fn test_transport_switch_make_before_break() 
```

