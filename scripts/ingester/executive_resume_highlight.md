This project is a "goldmine" for a systems resume because it touches every layer of the stack: **Kernel/Driver $\rightarrow$ OS API $\rightarrow$ Network Protocol $\rightarrow$ Hardware Acceleration $\rightarrow$ Mobile Internals.** 

Most candidates just "use a library." You built the pipeline. Here is how we frame this to signal "Staff/Principal" level craftsmanship.

***

# 1. Executive Project Header

**AWA (Android Wireless Adapter)** | *High-Performance Cross-Platform Virtual Camera Pipeline*
**Value Prop:** A low-latency, hardware-accelerated streaming system that transforms an Android device into a system-level Windows webcam via a custom RTSP/RTP implementation and GPU-accelerated decoding.

*   **Systems/Rust:** Rust 2021, Windows API (Win32), COM, Direct3D11, `eframe`/`egui`.
*   **Android/Mobile:** Kotlin, Camera2 API, Ktor (WebSockets), Android Service/WakeLocks.
*   **Video & Media:** H.264/H.265 (HEVC), Windows Media Foundation (MF), NV12/I420 Color Spaces, NALU Depacketization.
*   **Networking:** RTSP/RTP, TCP Socket Tuning, Custom Wire Protocols, ADB Port Forwarding.
*   **Architecture Tier:** Full-Stack Systems Engineering (Mobile $\rightarrow$ Network $\rightarrow$ OS Driver).

***

# 2. Executive Resume Bullets

*   **Architected a cross-platform, low-latency 4K video pipeline** bridging Android Camera2 internals with a high-performance Rust desktop client, achieving sub-second glass-to-glass latency for professional-grade streaming.
*   **Engineered a hardware-accelerated decoding engine** utilizing Windows Media Foundation and Direct3D11, implementing zero-copy memory transfers and NV12 color space conversion to minimize CPU overhead and maximize frame throughput.
*   **Developed a custom RTP depacketizer in Rust** to handle complex H.264/H.265 NALU reassembly (including FU-A and STAP-A fragments), implementing robust sequence wraparound logic and TCP socket buffer optimization to eliminate jitter.
*   **Implemented a system-level virtual camera driver injection layer**, enabling the remote Android stream to be recognized as a native Windows hardware device for seamless integration with third-party applications (Zoom, OBS, Microsoft Teams).
*   **Designed a fault-tolerant bi-directional control plane** using an embedded Ktor WebSocket server and a background Android Service with WakeLock and session-healing watchdogs, ensuring stream stability and remote parameter tuning (FPS, Resolution, Zoom) under unstable network conditions.

***

# 3. "Under-the-Hood" Technical Highlights (For Interviews)

*   **Bitstream Transformation (Annex-B $\rightarrow$ AVCC):** Solved the incompatibility between network-streamed H.264 (Annex-B) and Windows Media Foundation's requirement for AVCC/HVCC formatted headers. Implemented a custom parser to extract SPS/PPS parameter sets and rebuild the bitstream on-the-fly for the hardware decoder.
*   **RTP Fragmentation & Reassembly:** Built a state-machine-based depacketizer to handle fragmented NAL units. Solved the "lost fragment" problem by implementing a discard-and-sync mechanism that prevents memory leaks and decoder crashes when RTP packets arrive out of order or are dropped.
*   **GPU Memory Orchestration:** Managed the lifecycle of `IMFSample` and `IMFTransform` within the Windows COM environment. Optimized the pipeline by locking D3D11 surfaces and performing direct memory copies into the virtual camera's NV12 buffer, bypassing expensive CPU-side color conversions.

***

# 4. Why This Impresses a Hiring Manager

**The Signal:** This project demonstrates that the candidate is not just a "feature developer," but a **Systems Engineer**. 

1.  **Deep OS Knowledge:** Working with Windows Media Foundation, COM, and Virtual Camera drivers proves they can navigate undocumented or complex OS APIs—a requirement for any Principal role at Apple, Meta, or Google.
2.  **Protocol Mastery:** Implementing RTP/RTSP from the ground up (rather than using a wrapper) shows they understand the physics of networking: jitter, packet fragmentation, and buffer bloat.
3.  **Performance Obsession:** The focus on "zero-copy," "hardware acceleration," and "socket tuning" signals a mindset geared toward HFT-level efficiency and high-scale systems.